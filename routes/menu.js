// routes/menu.js
const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Fallback hardcoded menu data (used if database is empty)
const fallbackMenu = [
  // Starters
  {
    name: "Paneer Tikka",
    category: "Starters",
    price: 180,
    img: "assets/images/71nw11ca.png",
    veg: true,
    popular: true
  },
  {
    name: "Chicken 65",
    category: "Starters",
    price: 220,
    img: "assets/images/etrylw4u.png",
    veg: false,
    spicy: true
  },
  {
    name: "Crispy Corn",
    category: "Starters",
    price: 130,
    img: "assets/images/bymr7yuq.png",
    veg: true
  },
  // Main Course
  {
    name: "Chicken Biryani",
    category: "Main Course",
    price: 280,
    img: "assets/images/gbks6art.png",
    veg: false,
    spicy: true,
    popular: true
  },
  {
    name: "Paneer Butter Masala",
    category: "Main Course",
    price: 220,
    img: "assets/images/2a5v488p.png",
    veg: true
  },
  {
    name: "Veg Fried Rice",
    category: "Main Course",
    price: 150,
    img: "assets/images/xuzv8yrn.png",
    veg: true
  },
  // Desserts
  {
    name: "Gulab Jamun",
    category: "Desserts",
    price: 90,
    img: "assets/images/rcpwh7bs.png"
  },
  {
    name: "Chocolate Brownie",
    category: "Desserts",
    price: 120,
    img: "assets/images/8vmt5loo.png"
  },
  {
    name: "Ice Cream Sundae",
    category: "Desserts",
    price: 140,
    img: "assets/images/ja7v8blf.png"
  },
  // Beverages
  {
    name: "Mango Lassi",
    category: "Beverages",
    price: 80,
    img: "assets/images/jsxflmun.png",
    popular: true
  },
  {
    name: "Cold Coffee",
    category: "Beverages",
    price: 100,
    img: "assets/images/8nhdyrm8.png"
  },
  {
    name: "Fresh Lime Soda",
    category: "Beverages",
    price: 60,
    img: "assets/images/s4krexld.png"
  }
];

// Initialize database with fallback data if empty
async function initializeMenu() {
  try {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log('Initializing menu with fallback data...');
      await MenuItem.insertMany(fallbackMenu);
      console.log('Menu initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing menu:', error);
  }
}

// Initialize menu on startup
initializeMenu();

// GET /api/menu or /api/menu?category=Starters&available=true&veg=true
router.get('/', async (req, res) => {
  try {
    const { category, available, veg, popular, search } = req.query;
    let query = {};
    
    // Filter by category
    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }
    
    // Filter by availability
    if (available !== undefined) {
      query.available = available === 'true';
    }
    
    // Filter by veg/non-veg
    if (veg !== undefined) {
      if (veg === 'true') {
        query.veg = true;
      } else if (veg === 'false') {
        query.veg = false;
      }
    }
    
    // Filter by popular items
    if (popular === 'true') {
      query.popular = true;
    }
    
    // Search in name and description
    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } }
      ];
    }
    
    console.log('Menu query:', query);
    
    const menuItems = await MenuItem.find(query)
      .sort({ category: 1, popular: -1, name: 1 })
      .select('-__v'); // Exclude version field
    
    console.log(`Found ${menuItems.length} menu items`);
    res.json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch menu items',
      message: error.message 
    });
  }
});

// GET /api/menu/categories - Get all available categories
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

// GET /api/menu/popular - Get popular items
router.get('/popular', async (req, res) => {
  try {
    const popularItems = await MenuItem.find({ popular: true, available: true })
      .sort({ category: 1, name: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: popularItems.length,
      data: popularItems
    });
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch popular items',
      message: error.message 
    });
  }
});

// GET /api/menu/:id - Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid menu item ID format'
      });
    }
    
    const menuItem = await MenuItem.findById(id).select('-__v');
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch menu item',
      message: error.message 
    });
  }
});

module.exports = router;
