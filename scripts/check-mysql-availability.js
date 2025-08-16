#!/usr/bin/env node

const { spawn } = require('child_process');

function checkMySQLAvailability() {
  console.log('🔍 Checking MySQL Availability...');
  console.log('================================');

  // Check if MySQL command is available
  const mysql = spawn('mysql', ['--version'], { stdio: 'pipe' });

  mysql.stdout.on('data', (data) => {
    console.log('✅ MySQL is installed:');
    console.log(data.toString().trim());
    testConnection();
  });

  mysql.stderr.on('data', (data) => {
    console.log('⚠️ MySQL command output:', data.toString().trim());
  });

  mysql.on('close', (code) => {
    if (code !== 0) {
      console.log('❌ MySQL is not installed or not in PATH');
      console.log('');
      console.log('💡 Installation Options:');
      console.log('1. Download from: https://dev.mysql.com/downloads/mysql/');
      console.log('2. Docker: docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql:8.0');
      console.log('3. Package manager:');
      console.log('   - Windows: choco install mysql');
      console.log('   - macOS: brew install mysql');
      console.log('   - Ubuntu: sudo apt install mysql-server');
    }
  });

  mysql.on('error', (err) => {
    console.log('❌ MySQL is not available:', err.message);
    console.log('');
    console.log('💡 Please install MySQL first:');
    console.log('- Download: https://dev.mysql.com/downloads/mysql/');
    console.log('- Or use Docker: docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql:8.0');
  });
}

function testConnection() {
  console.log('');
  console.log('🔌 Testing MySQL Connection...');
  
  // Try to connect to MySQL
  const mysql = spawn('mysql', ['-u', 'root', '-e', 'SELECT VERSION();'], { stdio: 'pipe' });

  mysql.stdout.on('data', (data) => {
    console.log('✅ MySQL connection successful!');
    console.log('MySQL Version:', data.toString().trim());
    console.log('');
    console.log('🎉 MySQL is ready for use!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Install Node.js MySQL packages');
    console.log('2. Configure database connection');
    console.log('3. Create database and tables');
  });

  mysql.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error.includes('Access denied')) {
      console.log('⚠️ MySQL is running but access denied');
      console.log('💡 Try setting a password or use: mysql -u root -p');
    } else {
      console.log('⚠️ MySQL connection issue:', error);
    }
  });

  mysql.on('close', (code) => {
    if (code !== 0) {
      console.log('❌ Could not connect to MySQL');
      console.log('💡 Make sure MySQL service is running');
      console.log('💡 Check if you need a password: mysql -u root -p');
    }
  });

  mysql.on('error', (err) => {
    console.log('❌ MySQL connection error:', err.message);
  });
}

checkMySQLAvailability();