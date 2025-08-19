#!/usr/bin/env node

// Quick diagnostic script for Tindi Bandi API issues
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 TINDI BANDI API DIAGNOSTICS');
console.log('=' .repeat(50));

// 1. Check Environment Variables
console.log('\n📋 1. ENVIRONMENT VARIABLES:');
const requiredEnvVars = ['JWT_SECRET', 'ADMIN_PASSWORD', 'MONGODB_URI'];
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar === 'JWT_SECRET' || envVar === 'ADMIN_PASSWORD' ? '[HIDDEN]' : value}`);
  } else {
    console.log(`❌ ${envVar}: Missing`);
  }
});

// 2. Check Required Files
console.log('\n📁 2. REQUIRED FILES:');
const requiredFiles = [
  'server.js',
  'package.json',
  '.env',
  'models/User.js',
  'models/MenuItem.js',
  'models/Order.js',
  'routes/auth.js',
  'routes/menu.js',
  'routes/order.js',
  'routes/admin.js',
  'middleware/auth.js'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}: Missing`);
  }
});

// 3. Check Package.json Dependencies
console.log('\n📦 3. DEPENDENCIES:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'cors', 'dotenv', 'socket.io'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: Missing`);
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// 4. Check MongoDB Connection
console.log('\n🗄️  4. MONGODB CONNECTION TEST:');
async function testMongoDB() {
  try {
    const mongoose = require('mongoose');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tindibandi';
    
    console.log(`Connecting to: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connection successful');
    
    // Test database access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed properly');
  } catch (error) {
    console.log(`❌ MongoDB connection failed: ${error.message}`);
    console.log('💡 Solutions:');
    console.log('   - Ensure MongoDB is running: mongod --version');
    console.log('   - Check connection string in .env file');
    console.log('   - For Linux: sudo systemctl start mongod');
  }
}

// 5. Check Node.js Version
console.log('\n🚀 5. NODE.JS VERSION:');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

if (majorVersion >= 16) {
  console.log(`✅ Node.js version: ${nodeVersion} (Good)`);
} else {
  console.log(`⚠️  Node.js version: ${nodeVersion} (Upgrade recommended to v16+)`);
}

// 6. Check Port Availability
console.log('\n🔌 6. PORT AVAILABILITY:');
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

async function checkPorts() {
  const ports = [3001, 27017];
  for (const port of ports) {
    const available = await checkPort(port);
    if (available) {
      console.log(`✅ Port ${port}: Available`);
    } else {
      console.log(`⚠️  Port ${port}: In use`);
      if (port === 3001) {
        console.log('   💡 Solution: Kill existing process or use different PORT in .env');
      }
    }
  }
}

// Run diagnostics
async function runDiagnostics() {
  await testMongoDB();
  await checkPorts();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 COMMON SOLUTIONS FOR TYPICAL ERRORS:');
  console.log('\n1. "Cannot connect to MongoDB":');
  console.log('   - Windows: Download and install MongoDB Community Server');
  console.log('   - Linux: sudo systemctl start mongod');
  console.log('   - Check MONGODB_URI in .env file');
  
  console.log('\n2. "Port 3001 already in use":');
  console.log('   - Windows: netstat -ano | findstr :3001');
  console.log('   - Linux: sudo lsof -i :3001');
  console.log('   - Kill process or change PORT in .env');
  
  console.log('\n3. "Module not found" errors:');
  console.log('   - Run: npm install');
  console.log('   - Check package.json dependencies');
  
  console.log('\n4. "Invalid JWT secret" errors:');
  console.log('   - Check JWT_SECRET in .env file');
  console.log('   - Ensure .env file exists and is loaded');
  
  console.log('\n5. "Authentication failed" errors:');
  console.log('   - Check ADMIN_PASSWORD in .env file');
  console.log('   - Verify user credentials');
  
  console.log('\n📞 If you need help with a specific error:');
  console.log('   1. Copy the exact error message');
  console.log('   2. Run: node server.js');
  console.log('   3. Share both the error and this diagnostic output');
}

// Execute diagnostics
runDiagnostics().catch(console.error);
