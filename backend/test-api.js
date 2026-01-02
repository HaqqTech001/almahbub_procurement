const http = require('http');

// Test backend authentication
function testAdminLogin() {
  const testData = JSON.stringify({
    email: 'admin@almahbub.com',
    password: 'admin123456'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': testData.length
    }
  };

  console.log('🔍 Testing Admin Login...');
  console.log('📡 Making request to:', options.method, options.path);

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 Response Status:', res.statusCode);
      console.log('📋 Response Headers:', res.headers);
      
      try {
        const response = JSON.parse(data);
        console.log('📄 Response Body:', JSON.stringify(response, null, 2));
        
        if (res.statusCode === 200 && response.success) {
          console.log('✅ Admin login test PASSED!');
          console.log('🎯 Token received:', response.data.token ? 'YES' : 'NO');
          console.log('👤 User data:', response.data.user ? 'YES' : 'NO');
        } else {
          console.log('❌ Admin login test FAILED!');
          console.log('💥 Error:', response.error || 'Unknown error');
        }
      } catch (error) {
        console.log('❌ JSON parsing failed:', error.message);
        console.log('📄 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
  });

  req.write(testData);
  req.end();
}

// Test health endpoint
function testHealthEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  };

  console.log('\n🔍 Testing Health Endpoint...');
  console.log('📡 Making request to:', options.method, options.path);

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 Response Status:', res.statusCode);
      
      try {
        const response = JSON.parse(data);
        console.log('📋 Response:', JSON.stringify(response, null, 2));
        
        if (res.statusCode === 200 && response.status === 'OK') {
          console.log('✅ Health endpoint test PASSED!');
        } else {
          console.log('❌ Health endpoint test FAILED!');
        }
      } catch (error) {
        console.log('❌ JSON parsing failed:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
  });

  req.end();
}

// Run tests
console.log('🧪 Testing Almahbub Backend API...\n');

testHealthEndpoint();
setTimeout(() => {
  testAdminLogin();
}, 1000);

setTimeout(() => {
  console.log('\n🎯 Test Summary:');
  console.log('- Backend should be running on http://localhost:5000');
  console.log('- Admin login credentials: admin@almahbub.com / admin123456');
  console.log('- All endpoints should return proper CORS headers');
  console.log('\n🚀 Ready for frontend connection!');
}, 3000);