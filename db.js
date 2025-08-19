// db.js
require('dotenv').config();
const mongoose = require("mongoose");

// Use environment variable for MongoDB connection string
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tindibandi";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;
