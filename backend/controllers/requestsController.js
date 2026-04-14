const pool = require('../config/db');

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
  const request_id = 'REQ-' + Date.now();

  if (!material || !quantity) {
    return res.status(400).json({ success: false, message: 'Material and quantity are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO requests (request_id, job_id, material, quantity, requested_by) VALUES (?,?,?,?,?)',
      [request_id, job_id, material, quantity, requested_by]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Request created',
      data: { id: result.insertId, request_id, job_id, material, quantity, requested_by, status: 'Pending' } 
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
