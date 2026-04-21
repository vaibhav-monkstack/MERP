const express = require('express');
const router  = express.Router();
const orderController = require('../controllers/orderController');

// GET all orders with stats
router.get('/', orderController.getOrders);

// GET order summary/stats
router.get('/stats', orderController.getOrderStats);

// GET single order details with history
router.get('/:id', orderController.getOrderById);

// POST create order
router.post('/', orderController.createOrder);

// PATCH update status
router.patch('/:id/status', orderController.updateOrderStatus);

// PUT update order
router.put('/:id', orderController.updateOrder);

// DELETE
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
