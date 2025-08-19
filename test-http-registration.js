// Test script to test the HTTP registration endpoint
require('dotenv').config();

const testData = {
  username: 'httptest123',
  password: 'TestPass123!',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@httptest.com',
  mobileNumber: '+1987654321',
  dateOfBirth: '1992-08-20'
};

console.log('Testing HTTP registration endpoint...');
console.log('Test data:', testData);

// Make HTTP request to the registration endpoint
fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('\nResponse status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);
  return response.json();
})
.then(data => {
  console.log('\nResponse body:', data);
  if (data.error) {
    console.error('❌ Registration failed with error:', data.error);
  } else {
    console.log('✅ Registration successful:', data.message);
  }
})
.catch(error => {
  console.error('❌ Network error:', error.message);
  console.error('Make sure the server is running on http://localhost:3001');
});
