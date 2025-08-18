// routes/order.js - Order routes: checkout, status, rating using MongoDB

const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // <-- Ensure this model exists!
const { authenticateToken } = require('../middleware/auth');

// --- [1] POST /api/order/checkout ---
// Receives a cart, creates a new order in MongoDB, returns order info
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { cart } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty or invalid." });
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + tax;

    // Generate a more unique orderId
    const orderId = Date.now() + Math.floor(Math.random() * 1000);

    const order = new Order({
      orderId,
      userId: req.user.id,
      username: req.user.username,
      cart,
      subtotal,
      tax,
      total,
      status: 'Preparing',
      createdAt: new Date()
    });
    await order.save();

    res.json({ orderId, subtotal, tax, total });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error during checkout' });
  }
});

// --- [2] GET /api/order/:orderId/status ---
// Get and cycle order status
router.get('/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.orderId,
      userId: req.user.id // Only allow users to access their own orders
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Simulate status cycling (for demo/testing)
    const statusArr = ['Preparing', 'On the Way', 'Delivered'];
    let idx = statusArr.indexOf(order.status);
    idx = (idx + 1) % statusArr.length;
    order.status = statusArr[idx];
    await order.save();

    res.json({ status: order.status });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- [3] POST /api/order/:orderId/rate ---
// Rate your order (stores emoji on order doc)
router.post('/:orderId/rate', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.orderId,
      userId: req.user.id // Only allow users to rate their own orders
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    order.rating = req.body.emoji || '';
    await order.save();
    res.json({ message: 'Thanks for your rating!' });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- [4] GET /api/order/user-orders ---
// Get user's orders only
router.get('/user-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('User orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- [5] GET /api/order/all ---
// For admin/debug: get all orders (keep for admin panel)
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('All orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- [5] Test log endpoint for connectivity
router.get('/testlog', (req, res) => {
  console.log('GET /api/order/testlog was called!');
  res.json({ success: true });
});

module.exports = router;

