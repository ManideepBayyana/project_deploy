// db.js
const mongoose = require("mongoose");

// Replace with your connection string
const mongoURI = "mongodb://127.0.0.1:27017/tindibandi"; // or use your Atlas string

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;
