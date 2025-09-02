// routes/auth.js - Auth route: registration & login using MongoDB, bcrypt, JWT

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET || 'MY_SUPER_SECRET';

const User = require('../models/User'); // <-- Make sure this model exists

// -------- Register (POST /api/auth/register) --------
router.post('/register', async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, mobileNumber, dateOfBirth } = req.body;

    // Validate required fields
    if (!username || !password || !firstName || !lastName || !email || !mobileNumber || !dateOfBirth) {
      return res.status(400).json({ 
        error: "All fields are required: username, password, firstName, lastName, email, mobileNumber, dateOfBirth" 
      });
    }

    // Additional validation
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Check for existing user by username or email
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ error: "Invalid date of birth" });
    }

    // Check minimum age (13 years)
    const today = new Date();
    const minAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    if (dob > minAge) {
      return res.status(400).json({ error: "You must be at least 13 years old to register" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12); // Increased from 10 to 12 for better security
    
    // Create new user
    const user = new User({ 
      username, 
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      mobileNumber: mobileNumber.trim(),
      dateOfBirth: dob,
      passwordHash: hash 
    });

    await user.save();

    res.json({ 
      message: 'User registered successfully!', 
      user: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        dateOfBirth: user.dateOfBirth
      }
    });
  } catch (error) {
    console.error('=== REGISTRATION ERROR DETAILS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    
    if (error.keyPattern) {
      console.error('Duplicate key pattern:', error.keyPattern);
    }
    
    console.error('Request body received:', req.body);
    console.error('================================');
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errorMessages[0] });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// -------- Login (POST /api/auth/login) --------
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username }, { email: username.toLowerCase() }] 
    });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // For frontend: send user info for header/profile
    const userData = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      dateOfBirth: user.dateOfBirth,
      // Legacy fields for backward compatibility
      name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null),
      dob: user.dob,
      phone: user.phone || user.mobileNumber
    };

    const token = jwt.sign(
      { 
        username: user.username, 
        userId: user._id,
        email: user.email 
      }, 
      SECRET_KEY, 
      { expiresIn: '24h' } // Extended to 24h for better UX
    );
    
    res.json({ 
      token, 
      user: userData,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// -------- Get User Profile (GET /api/auth/profile) --------
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({ username: decoded.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt,
      // Legacy fields for backward compatibility
      name: user.name || user.fullName,
      dob: user.dob,
      phone: user.phone || user.mobileNumber
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------- Update User Profile (PUT /api/auth/profile) --------
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({ username: decoded.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { firstName, lastName, email, mobileNumber, dateOfBirth } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !mobileNumber || !dateOfBirth) {
      return res.status(400).json({ 
        error: "All fields are required: firstName, lastName, email, mobileNumber, dateOfBirth" 
      });
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingEmailUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingEmailUser) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ error: "Invalid date of birth" });
    }

    // Check minimum age (13 years)
    const today = new Date();
    const minAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    if (dob > minAge) {
      return res.status(400).json({ error: "You must be at least 13 years old" });
    }

    // Update user fields
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.email = email.toLowerCase().trim();
    user.mobileNumber = mobileNumber.trim();
    user.dateOfBirth = dob;

    await user.save();

    const userData = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      dateOfBirth: user.dateOfBirth,
      // Legacy fields for backward compatibility
      name: user.fullName,
      phone: user.mobileNumber
    };

    res.json({ 
      message: 'Profile updated successfully', 
      user: userData 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errorMessages[0] });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: 'Internal server error during profile update' });
  }
});

// -------- Logout (POST /api/auth/logout) --------
router.post('/logout', async (req, res) => {
  try {
    // Since we're using JWT (stateless), we don't need to invalidate server-side
    // The client will remove the token from localStorage
    // In a production app with a token blacklist, you'd add the token to a blacklist here
    
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during logout' 
    });
  }
});

module.exports = router;
