const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  orderId: { type: Number, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true }, // For easier querying
  cart: { type: Array, default: [] },
  subtotal: Number,
  tax: Number,
  total: Number,
  status: { type: String, default: "Preparing" },
  createdAt: { type: Date, default: Date.now },
  rating: String
});
module.exports = mongoose.model('Order', orderSchema);
