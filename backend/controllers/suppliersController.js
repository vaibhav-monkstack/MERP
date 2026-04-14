const pool = require('../config/dbPromise');

exports.getSuppliers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers');
    res.json(rows);
  } catch (err) {
    console.error('getSuppliers error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.addSupplier = async (req, res) => {
  const { name, contact_email, contact_phone, location, rating, active_orders, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO suppliers (name,contact_email,contact_phone,location,rating,active_orders,status) VALUES (?,?,?,?,?,?,?)',
      [name, contact_email, contact_phone, location, rating, active_orders || 0, status || 'On Time']
    );
    res.json({ id: result.insertId, name, contact_email, contact_phone, location, rating, active_orders, status });
  } catch (err) {
    console.error('addSupplier error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, contact_email, contact_phone, location, rating, active_orders, status } = req.body;
  try {
    await pool.query(
      'UPDATE suppliers SET name=?,contact_email=?,contact_phone=?,location=?,rating=?,active_orders=?,status=? WHERE id=?',
      [name, contact_email, contact_phone, location, rating, active_orders, status, id]
    );
    res.json({ message: 'Supplier updated successfully' });
  } catch (err) {
    console.error('updateSupplier error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id=?', [req.params.id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('deleteSupplier error:', err);
    res.status(500).json({ error: err.message });
  }
};
