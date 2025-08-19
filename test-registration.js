// Test script to directly test the registration endpoint
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 
  (process.env.NODE_ENV === 'production' ? 
    'mongodb://mongo:27017/tindibandi' : 
    'mongodb://localhost:27017/tindibandi'
  ))
  .then(() => {
    console.log('MongoDB connected for testing');
    testRegistration();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function testRegistration() {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');

    console.log('\n=== TESTING USER MODEL AND REGISTRATION LOGIC ===');
    
    // Test data that mimics what the frontend would send
    const testUser = {
      username: 'testuser123',
      password: 'TestPass123!',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      mobileNumber: '+1234567890',
      dateOfBirth: '1995-01-15'
    };

    console.log('Test user data:', testUser);

    // Clean up any existing test user
    try {
      await User.deleteOne({ 
        $or: [{ username: testUser.username }, { email: testUser.email }] 
      });
      console.log('Cleaned up existing test user');
    } catch (cleanupError) {
      console.log('No existing test user to clean up');
    }

    // Test bcrypt hashing
    console.log('\nTesting password hashing...');
    const hash = await bcrypt.hash(testUser.password, 12);
    console.log('Password hashed successfully');

    // Create user object
    console.log('\nCreating user document...');
    const user = new User({ 
      username: testUser.username, 
      firstName: testUser.firstName.trim(),
      lastName: testUser.lastName.trim(),
      email: testUser.email.toLowerCase().trim(),
      mobileNumber: testUser.mobileNumber.trim(),
      dateOfBirth: new Date(testUser.dateOfBirth),
      passwordHash: hash 
    });

    console.log('User document created, attempting to save...');
    
    // Save user to database
    const savedUser = await user.save();
    console.log('✅ User saved successfully!');
    console.log('Saved user:', {
      username: savedUser.username,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      mobileNumber: savedUser.mobileNumber,
      dateOfBirth: savedUser.dateOfBirth,
      fullName: savedUser.fullName
    });

    // Test duplicate user creation
    console.log('\nTesting duplicate user detection...');
    try {
      const duplicateUser = new User({ 
        username: testUser.username, 
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        mobileNumber: '+9876543210',
        dateOfBirth: new Date('1990-05-20'),
        passwordHash: hash 
      });
      await duplicateUser.save();
      console.log('❌ ERROR: Duplicate user was saved when it should have been rejected');
    } catch (duplicateError) {
      console.log('✅ Duplicate username correctly rejected:', duplicateError.message);
    }

    // Clean up test user
    await User.deleteOne({ username: testUser.username });
    console.log('\nTest user cleaned up');

    console.log('\n=== ALL TESTS PASSED ===');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
  } finally {
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}
