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

// GET /api/menu or /api/menu?category=Starters
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }
    
    const menuItems = await MenuItem.find(query);
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

module.exports = router;
