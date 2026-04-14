const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET all customers
router.get('/', async (req, res) => {
  const query = `
    SELECT c.*, 
    (SELECT COUNT(*) FROM orders WHERE customer_name = c.name) as total_orders,
    (SELECT MAX(created_at) FROM orders WHERE customer_name = c.name) as last_order_date
    FROM customers c
    ORDER BY c.name ASC
  `;
  try {
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/customers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET customer details with order history
router.get('/:id', async (req, res) => {
  try {
    const [customerRows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (customerRows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    const customer = customerRows[0];
    const [orders] = await pool.query('SELECT * FROM orders WHERE customer_name = ? ORDER BY created_at DESC', [customer.name]);
    res.json({ success: true, data: { ...customer, orders } });
  } catch (err) {
    console.error(`GET /api/customers/${req.params.id} error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

  try {
    const [result] = await pool.query('INSERT INTO customers (name, email, phone, address) VALUES (?,?,?,?)', 
      [name, email, phone, address]);
    res.status(201).json({ success: true, message: 'Customer created', id: result.insertId });
  } catch (err) {
    console.error('POST /api/customers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    console.error(`DELETE /api/customers/${req.params.id} error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

