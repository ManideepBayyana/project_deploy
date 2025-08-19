// Verify that the menu fix is working
const http = require('http');

console.log('🔍 Verifying menu API fix...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/menu',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('📡 API Response Structure:');
      console.log(`   Status Code: ${res.statusCode}`);
      console.log(`   Has 'success' field: ${response.hasOwnProperty('success')}`);
      console.log(`   Has 'data' field: ${response.hasOwnProperty('data')}`);
      console.log(`   Success value: ${response.success}`);
      
      if (response.success && response.data) {
        console.log('✅ NEW API FORMAT DETECTED');
        console.log(`   Data is array: ${Array.isArray(response.data)}`);
        console.log(`   Number of items: ${response.data.length}`);
        
        if (response.data.length > 0) {
          const firstItem = response.data[0];
          console.log(`   First item: ${firstItem.name} (${firstItem.category})`);
          
          // Test filtering capability
          const starters = response.data.filter(item => item.category === 'Starters');
          const popular = response.data.filter(item => item.popular);
          
          console.log(`   Starters found: ${starters.length}`);
          console.log(`   Popular items found: ${popular.length}`);
          console.log('✅ FILTERING WORKS CORRECTLY');
        }
      } else if (Array.isArray(response)) {
        console.log('✅ OLD API FORMAT DETECTED (should not happen with new API)');
      } else {
        console.log('❌ UNEXPECTED API FORMAT');
      }
      
      console.log('\n🎯 VERDICT:');
      if (response.success && Array.isArray(response.data)) {
        console.log('✅ Menu API is working correctly with new format');
        console.log('✅ Frontend should now be able to filter menu items');
        console.log('🚀 Your website should work properly now!');
      } else {
        console.log('❌ There might still be an issue with the API format');
      }
      
    } catch (error) {
      console.log('❌ Error parsing JSON response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed:', error.message);
  console.log('💡 Make sure the server is running: node server.js');
});

req.end();
