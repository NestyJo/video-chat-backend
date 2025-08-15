#!/usr/bin/env node

/**
 * API Testing Script for Agora Backend
 * Run with: node scripts/test-api.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'admin@agora.com';
const ADMIN_PASSWORD = 'Admin123!@#';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
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
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body,
            headers: res.headers
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

// Helper function to print test results
function printResult(success, message) {
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

// Helper function to print section headers
function printSection(title) {
  console.log(`\n${colors.blue}${title}${colors.reset}`);
  console.log('='.repeat(title.length));
}

// Test function
async function testEndpoint(method, path, data, headers, expectedStatus, description) {
  try {
    console.log(`${colors.cyan}Testing: ${description}${colors.reset}`);
    const response = await makeRequest(method, path, data, headers);
    
    if (response.statusCode === expectedStatus) {
      printResult(true, `${description} (Status: ${response.statusCode})`);
      return { success: true, response };
    } else {
      printResult(false, `${description} (Expected: ${expectedStatus}, Got: ${response.statusCode})`);
      console.log('Response:', JSON.stringify(response.body, null, 2));
      return { success: false, response };
    }
  } catch (error) {
    printResult(false, `${description} (Error: ${error.message})`);
    return { success: false, error };
  }
}

// Main testing function
async function runTests() {
  console.log(`${colors.magenta}🚀 Starting API Testing...${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  let userToken = null;
  let adminToken = null;
  let userId = null;

  // Test Health Endpoints
  printSection('📋 Testing Health Endpoints');
  await testEndpoint('GET', '/health', null, {}, 200, 'Health Check');
  await testEndpoint('GET', '/health/ready', null, {}, 200, 'Readiness Check');

  // Test Authentication
  printSection('🔐 Testing Authentication Endpoints');
  
  // Register new user
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User'
  };

  await testEndpoint('POST', '/auth/register', userData, {}, 201, 'Register New User');

  // Login user
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'TestPass123!'
  }, {}, 200, 'User Login');

  if (loginResult.success && loginResult.response.body.data) {
    userToken = loginResult.response.body.data.token;
    userId = loginResult.response.body.data.user.id;
    printResult(true, 'User token extracted successfully');
  }

  // Login admin
  const adminLoginResult = await testEndpoint('POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  }, {}, 200, 'Admin Login');

  if (adminLoginResult.success && adminLoginResult.response.body.data) {
    adminToken = adminLoginResult.response.body.data.token;
    printResult(true, 'Admin token extracted successfully');
  } else {
    console.log(`${colors.yellow}⚠️  Note: Make sure to seed admin user first with 'npm run seed'${colors.reset}`);
  }

  // Test protected endpoints
  if (userToken) {
    await testEndpoint('GET', '/auth/profile', null, {
      'Authorization': `Bearer ${userToken}`
    }, 200, 'Get User Profile');

    await testEndpoint('PUT', '/auth/profile', {
      firstName: 'Updated',
      lastName: 'User',
      bio: 'Updated bio'
    }, {
      'Authorization': `Bearer ${userToken}`
    }, 200, 'Update User Profile');
  }

  // Test User Management
  printSection('👥 Testing User Management Endpoints');

  if (userToken) {
    await testEndpoint('GET', '/users', null, {
      'Authorization': `Bearer ${userToken}`
    }, 200, 'Get All Users');

    await testEndpoint('GET', '/users?page=1&limit=5', null, {
      'Authorization': `Bearer ${userToken}`
    }, 200, 'Get Users with Pagination');

    await testEndpoint('GET', '/users/search?q=test', null, {
      'Authorization': `Bearer ${userToken}`
    }, 200, 'Search Users');

    if (userId) {
      await testEndpoint('GET', `/users/${userId}`, null, {
        'Authorization': `Bearer ${userToken}`
      }, 200, 'Get User by ID');
    }

    await testEndpoint('GET', '/users/username/testuser', null, {
      'Authorization': `Bearer ${userToken}`
    }, 200, 'Get User by Username');
  }

  // Test public endpoints
  await testEndpoint('GET', '/users/check?email=test@example.com', null, {}, 200, 'Check User Exists (Email)');
  await testEndpoint('GET', '/users/check?username=testuser', null, {}, 200, 'Check User Exists (Username)');

  // Test Admin Endpoints
  printSection('🔒 Testing Admin Endpoints');

  if (adminToken) {
    await testEndpoint('GET', '/users/stats', null, {
      'Authorization': `Bearer ${adminToken}`
    }, 200, 'Get User Statistics');

    if (userId) {
      await testEndpoint('PUT', `/users/${userId}/deactivate`, null, {
        'Authorization': `Bearer ${adminToken}`
      }, 200, 'Deactivate User');

      await testEndpoint('PUT', `/users/${userId}/activate`, null, {
        'Authorization': `Bearer ${adminToken}`
      }, 200, 'Activate User');
    }
  } else {
    console.log(`${colors.yellow}⚠️  Skipping admin tests - admin token not available${colors.reset}`);
  }

  // Test Error Cases
  printSection('🧪 Testing Error Cases');

  await testEndpoint('GET', '/auth/profile', null, {}, 401, 'Access Protected Endpoint Without Token');
  await testEndpoint('GET', '/users', null, {
    'Authorization': 'Bearer invalid_token'
  }, 401, 'Access with Invalid Token');

  await testEndpoint('POST', '/auth/register', {
    username: 'ab',
    email: 'invalid-email',
    password: '123'
  }, {}, 400, 'Register with Invalid Data');

  await testEndpoint('POST', '/auth/register', userData, {}, 400, 'Register Duplicate User');

  await testEndpoint('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'wrongpassword'
  }, {}, 401, 'Login with Wrong Password');

  // Summary
  printSection('📊 Test Summary');
  console.log(`${colors.green}✅ Tests completed!${colors.reset}\n`);
  
  console.log('📝 Notes:');
  console.log(`- Make sure the server is running on ${BASE_URL}`);
  console.log('- Seed admin user with: npm run seed');
  console.log('- Check server logs for detailed error information\n');
  
  console.log('🔗 Useful Commands:');
  console.log('- Start server: npm run dev');
  console.log('- Seed database: npm run seed:samples');
  console.log('- Check database: npm run check-db');
}

// Run the tests
runTests().catch(console.error);