#!/usr/bin/env node

// Comprehensive API Test Suite for Tindi Bandi - Linux Server Compatibility
require('dotenv').config();
const mongoose = require('mongoose');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

class APITester {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.authToken = null;
    this.adminToken = null;
    this.testUserId = null;
    this.testOrderId = null;
    this.testMenuItemId = null;
    this.passed = 0;
    this.failed = 0;
  }

  // Helper method for making HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      return { response, data };
    } catch (error) {
      throw new Error(`Network error for ${endpoint}: ${error.message}`);
    }
  }

  // Test helper methods
  assert(condition, message) {
    if (condition) {
      console.log(`✅ ${message}`);
      this.passed++;
    } else {
      console.log(`❌ ${message}`);
      this.failed++;
    }
  }

  async testEndpoint(name, testFunction) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      await testFunction();
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      this.failed++;
    }
  }

  // Authentication Tests
  async testUserRegistration() {
    await this.testEndpoint('User Registration', async () => {
      const testUser = {
        username: 'testuser_' + Date.now(),
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        email: `test${Date.now()}@example.com`,
        mobileNumber: '+1234567890',
        dateOfBirth: '1995-05-15'
      };

      const { response, data } = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: testUser
      });

      this.assert(response.status === 200, 'Registration returns 200 status');
      this.assert(data.message && data.message.includes('successful'), 'Registration success message');
      this.assert(data.user && data.user.username === testUser.username, 'User data returned');
      
      this.testUser = testUser; // Store for login test
    });
  }

  async testUserLogin() {
    await this.testEndpoint('User Login', async () => {
      if (!this.testUser) {
        throw new Error('No test user available for login test');
      }

      const { response, data } = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
          username: this.testUser.username,
          password: this.testUser.password
        }
      });

      this.assert(response.status === 200, 'Login returns 200 status');
      this.assert(data.token, 'JWT token returned');
      this.assert(data.user && data.user.username === this.testUser.username, 'User data returned');
      
      this.authToken = data.token;
    });
  }

  async testUserProfile() {
    await this.testEndpoint('User Profile Fetch', async () => {
      if (!this.authToken) {
        throw new Error('No auth token available for profile test');
      }

      const { response, data } = await this.makeRequest('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      this.assert(response.status === 200, 'Profile fetch returns 200 status');
      this.assert(data.user && data.user.username, 'User profile data returned');
    });
  }

  // Menu Tests
  async testMenuFetch() {
    await this.testEndpoint('Menu Fetch', async () => {
      const { response, data } = await this.makeRequest('/api/menu');

      this.assert(response.status === 200, 'Menu fetch returns 200 status');
      this.assert(data.success === true, 'Menu response indicates success');
      this.assert(Array.isArray(data.data), 'Menu items returned as array');
      this.assert(data.data.length > 0, 'Menu contains items');
      
      if (data.data.length > 0) {
        const firstItem = data.data[0];
        this.assert(firstItem.name && firstItem.price && firstItem.category, 'Menu items have required fields');
        this.testMenuItemId = firstItem._id;
      }
    });
  }

  async testMenuCategories() {
    await this.testEndpoint('Menu Categories', async () => {
      const { response, data } = await this.makeRequest('/api/menu/categories');

      this.assert(response.status === 200, 'Categories fetch returns 200 status');
      this.assert(data.success === true, 'Categories response indicates success');
      this.assert(Array.isArray(data.data), 'Categories returned as array');
    });
  }

  async testMenuItemFetch() {
    await this.testEndpoint('Single Menu Item Fetch', async () => {
      if (!this.testMenuItemId) {
        console.log('⏭️  Skipping single item test - no menu item ID available');
        return;
      }

      const { response, data } = await this.makeRequest(`/api/menu/${this.testMenuItemId}`);

      this.assert(response.status === 200, 'Single menu item fetch returns 200 status');
      this.assert(data.success === true, 'Menu item response indicates success');
      this.assert(data.data && data.data._id === this.testMenuItemId, 'Correct menu item returned');
    });
  }

  // Admin Tests
  async testAdminLogin() {
    await this.testEndpoint('Admin Login', async () => {
      const { response, data } = await this.makeRequest('/api/admin/login', {
        method: 'POST',
        body: {
          password: process.env.ADMIN_PASSWORD || 'admin123'
        }
      });

      this.assert(response.status === 200, 'Admin login returns 200 status');
      this.assert(data.success === true, 'Admin login successful');
      this.assert(data.token, 'Admin token returned');
      
      this.adminToken = data.token;
    });
  }

  async testAdminMenuFetch() {
    await this.testEndpoint('Admin Menu Fetch', async () => {
      if (!this.adminToken) {
        throw new Error('No admin token available');
      }

      const { response, data } = await this.makeRequest('/api/admin/menu', {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      this.assert(response.status === 200, 'Admin menu fetch returns 200 status');
      this.assert(Array.isArray(data), 'Admin menu items returned as array');
    });
  }

  async testAdminStats() {
    await this.testEndpoint('Admin Statistics', async () => {
      if (!this.adminToken) {
        throw new Error('No admin token available');
      }

      const { response, data } = await this.makeRequest('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      this.assert(response.status === 200, 'Admin stats fetch returns 200 status');
      this.assert(data.success === true, 'Admin stats response indicates success');
      this.assert(data.data && typeof data.data.orders === 'object', 'Order statistics returned');
    });
  }

  // Order Tests
  async testOrderCheckout() {
    await this.testEndpoint('Order Checkout', async () => {
      if (!this.authToken || !this.testMenuItemId) {
        throw new Error('Missing auth token or menu item for checkout test');
      }

      const testCart = [{
        id: this.testMenuItemId,
        name: 'Test Item',
        price: 100,
        qty: 2,
        img: '/assets/images/test.png'
      }];

      const { response, data } = await this.makeRequest('/api/order/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        body: {
          cart: testCart,
          customerNotes: 'Test order'
        }
      });

      this.assert(response.status === 201, 'Checkout returns 201 status');
      this.assert(data.success === true, 'Checkout response indicates success');
      this.assert(data.data && data.data.orderId, 'Order ID returned');
      this.assert(data.data.total > 0, 'Order total calculated');
      
      this.testOrderId = data.data.orderId;
    });
  }

  async testOrderStatus() {
    await this.testEndpoint('Order Status Check', async () => {
      if (!this.authToken || !this.testOrderId) {
        throw new Error('Missing auth token or order ID for status test');
      }

      const { response, data } = await this.makeRequest(`/api/order/${this.testOrderId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      this.assert(response.status === 200, 'Order status fetch returns 200 status');
      this.assert(data.success === true, 'Order status response indicates success');
      this.assert(data.data && data.data.orderId === this.testOrderId, 'Correct order status returned');
    });
  }

  async testUserOrders() {
    await this.testEndpoint('User Orders Fetch', async () => {
      if (!this.authToken) {
        throw new Error('No auth token available for user orders test');
      }

      const { response, data } = await this.makeRequest('/api/order/user-orders', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      this.assert(response.status === 200, 'User orders fetch returns 200 status');
      this.assert(data.success === true, 'User orders response indicates success');
      this.assert(Array.isArray(data.data), 'User orders returned as array');
    });
  }

  // Chatbot Test
  async testChatbot() {
    await this.testEndpoint('Chatbot', async () => {
      const { response, data } = await this.makeRequest('/api/chatbot', {
        method: 'POST',
        body: {
          message: 'vegan options'
        }
      });

      this.assert(response.status === 200, 'Chatbot returns 200 status');
      this.assert(data.reply, 'Chatbot reply returned');
    });
  }

  // Database Connection Test
  async testDatabaseConnection() {
    await this.testEndpoint('MongoDB Connection', async () => {
      try {
        const MONGODB_URI = process.env.MONGODB_URI || 
          (process.env.NODE_ENV === 'production' ? 
            'mongodb://mongo:27017/tindibandi' : 
            'mongodb://localhost:27017/tindibandi'
          );

        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connection successful');
        this.passed++;
        
        // Test collection access
        const collections = await mongoose.connection.db.listCollections().toArray();
        this.assert(collections.length >= 0, 'Database collections accessible');
        
        await mongoose.connection.close();
      } catch (error) {
        console.log(`❌ MongoDB connection failed: ${error.message}`);
        this.failed++;
      }
    });
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Tindi Bandi API Tests for Linux Server Compatibility');
    console.log(`📡 Testing API at: ${this.baseUrl}`);
    console.log('=' .repeat(60));

    // Database Tests
    await this.testDatabaseConnection();

    // Authentication Tests
    await this.testUserRegistration();
    await this.testUserLogin();
    await this.testUserProfile();

    // Menu Tests
    await this.testMenuFetch();
    await this.testMenuCategories();
    await this.testMenuItemFetch();

    // Admin Tests
    await this.testAdminLogin();
    await this.testAdminMenuFetch();
    await this.testAdminStats();

    // Order Tests
    await this.testOrderCheckout();
    await this.testOrderStatus();
    await this.testUserOrders();

    // Chatbot Test
    await this.testChatbot();

    // Final Results
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
    
    if (this.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Your API is ready for Linux server deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above before deployment.');
    }

    console.log('\n💡 Next Steps:');
    console.log('1. If all tests pass, your API routes are Linux-compatible');
    console.log('2. Deploy to your Linux server using the LINUX_DEPLOYMENT.md guide');
    console.log('3. Update environment variables for production');
    console.log('4. Test again on the production server');

    return this.failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = APITester;
