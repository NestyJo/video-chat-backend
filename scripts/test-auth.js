#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            body: jsonBody,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body,
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAuth() {
  console.log('🔐 Testing Authentication Flow');
  console.log('==============================');

  try {
    // Step 1: Login to get token
    console.log('\\n1. 🔑 Testing Login...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@agora.com',
      password: 'Admin123!@#'
    });

    console.log(`Status: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode !== 200 || !loginResponse.body.success) {
      console.log('❌ Login failed');
      if (loginResponse.body.error) {
        console.log(`Error: ${loginResponse.body.error.message}`);
      }
      return;
    }

    console.log('✅ Login successful!');
    console.log(`User: ${loginResponse.body.data.user.username}`);
    console.log(`Role: ${loginResponse.body.data.user.role}`);
    
    const token = loginResponse.body.data.token;
    console.log(`Token: ${token ? 'Generated' : 'Missing'}`);

    if (!token) {
      console.log('❌ No token received');
      return;
    }

    // Step 2: Test protected endpoint
    console.log('\\n2. 🛡️  Testing Protected Endpoint...');
    const profileResponse = await makeRequest('GET', '/api/auth/profile', null, {
      'Authorization': `Bearer ${token}`
    });

    console.log(`Status: ${profileResponse.statusCode}`);
    
    if (profileResponse.statusCode === 200 && profileResponse.body.success) {
      console.log('✅ Profile access successful!');
      console.log(`Profile User: ${profileResponse.body.data.user.username}`);
      console.log(`Profile Email: ${profileResponse.body.data.user.email}`);
      console.log(`Profile Role: ${profileResponse.body.data.user.role}`);
    } else {
      console.log('❌ Profile access failed');
      if (profileResponse.body.error) {
        console.log(`Error: ${profileResponse.body.error.message}`);
        if (profileResponse.body.error.stack) {
          console.log('Stack trace:');
          console.log(profileResponse.body.error.stack);
        }
      }
    }

    // Step 3: Test without token
    console.log('\\n3. 🚫 Testing Without Token...');
    const noTokenResponse = await makeRequest('GET', '/api/auth/profile');
    console.log(`Status: ${noTokenResponse.statusCode}`);
    
    if (noTokenResponse.statusCode === 401) {
      console.log('✅ Correctly rejected request without token');
    } else {
      console.log('❌ Should have rejected request without token');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\\n💡 Make sure:');
    console.log('1. Server is running: npm run dev');
    console.log('2. Admin user exists: npm run mysql:seed-admin');
  }

  console.log('\\n🏁 Authentication test completed');
}

testAuth();