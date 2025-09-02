const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { 
    type: String, 
    required: false, // Make optional for backward compatibility
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  lastName: { 
    type: String, 
    required: false, // Make optional for backward compatibility
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  email: { 
    type: String, 
    required: false, // Make optional for backward compatibility
    unique: true,
    sparse: true, // Allow multiple null values
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  mobileNumber: {
    type: String,
    required: false, // Make optional for backward compatibility
    trim: true,
    match: [/^[+]?[1-9]\d{1,14}$/, 'Please enter a valid mobile number']
  },
  dateOfBirth: {
    type: Date,
    required: false, // Make optional for backward compatibility
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty for legacy users
        // Check if the date is not in the future and person is at least 13 years old
        const today = new Date();
        const minAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
        return v <= minAge;
      },
      message: 'You must be at least 13 years old'
    }
  },
  passwordHash: { type: String, required: true },
  // Optional: Keep legacy fields for backward compatibility during migration
  name: String, // Will be deprecated
  dob: String,  // Will be deprecated
  phone: String // Will be deprecated
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Virtual field to get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual field to get user orders
userSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'userId',
  options: { sort: { createdAt: -1 } } // Latest orders first
});

// Virtual field to get order count
userSchema.virtual('orderCount', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.passwordHash; // Don't include password hash in JSON output
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
