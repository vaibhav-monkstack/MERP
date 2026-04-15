const pool = require('../config/db');
const { recordStockMovement } = require('./stockController');

exports.getRequests = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requests ORDER BY requested_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getRequests error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

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

exports.updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [existingRows] = await pool.query('SELECT * FROM requests WHERE id=?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = existingRows[0];
    const shouldDeduct = request.status !== 'Approved' && status === 'Approved';

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
    res.json({ success: true, message: `Request ${status} successfully` });
  } catch (err) {
    console.error('updateRequestStatus error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    await pool.query('DELETE FROM requests WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (err) {
    console.error('deleteRequest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
