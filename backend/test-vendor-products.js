const jwt = require('jsonwebtoken');

// Simulate what the token should look like
const payload = {
  userId: 2,
  email: 'jonahmafuyai25@gmail.com',
  userType: 'vendor'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Generate a test token
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

console.log('Test Token:', token);
console.log('\nDecoded payload:', jwt.decode(token));

// Now test the actual API call
const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/vendor/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\nAPI Response Status:', response.status);
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testAPI();
