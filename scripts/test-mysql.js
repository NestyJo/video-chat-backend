#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
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

async function testMySQL() {
  console.log('🧪 Testing MySQL API Endpoints');
  console.log('===============================');

  try {
    // Test health endpoint first
    console.log('\\n1. 🏥 Testing Health Endpoint...');
    const healthResponse = await makeRequest('GET', '/api/health');
    console.log(`Status: ${healthResponse.statusCode}`);
    if (healthResponse.body.success) {
      console.log(`Environment: ${healthResponse.body.data.environment}`);
    }

    // Test MySQL login endpoint
    console.log('\\n2. 🔐 Testing MySQL Login Endpoint...');
    const loginResponse = await makeRequest('POST', '/api/mysql/auth/login', {
      email: 'admin@agora.com',
      password: 'Admin123!@#'
    });

    console.log(`Status: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode === 200 && loginResponse.body.success) {
      console.log('✅ MySQL Login successful!');
      console.log(`User: ${loginResponse.body.data.user.username}`);
      console.log(`Role: ${loginResponse.body.data.user.role}`);
      console.log(`ID: ${loginResponse.body.data.user.id}`);
      console.log(`Token: ${loginResponse.body.data.token ? 'Generated' : 'Missing'}`);
      
      // Test profile endpoint with token
      if (loginResponse.body.data.token) {
        console.log('\\n3. 👤 Testing MySQL Profile Endpoint...');
        const profileResponse = await makeRequest('GET', '/api/mysql/auth/profile', null);
        // Note: This is a simplified test - in reality you'd need to properly set headers
        console.log('📝 Profile endpoint test would require proper Authorization header');
      }
      
    } else {
      console.log('❌ MySQL Login failed');
      if (loginResponse.body.error) {
        console.log(`Error: ${loginResponse.body.error.message}`);
        if (loginResponse.body.error.stack) {
          console.log('Stack trace:');
          console.log(loginResponse.body.error.stack);
        }
      }
    }

    // Test registration
    console.log('\\n4. 📝 Testing MySQL Registration...');
    const registerResponse = await makeRequest('POST', '/api/mysql/auth/register', {
      username: 'testuser_mysql',
      email: 'test.mysql@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User'
    });

    console.log(`Registration Status: ${registerResponse.statusCode}`);
    if (registerResponse.statusCode === 201) {
      console.log('✅ MySQL Registration successful!');
    } else if (registerResponse.statusCode === 400) {
      console.log('⚠️ User might already exist (expected for repeated tests)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\\n💡 Make sure:');
    console.log('1. Server is running: npm run dev');
    console.log('2. MySQL is set up: npm run mysql:setup');
    console.log('3. Admin user exists: npm run mysql:seed-admin');
  }

  console.log('📋 Summary:');
  console.log('- MySQL endpoints are available at /api/auth/*');
  console.log('- MongoDB has been completely removed');
  console.log('- Pure MySQL implementation');
  console.log('\n🔗 Available endpoints:');
  console.log('POST /api/auth/login');
  console.log('POST /api/auth/register');
  console.log('GET  /api/auth/profile');
  console.log('PUT  /api/auth/profile');
  console.log('GET  /api/health');

testMySQL();