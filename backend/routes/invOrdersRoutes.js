const express = require("express");
const router = express.Router();
const pool = require('../config/db');

// ✅ CREATE ORDER
router.post("/", async (req, res) => {
  const {
    order_id,
    product,
    customer,
    quantity,
    delivery_date,
    inventory_status,
  } = req.body;

  const sql = `
    INSERT INTO inv_orders 
    (order_id, product, customer, quantity, delivery_date, inventory_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  try {
    await pool.query(
      sql,
      [order_id, product, customer, quantity, delivery_date, inventory_status]
    );

    res.json({ message: "Order created successfully" });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET ORDERS
router.get("/", async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM inv_orders ORDER BY id DESC");
    res.json(result);
  } catch (err) {
    console.error("GET Orders Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
