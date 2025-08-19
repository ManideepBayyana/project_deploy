const mongoose = require('mongoose');

// Order item sub-schema
const orderItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price must be positive']
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [20, 'Quantity cannot exceed 20']
  },
  img: {
    type: String,
    default: '/assets/images/default-food.png'
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: Number,
    required: true,
    unique: true,
    min: [1, 'Order ID must be positive']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    index: true
  },
  cart: {
    type: [orderItemSchema],
    required: [true, 'Cart items are required'],
    validate: {
      validator: function(cart) {
        return cart && cart.length > 0;
      },
      message: 'Cart must contain at least one item'
    }
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal must be positive']
  },
  tax: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax must be positive']
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total must be positive']
  },
  status: {
    type: String,
    default: 'Preparing',
    enum: {
      values: ['Preparing', 'On the Way', 'Delivered', 'Cancelled'],
      message: 'Status must be one of: Preparing, On the Way, Delivered, Cancelled'
    },
    index: true
  },
  rating: {
    type: String,
    trim: true,
    maxlength: [10, 'Rating cannot exceed 10 characters']
  },
  customerNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  deliveryAddress: {
    street: String,
    city: String,
    pincode: String
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Create indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ username: 1, createdAt: -1 });

// Virtual field for formatted total
orderSchema.virtual('formattedTotal').get(function() {
  return `₹${this.total.toFixed(2)}`;
});

// Virtual field for item count
orderSchema.virtual('itemCount').get(function() {
  return this.cart.reduce((sum, item) => sum + item.qty, 0);
});

// Pre-save middleware to validate cart totals
orderSchema.pre('save', function(next) {
  const calculatedSubtotal = this.cart.reduce((sum, item) => {
    return sum + (item.price * item.qty);
  }, 0);
  
  // Allow small floating point discrepancies
  const tolerance = 0.01;
  if (Math.abs(calculatedSubtotal - this.subtotal) > tolerance) {
    return next(new Error('Subtotal does not match cart items'));
  }
  
  // Validate total calculation
  const calculatedTotal = this.subtotal + this.tax;
  if (Math.abs(calculatedTotal - this.total) > tolerance) {
    return next(new Error('Total does not match subtotal + tax'));
  }
  
  next();
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Order', orderSchema);
