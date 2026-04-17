const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const automation = require('../utils/automation');

// GET all orders with stats
router.get('/', async (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];

  const conditions = [];
  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(customer_name LIKE ? OR item_name LIKE ? OR id LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC';

  try {
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET order summary/stats
router.get('/stats', async (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM orders
  `;
  try {
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/orders/stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single order details with history
router.get('/:id', async (req, res) => {
  const orderId = req.params.id;

  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const order = orderRows[0];
    const [history] = await pool.query('SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC', [orderId]);
    
    res.json({ success: true, data: { ...order, history } });
  } catch (err) {
    console.error(`GET /api/orders/${orderId} error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create order
router.post('/', async (req, res) => {
  const { 
    customer_name, email, phone, address, 
    item_name, quantity, price, status, priority, 
    shipping_method, courier_details, tracking_number, remarks,
    deadline
  } = req.body;


  if (!customer_name || !item_name || !quantity || !price)
    return res.status(400).json({ success: false, message: 'Missing required fields' });

  const insertQuery = `
    INSERT INTO orders (
      customer_name, email, mobile_number, delivery_address, 
      item_name, quantity, price, status, priority, 
      shipping_method, courier_details, tracking_number, remarks,
      deadline
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;
  const params = [
    customer_name, email, phone || '', address || '', 
    item_name, quantity, price, status || 'new', priority || 'medium', 
    shipping_method, courier_details, tracking_number, remarks,
    deadline || null
  ];


  try {
    const [result] = await pool.query(insertQuery, params);
    const newOrderId = result.insertId;

    // Async background tasks
    // 1. Sync Customer profile (Auto-create or update stats)
    pool.query('SELECT * FROM customers WHERE name = ?', [customer_name])
      .then(([rows]) => {
        if (rows.length === 0) {
          // New Customer: Insert with initial stats
          pool.query('INSERT INTO customers (name, email, phone, address, order_count, total_spent) VALUES (?,?,?,?,?,?)', 
            [customer_name, email, phone || '', address || '', 1, price]);
        } else {
          // Existing Customer: Update stats
          pool.query('UPDATE customers SET order_count = order_count + 1, total_spent = total_spent + ? WHERE name = ?', 
            [price, customer_name]);
        }
      }).catch(err => console.error('Auto-customer sync failed:', err.message));

    // 2. Log initial history
    pool.query('INSERT INTO order_history (order_id, status, remarks) VALUES (?,?,?)', 
      [newOrderId, status || 'new', 'Order created manually'])
      .catch(err => console.error('History log error:', err.message));



    // 3. Trigger Automation (REMOVED: Now triggered manually via approval gate)
    // const orderData = { id: newOrderId, item_name, quantity, deadline, priority };
    // automation.handleOrderCreated(orderData);

    res.status(201).json({ success: true, message: 'Order created', id: newOrderId });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update status
router.patch('/:id/status', async (req, res) => {
  const { status, remarks } = req.body;
  const valid = ['new', 'awaiting_materials', 'ready_to_approve', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

  try {
    const [result] = await pool.query('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Log history
    pool.query('INSERT INTO order_history (order_id, status, remarks) VALUES (?,?,?)', 
      [req.params.id, status, remarks || `Status changed to ${status}`])
      .catch(err => console.error('History log error:', err.message));

    // === GATED WORKFLOW TRIGGERS ===
    if (status === 'awaiting_materials') {
      automation.handleMaterialCheck(req.params.id);
    }
    // MANUAL JOB CREATION: Job creation is now handled manually by the Job Manager
    // from their dashboard, so we no longer trigger automation.handleOrderApproved here.

    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error('PATCH /api/orders/status error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update order
router.put('/:id', async (req, res) => {
  const { 
    customer_name, email, phone, address, 
    item_name, quantity, price, status, priority, 
    shipping_method, courier_details, tracking_number, remarks,
    deadline
  } = req.body;


  const query = `
    UPDATE orders SET 
      customer_name=?, email=?, mobile_number=?, delivery_address=?, 
      item_name=?, quantity=?, price=?, status=?, priority=?, 
      shipping_method=?, courier_details=?, tracking_number=?, remarks=?,
      deadline=?
    WHERE id=?
  `;
  const params = [
    customer_name, email, phone || '', address || '', 
    item_name, quantity, price, status, priority, 
    shipping_method, courier_details, tracking_number, remarks,
    deadline,
    req.params.id
  ];


  try {
    const [result] = await pool.query(query, params);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order updated' });
  } catch (err) {
    console.error(`PUT /api/orders/${req.params.id} error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  const orderId = req.params.id;

  try {
    // 1. Get customer name before deleting order
    const [orderRows] = await pool.query('SELECT customer_name FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });

    const customerName = orderRows[0].customer_name;

    // 2. Delete the order
    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);

    // 3. Delete the associated customer (As requested for 1:1 bond)
    await pool.query('DELETE FROM customers WHERE name = ?', [customerName]);

    res.json({ success: true, message: 'Order and associated customer profile deleted successfully' });
  } catch (err) {
    console.error(`DELETE /api/orders/${orderId} error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
