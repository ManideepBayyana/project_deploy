// MenuItem model for food delivery system
const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    minlength: [2, 'Item name must be at least 2 characters'],
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['Starters', 'Main Course', 'Desserts', 'Beverages'],
      message: 'Category must be one of: Starters, Main Course, Desserts, Beverages'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive'],
    max: [10000, 'Price cannot exceed ₹10,000']
  },
  img: {
    type: String,
    required: [true, 'Image path is required'],
    trim: true
  },
  veg: {
    type: Boolean,
    default: null // null = not specified, true = veg, false = non-veg
  },
  spicy: {
    type: Boolean,
    default: false
  },
  popular: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Create indexes for better query performance
MenuItemSchema.index({ category: 1, name: 1 });
MenuItemSchema.index({ popular: -1 });
MenuItemSchema.index({ veg: 1 });
MenuItemSchema.index({ available: 1 });

// Virtual field for formatted price
MenuItemSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price}`;
});

// Ensure virtual fields are serialized
MenuItemSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
