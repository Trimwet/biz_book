require('dotenv').config();
const http = require('http');

async function testHealth() {
  console.log('🧪 Testing backend server health...\n');
  
  // Wait a moment for potential server startup
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3001,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log('✅ Server is running!');
          console.log(`Status Code: ${res.statusCode}`);
          console.log('\nResponse:');
          console.log(JSON.stringify(response, null, 2));
          
          if (response.database === 'up') {
            console.log('\n✅ Database connection: SUCCESS');
          } else {
            console.log('\n⚠️  Database connection: FAILED');
          }
          
          resolve(response);
        } catch (err) {
          console.error('❌ Failed to parse response:', data);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Server health check failed:', err.message);
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   npm start');
      console.log('   or');
      console.log('   node index.js');
      reject(err);
    });

    req.on('timeout', () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

testHealth()
  .then(() => {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
