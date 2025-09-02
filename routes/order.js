// routes/order.js - Order routes: checkout, status, rating using MongoDB

const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // <-- Ensure this model exists!
const { authenticateToken } = require('../middleware/auth');

// --- [1] POST /api/order/checkout ---
// Receives a cart, creates a new order in MongoDB, returns order info
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { cart, customerNotes, deliveryAddress } = req.body;
    
    // Validate cart
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Cart is empty or invalid" 
      });
    }

    // Validate cart items structure
    for (const item of cart) {
      if (!item.id || !item.name || !item.price || !item.qty) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid cart item structure. Missing required fields: id, name, price, qty" 
        });
      }
      
      if (item.qty < 1 || item.qty > 20) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid quantity for ${item.name}. Must be between 1 and 20` 
        });
      }
      
      if (item.price < 0) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid price for ${item.name}` 
        });
      }
    }

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxRate = 0.08; // 8% tax
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Generate unique orderId with better collision avoidance
    let orderId;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      // Create more unique order ID: timestamp + random 6-digit number
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
      orderId = parseInt(`${timestamp}${randomNum}`.slice(-12)); // Take last 12 digits for manageable ID
      
      const existingOrder = await Order.findOne({ orderId });
      if (!existingOrder) break;
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      return res.status(500).json({ 
        success: false,
        error: "Failed to generate unique order ID. Please try again." 
      });
    }

    // Create order object
    const orderData = {
      orderId,
      userId: req.user.id,
      username: req.user.username,
      cart,
      subtotal,
      tax,
      total,
      status: 'Preparing'
    };
    
    if (customerNotes) {
      orderData.customerNotes = customerNotes.trim();
    }
    
    if (deliveryAddress) {
      orderData.deliveryAddress = deliveryAddress;
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    console.log(`Order ${orderId} created successfully for user ${req.user.username}`);

    res.status(201).json({ 
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId,
        subtotal,
        tax,
        total,
        status: 'Preparing',
        itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
        estimatedDeliveryTime: '30-45 minutes'
      }
    });
  } catch (error) {
    console.error('Checkout error:', {
      name: error.name,
      message: error.message,
      user: req.user?.username,
      stack: error.stack
    });
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Order validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during checkout',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// --- [2] GET /api/order/:orderId/status ---
// Get current order status (no cycling, just return current status)
router.get('/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid order ID" 
      });
    }
    
    const order = await Order.findOne({ 
      orderId,
      userId: req.user.id // Only allow users to access their own orders
    }).select('orderId status createdAt total itemCount');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found or access denied" 
      });
    }

    res.json({ 
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt,
        total: order.total,
        itemCount: order.itemCount
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch order status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// --- [3] POST /api/order/:orderId/rate ---
// Rate your order (stores emoji on order doc)
router.post('/:orderId/rate', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { rating } = req.body;
    
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid order ID" 
      });
    }
    
    if (!rating || rating.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: "Rating is required" 
      });
    }
    
    const order = await Order.findOne({ 
      orderId,
      userId: req.user.id // Only allow users to rate their own orders
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found or access denied" 
      });
    }
    
    // Only allow rating if order is delivered
    if (order.status !== 'Delivered') {
      return res.status(400).json({ 
        success: false,
        error: "You can only rate delivered orders" 
      });
    }
    
    order.rating = rating.trim();
    await order.save();
    
    console.log(`User ${req.user.username} rated order ${orderId}: ${rating}`);
    
    res.json({ 
      success: true,
      message: 'Thanks for your rating!',
      data: {
        orderId,
        rating: order.rating
      }
    });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit rating',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// --- [4] GET /api/order/user-orders ---
// Get user's orders with pagination and filtering
router.get('/user-orders', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, page = 1, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let query = { userId: req.user.id };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .sort({ [sortBy]: sortOrder })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v'),
      Order.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    console.log(`User ${req.user.username} fetched ${orders.length} orders (page ${page}/${totalPages})`);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('User orders fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
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

// --- [6] PUT /api/order/:orderId/status ---
// Update order status (for admin or automated systems)
router.put('/:orderId/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid order ID" 
      });
    }
    
    const validStatuses = ['Preparing', 'On the Way', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }
    
    const order = await Order.findOneAndUpdate(
      { orderId },
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found" 
      });
    }
    
    console.log(`Order ${orderId} status updated to: ${status}`);
    
    res.json({ 
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order.orderId,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update order status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// --- [7] Test log endpoint for connectivity
router.get('/testlog', (req, res) => {
  console.log('GET /api/order/testlog was called!');
  res.json({ success: true });
});

module.exports = router;

