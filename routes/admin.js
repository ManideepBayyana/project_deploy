// routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

const ADMIN_SECRET = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret';

// Admin login route (public)
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (password === ADMIN_SECRET) {
      const token = jwt.sign(
        { admin: true, timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Authentication middleware
function checkAdmin(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.headers['x-admin'];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Check if it's the simple password (backward compatibility)
  if (token === ADMIN_SECRET) {
    return next();
  }
  
  // Check JWT token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.admin) {
      req.admin = decoded;
      return next();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  return res.status(401).json({ error: 'Access denied' });
}

// Apply authentication to all admin routes except login
router.use((req, res, next) => {
  if (req.path === '/login') return next();
  return checkAdmin(req, res, next);
});


// CREATE menu item
router.post('/menu', async (req, res) => {
  try {
    console.log('Creating menu item:', req.body);
    
    // Validate required fields
    const { name, category, price, img } = req.body;
    if (!name || !category || !price || !img) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category, price, img'
      });
    }
    
    // Check for duplicate item name in same category
    const existingItem = await MenuItem.findOne({ 
      name: name.trim(), 
      category: category.trim() 
    });
    
    if (existingItem) {
      return res.status(409).json({
        success: false,
        error: 'Menu item with this name already exists in this category'
      });
    }
    
    const item = new MenuItem(req.body);
    const savedItem = await item.save();
    
    console.log('Menu item created successfully:', savedItem._id);
    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: savedItem
    });
  } catch (error) {
    console.error('Error creating menu item:', {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create menu item', 
      message: error.message 
    });
  }
});

// READ all menu items
router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    console.log(`Found ${items.length} menu items`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items', details: error.message });
  }
});

// UPDATE menu item
router.put('/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE menu item
router.delete('/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories', 
      message: error.message 
    });
  }
});

// === ORDER MANAGEMENT ROUTES ===

// GET all orders
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 50, page = 1, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ [sortBy]: sortOrder })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');
    
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    console.log(`Admin fetched ${orders.length} orders (page ${page}/${totalPages})`);
    
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
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders', 
      message: error.message 
    });
  }
});

// UPDATE order status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const validStatuses = ['Preparing', 'On the Way', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const order = await Order.findOneAndUpdate(
      { orderId: parseInt(orderId) },
      { status },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    console.log(`Admin updated order ${orderId} status to ${status}`);
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update order status', 
      message: error.message 
    });
  }
});

// GET order statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get various statistics
    const [totalOrders, todayOrders, totalRevenue, todayRevenue, menuItemsCount, ordersByStatus] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      MenuItem.countDocuments(),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);
    
    const stats = {
      orders: {
        total: totalOrders,
        today: todayOrders
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0
      },
      menuItems: menuItemsCount,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics', 
      message: error.message 
    });
  }
});

module.exports = router;
