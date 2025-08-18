// Debug script to check users and test login functionality
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function debugLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/tindibandi');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`\nFound ${users.length} users in the database:`);
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('ID:', user._id);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('First Name:', user.firstName);
      console.log('Last Name:', user.lastName);
      console.log('Mobile Number:', user.mobileNumber);
      console.log('Date of Birth:', user.dateOfBirth);
      console.log('Password Hash:', user.passwordHash ? user.passwordHash.substring(0, 10) + '...' : 'None');
      console.log('Created At:', user.createdAt);
    });

    // Test password verification for a specific user
    console.log('\n--- Password Testing ---');
    const testUser = users.find(u => u.username === 'manideep_11');
    if (testUser) {
      console.log('Testing password for user:', testUser.username);
      
      // Test various passwords
      const testPasswords = ['TestPass123!', 'test123', 'Test123!', 'manideep123'];
      
      for (const pwd of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(pwd, testUser.passwordHash);
          console.log(`Password "${pwd}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        } catch (error) {
          console.log(`Password "${pwd}": ERROR - ${error.message}`);
        }
      }
    }

    // Test finding users by different criteria
    console.log('\n--- User Search Testing ---');
    
    // Test finding by email
    const userByEmail = await User.findOne({ email: 'bayyanasrimanideep@gmail.com' });
    console.log('User found by email bayyanasrimanideep@gmail.com:', userByEmail ? 'YES' : 'NO');
    
    // Test finding by username
    const userByUsername = await User.findOne({ username: 'manideep_11' });
    console.log('User found by username manideep_11:', userByUsername ? 'YES' : 'NO');
    
    // Test $or query (like in login)
    const userByOr = await User.findOne({ 
      $or: [
        { username: 'bayyanasrimanideep@gmail.com' }, 
        { email: 'bayyanasrimanideep@gmail.com' }
      ] 
    });
    console.log('User found by $or query (email as username):', userByOr ? 'YES' : 'NO');
    if (userByOr) {
      console.log('Found user:', userByOr.username, userByOr.email);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugLogin();
