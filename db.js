// db.js
require('dotenv').config();
const mongoose = require("mongoose");

// Use environment variable for MongoDB connection string
// For production, use MongoDB Atlas or other cloud MongoDB services
// For local development, fallback to localhost
const mongoURI = process.env.MONGODB_URI || 
  (process.env.NODE_ENV === 'production' ? 
    'mongodb://mongo:27017/tindibandi' : // Docker service name
    'mongodb://localhost:27017/tindibandi'
  );

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;
