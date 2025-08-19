// server.js - Main server file: Express, Socket.io, MongoDB, and all API routes

// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);    // For socket.io
const io = socketIo(server);

const PORT = process.env.PORT || 3001;

// --- MongoDB connection ---
// For production, use MongoDB Atlas or other cloud MongoDB services
// For local development, fallback to localhost
const MONGODB_URI = process.env.MONGODB_URI || 
  (process.env.NODE_ENV === 'production' ? 
    'mongodb://mongo:27017/tindibandi' : // Docker service name for containerized deployment
    'mongodb://localhost:27017/tindibandi' // Local development
  );

mongoose.connect(MONGODB_URI, { })
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
  })
  .catch(err => console.error('MongoDB connection error:', err));

// --- Middleware ---
app.use(express.json());
app.use(cors());
// Serve all static files from 'public' folder (make sure admin.html and images are there)
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routers ---
app.use('/api/menu', require('./routes/menu'));       // Menu routes
app.use('/api/auth', require('./routes/auth'));       // Auth: login/register
app.use('/api/order', require('./routes/order'));     // Orders
app.use('/api/chatbot', require('./routes/chatbot')); // Chatbot
app.use('/api/admin', require('./routes/admin'));     // Admin (menu management)

// Admin panel route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Debug panel route
app.get('/debug', (req, res) => {
  res.sendFile(path.join(__dirname, 'debug.html'));
});

// --- Socket.io: Real-time Order Progress ---
io.on('connection', (socket) => {
  socket.on('trackOrder', (orderId) => {
    let statusIndex = 0;
    const statuses = ['Preparing', 'On the Way', 'Delivered'];
    const interval = setInterval(() => {
      socket.emit('orderStatus', { orderId, status: statuses[statusIndex] });
      if (statusIndex++ === 2) clearInterval(interval);
    }, 5000);
  });
});

// Optional: make io available to routes if needed
app.set('socketio', io);

// --- Start server ---
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Local access: http://localhost:${PORT}`);
  }
});
