//fetches menu items dynamically
const mongoose = require('mongoose');
const MenuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  img: String,
  veg: Boolean,
  spicy: Boolean,
  popular: Boolean
});
module.exports = mongoose.model('MenuItem', MenuItemSchema);
