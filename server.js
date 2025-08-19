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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tindibandi', { })
  .then(() => console.log('MongoDB connected'))
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
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
