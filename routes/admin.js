// routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const MenuItem = require('../models/MenuItem');

const ADMIN_SECRET = 'admin123'; // Change this in production
const JWT_SECRET = 'your_jwt_secret_key'; // Change this in production

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
    const item = new MenuItem(req.body);
    const savedItem = await item.save();
    console.log('Menu item created:', savedItem);
    res.json(savedItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item', details: error.message });
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
    res.json(categories.sort());
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
