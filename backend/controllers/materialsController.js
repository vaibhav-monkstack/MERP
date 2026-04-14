const pool = require('../config/dbPromise');

exports.getMaterials = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM materials');
    res.json(rows);
  } catch (err) {
    console.error('getMaterials error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.addMaterial = async (req, res) => {
  const { name, type, quantity, dimensions, unit, supplier, purchase_date, purchase_price } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO materials (name, type, quantity, dimensions, unit, supplier, purchase_date, purchase_price) VALUES (?,?,?,?,?,?,?,?)',
      [name, type, quantity, dimensions, unit, supplier, purchase_date, purchase_price]
    );
    res.json({ id: result.insertId, name, type, quantity, dimensions, unit, supplier, purchase_date, purchase_price });
  } catch (err) {
    console.error('addMaterial error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { name, type, quantity, dimensions, unit, supplier, purchase_date, purchase_price } = req.body;
  try {
    await pool.query(
      'UPDATE materials SET name=?, type=?, quantity=?, dimensions=?, unit=?, supplier=?, purchase_date=?, purchase_price=? WHERE id=?',
      [name, type, quantity, dimensions, unit, supplier, purchase_date, purchase_price, id]
    );
    res.json({ message: 'Material updated successfully' });
  } catch (err) {
    console.error('updateMaterial error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await pool.query('DELETE FROM materials WHERE id=?', [req.params.id]);
    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    console.error('deleteMaterial error:', err);
    res.status(500).json({ error: err.message });
  }
};
