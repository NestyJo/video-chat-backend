#!/usr/bin/env node

require('dotenv').config();

console.log('🧪 Testing MySQL Connection on Port 3307');
console.log('==========================================');

// Check if mysql2 is available
try {
  const mysql = require('mysql2/promise');
  console.log('✅ mysql2 package is available');
  testConnection();
} catch (error) {
  console.log('❌ mysql2 package not found');
  console.log('💡 The packages are defined in package.json but not installed');
  console.log('💡 Run: npm install');
  console.log('');
  console.log('📋 Current MySQL Configuration:');
  console.log(`Host: ${process.env.MYSQL_HOST || 'localhost'}`);
  console.log(`Port: ${process.env.MYSQL_PORT || '3307'}`);
  console.log(`Database: ${process.env.MYSQL_DATABASE || 'agora_backend'}`);
  console.log(`Username: ${process.env.MYSQL_USERNAME || 'root'}`);
  console.log(`Password: ${process.env.MYSQL_PASSWORD ? '[SET]' : '[NOT SET]'}`);
  process.exit(1);
}

async function testConnection() {
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3307'),
    user: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
  };

  console.log('📋 MySQL Configuration:');
  console.log(`📍 Host: ${config.host}:${config.port}`);
  console.log(`👤 Username: ${config.user}`);
  console.log(`🔑 Password: ${config.password ? '[SET]' : '[NOT SET]'}`);
  console.log('');

  try {
    const mysql = require('mysql2/promise');
    
    console.log('🔌 Attempting to connect...');
    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL connection successful!');
    
    // Test query
    console.log('🔍 Testing query...');
    const [rows] = await connection.execute('SELECT VERSION() as version, NOW() as server_time');
    console.log(`📊 MySQL Version: ${rows[0].version}`);
    console.log(`⏰ Server Time: ${rows[0].server_time}`);
    
    // Create database if it doesn't exist
    const dbName = process.env.MYSQL_DATABASE || 'agora_backend';
    console.log(`🗄️  Creating database '${dbName}' if it doesn't exist...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' is ready`);
    
    // Test connecting to the specific database
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Successfully connected to database '${dbName}'`);
    
    await connection.end();
    
    console.log('');
    console.log('🎉 MySQL Connection Test: SUCCESS!');
    console.log('✅ Connection: Working');
    console.log('✅ Database: Created and accessible');
    console.log('✅ Ready for application use');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. MySQL is working perfectly');
    console.log('2. Ready to remove MongoDB implementation');
    console.log('3. Set up MySQL tables and seed data');
    
    return true;
    
  } catch (error) {
    console.log('❌ MySQL connection failed:', error.message);
    console.log('');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Troubleshooting:');
      console.log('- Check if MySQL Docker container is running');
      console.log('- Verify port 3307 is correct');
      console.log('- Check Docker: docker ps');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Authentication Error:');
      console.log('- Check username and password');
      console.log('- Verify MySQL user permissions');
    } else {
      console.log('💡 Error Details:', error.code);
    }
    
    console.log('');
    console.log('🐳 Docker Commands:');
    console.log('- Check containers: docker ps');
    console.log('- Check logs: docker logs [container_name]');
    console.log('- Connect manually: docker exec -it [container_name] mysql -u root -p');
    
    return false;
  }
}