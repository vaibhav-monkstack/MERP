const pool = require('../config/db');
const { recordStockMovement } = require('./stockController');

// GET ALL REQUESTS — Returns all material requests, newest first
exports.getRequests = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requests ORDER BY requested_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getRequests error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ADD REQUEST — Creates a new material request for a job
exports.addRequest = async (req, res) => {
  const { job_id, material, quantity, requested_by } = req.body;
  const requestedQty = Number(quantity) || 0;

  if (!material || requestedQty <= 0) {
    return res.status(400).json({ success: false, error: 'Material and positive quantity are required.' });
  }

  try {
    const [materialRows] = await pool.query(
      'SELECT * FROM materials WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
      [material]
    );

    if (materialRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Material not found in inventory. Cannot create request.' });
    }

    const inventoryMaterial = materialRows[0];
    const availableQty = Number(inventoryMaterial.quantity || 0);

    if (availableQty < requestedQty) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create request because available inventory is less than requested quantity.'
      });
    }

    const request_id = 'REQ-' + Date.now();
    const [result] = await pool.query(
      'INSERT INTO requests (request_id, job_id, material, quantity, requested_by, status) VALUES (?, ?, ?, ?, ?, ?)',
      [request_id, job_id, material, requestedQty, requested_by, 'Pending']
    );

    res.status(201).json({ 
      success: true, 
      message: 'Request created',
      data: { id: result.insertId, request_id, job_id, material, quantity: requestedQty, requested_by, status: 'Pending' } 
    });
  } catch (err) {
    console.error('addRequest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE REQUEST STATUS — Approves or rejects a material request.
// KEY INTEGRATION POINT: After updating, checks if all requests for the
// linked job are now resolved, and automatically updates the job status:
//   → All Approved:  job status becomes 'Materials Ready' (unlocks scheduling)
//   → Any Rejected:  job status becomes 'Material Shortage' (blocks scheduling)
exports.updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Only allow valid status transitions
  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const [existingRows] = await pool.query('SELECT * FROM requests WHERE id=?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = existingRows[0];
    const shouldDeduct = request.status !== 'Approved' && status === 'Approved';

    console.log(`🔍 Request #${id}: Material="${request.material}", CurrentStatus="${request.status}", NewStatus="${status}", ShouldDeduct=${shouldDeduct}`);

    // ✅ ALWAYS validate material availability when approving (regardless of previous status)
    if (status === 'Approved') {
      const [materialRows] = await pool.query(
        'SELECT * FROM materials WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) ORDER BY id LIMIT 1',
        [request.material]
      );

      console.log(`🔍 Material search for "${request.material}": Found ${materialRows.length} matches`);

      // ✅ Check if material exists in inventory
      if (materialRows.length === 0) {
        console.warn(`❌ Material "${request.material}" NOT FOUND in inventory!`);
        return res.status(400).json({
          success: false,
          error: `Cannot approve: Material "${request.material}" not found in inventory.`
        });
      }

      const material = materialRows[0];
      const currentQty = Number(material.quantity || 0);
      const deduction = Number(request.quantity || 0);

      console.log(`📦 Material found: "${material.name}", Available: ${currentQty}, Requested: ${deduction}`);

      // ✅ Check if enough inventory is available
      if (currentQty < deduction) {
        console.warn(`❌ Insufficient inventory! Need ${deduction}, but only ${currentQty} available.`);
        return res.status(400).json({
          success: false,
          error: `Cannot approve: Insufficient inventory. Need ${deduction} units of "${request.material}", but only ${currentQty} available.`
        });
      }

      console.log(`✅ Material check passed! Deducting ${deduction} units...`);

      if (shouldDeduct) {
        const newQuantity = currentQty - deduction;

        await pool.query('UPDATE materials SET quantity=? WHERE id=?', [newQuantity, material.id]);
        await recordStockMovement(
          { ...material, quantity: newQuantity },
          'Request Approved',
          -deduction,
          newQuantity,
          `Approved request ${request.request_id}`,
          'Request',
          id
        );
        console.log(`✅ Stock deducted: ${currentQty} → ${newQuantity}`);
      }
    }

    await pool.query('UPDATE requests SET status=? WHERE id=?', [status, id]);
    console.log(`✅ Request #${id} status updated to "${status}"`);


    // Fetch the updated request to get the linked job_id
    const [rows] = await pool.query('SELECT * FROM requests WHERE id=?', [id]);
    const updatedRequest = rows[0];


    // === AUTO JOB STATUS UPDATE — Only runs when a request is linked to a job ===
    if (updatedRequest && updatedRequest.job_id) {
      const jobId = updatedRequest.job_id;

      if (status === 'Rejected') {
        // Any rejection immediately flags the job as having a material shortage
        await pool.query(
          "UPDATE jobs SET status='Material Shortage' WHERE id=?",
          [jobId]
        );
        console.log(`⚠️  Job ${jobId} flagged as 'Material Shortage' due to rejected request #${id}`);
      } else if (status === 'Approved') {
        const [pendingRows] = await pool.query(
          "SELECT COUNT(*) as pendingCount FROM requests WHERE job_id=? AND status='Pending'",
          [jobId]
        );
        const pendingCount = pendingRows[0].pendingCount;

        if (pendingCount === 0) {
          const [rejectedRows] = await pool.query(
            "SELECT COUNT(*) as rejectedCount FROM requests WHERE job_id=? AND status='Rejected'",
            [jobId]
          );
          if (rejectedRows[0].rejectedCount === 0) {
            await pool.query(
              "UPDATE jobs SET status='Materials Ready' WHERE id=? AND status='Created'",
              [jobId]
            );
            console.log(`✅ Job ${jobId} is now 'Materials Ready'`);
          }
        }
      }
    }

    // === AUTO ORDER STATUS UPDATE — Runs when a request is linked to an order ===
    if (request && request.order_id) {
      const orderId = request.order_id;
      
      if (status === 'Approved') {
        const [pendingRows] = await pool.query(
          "SELECT COUNT(*) as pendingCount FROM requests WHERE order_id=? AND status='Pending'",
          [orderId]
        );
        if (pendingRows[0].pendingCount === 0) {
          await pool.query("UPDATE orders SET status='ready_to_approve' WHERE id=?", [orderId]);
          await pool.query('INSERT INTO order_history (order_id, status, remarks) VALUES (?, ?, ?)', 
            [orderId, 'ready_to_approve', 'All material requirements fulfilled. Ready for Production Approval.']);
          console.log(`✅ Order #${orderId} synced to 'ready_to_approve'`);
        }
      }
    }

    res.json({ 
      success: true, 
      message: `Request ${status.toLowerCase()} successfully` 
    });
  } catch (err) {
    console.error('updateRequestStatus error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE REQUEST — Permanently removes a material request
exports.deleteRequest = async (req, res) => {
  try {
    await pool.query('DELETE FROM requests WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (err) {
    console.error('deleteRequest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
