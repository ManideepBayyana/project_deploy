const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Use environment variable for JWT secret
const SECRET_KEY = process.env.JWT_SECRET || 'MY_SUPER_SECRET';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Token decoded successfully for user:', decoded.username);
    
    // Get user details from database
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(401).json({ 
        error: 'User not found', 
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user info to request object
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    console.log('Authentication successful for user:', user.username);
    next();
  } catch (error) {
    console.error('Authentication middleware error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token', 
        code: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired', 
        code: 'TOKEN_EXPIRED'
      });
    } else {
      return res.status(500).json({ 
        error: 'Authentication server error',
        code: 'SERVER_ERROR'
      });
    }
  }
};

module.exports = { authenticateToken };
