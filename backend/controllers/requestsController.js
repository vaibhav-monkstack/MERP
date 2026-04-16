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

    // Stock deduction logic
    if (shouldDeduct) {
      const [materialRows] = await pool.query(
        'SELECT * FROM materials WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) ORDER BY id LIMIT 1',
        [request.material]
      );

      if (materialRows.length > 0) {
        const material = materialRows[0];
        const currentQty = Number(material.quantity || 0);
        const deduction = Number(request.quantity || 0);
        const newQuantity = Math.max(currentQty - deduction, 0);

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
      } else {
        console.warn(`Material not found for approved request ${request.request_id}`);
      }
    }
    await pool.query('UPDATE requests SET status=? WHERE id=?', [status, id]);

    // === AUTO JOB STATUS UPDATE — Only runs when a request is linked to a job ===
    if (request && request.job_id) {
      const jobId = request.job_id;

      if (status === 'Rejected') {
        // Any rejection immediately flags the job as having a material shortage
        await pool.query(
          "UPDATE jobs SET status='Material Shortage' WHERE id=?",
          [jobId]
        );
        console.log(`⚠️  Job ${jobId} flagged as 'Material Shortage' due to rejected request #${id}`);
      } else if (status === 'Approved') {
        // Check if ALL requests for this job are now resolved (none still Pending)
        const [pendingRows] = await pool.query(
          "SELECT COUNT(*) as pendingCount FROM requests WHERE job_id=? AND status='Pending'",
          [jobId]
        );
        const pendingCount = pendingRows[0].pendingCount;

        if (pendingCount === 0) {
          // All material requests have been resolved.
          // Check none are rejected either (if any rejected, the shortage takes priority)
          const [rejectedRows] = await pool.query(
            "SELECT COUNT(*) as rejectedCount FROM requests WHERE job_id=? AND status='Rejected'",
            [jobId]
          );
          const rejectedCount = rejectedRows[0].rejectedCount;

          if (rejectedCount === 0) {
            // All approved, none rejected → job is ready for production scheduling
            await pool.query(
              "UPDATE jobs SET status='Materials Ready' WHERE id=? AND status='Created'",
              [jobId]
            );
            console.log(`✅ Job ${jobId} is now 'Materials Ready' — all material requests approved`);
          }
        } else {
          console.log(`ℹ️  Job ${jobId}: ${pendingCount} material request(s) still pending`);
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
