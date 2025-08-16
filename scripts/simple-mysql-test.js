#!/usr/bin/env node

/**
 * Simple MySQL connection test without external dependencies
 * This will work once MySQL packages are installed
 */

console.log('🧪 MySQL Connection Test');
console.log('========================');

// Check if mysql2 is available
try {
  const mysql = require('mysql2/promise');
  console.log('✅ mysql2 package is available');
  testMySQLConnection();
} catch (error) {
  console.log('❌ mysql2 package not found');
  console.log('💡 Install with: npm install mysql2 sequelize');
  console.log('');
  console.log('📋 Manual Installation Steps:');
  console.log('1. Install MySQL server (Docker or native)');
  console.log('2. Install Node.js packages: npm install mysql2 sequelize');
  console.log('3. Run this test again');
  console.log('');
  console.log('🐳 Quick Docker Setup:');
  console.log('docker run -d --name mysql-agora -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql:8.0');
  process.exit(1);
}

async function testMySQLConnection() {
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
  };

  console.log(`📍 Testing connection to ${config.host}:${config.port}`);
  console.log(`👤 Username: ${config.user}`);

  try {
    const mysql = require('mysql2/promise');
    
    // Test connection
    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL connection successful!');
    
    // Test query
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`📊 MySQL Version: ${rows[0].version}`);
    
    // Create database if it doesn't exist
    const dbName = process.env.MYSQL_DATABASE || 'agora_backend';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' is ready`);
    
    await connection.end();
    
    console.log('');
    console.log('🎉 MySQL is working perfectly!');
    console.log('✅ Connection: Success');
    console.log('✅ Database: Created');
    console.log('✅ Ready for application use');
    
    return true;
    
  } catch (error) {
    console.log('❌ MySQL connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL server is not running');
      console.log('💡 Start MySQL service or Docker container');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Check username and password');
      console.log('💡 Default: root/password (for Docker setup)');
    }
    
    return false;
  }
}