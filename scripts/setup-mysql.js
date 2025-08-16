#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupMySQL() {
  console.log('🔧 Setting up MySQL Database...');
  
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  };

  const dbName = process.env.MYSQL_DATABASE || 'agora_backend';

  try {
    // Connect to MySQL server (without database)
    console.log(`📍 Connecting to MySQL at ${config.host}:${config.port}...`);
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    console.log(`🗄️  Creating database '${dbName}' if it doesn't exist...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' is ready`);

    // Close connection
    await connection.end();
    console.log('🔌 Disconnected from MySQL server');

    console.log('\\n🎉 MySQL setup completed successfully!');
    console.log('\\n📋 Database Configuration:');
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`Database: ${dbName}`);
    console.log(`Username: ${config.user}`);
    
    console.log('\\n🚀 Next steps:');
    console.log('1. Run: npm run mysql:seed-admin');
    console.log('2. Start server: npm run dev');
    console.log('3. Test: npm run mysql:test');

  } catch (error) {
    console.error('❌ MySQL setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\\n💡 MySQL Connection Troubleshooting:');
      console.log('1. Make sure MySQL is installed and running');
      console.log('2. Check if MySQL service is started');
      console.log('3. Verify connection details in .env file');
      console.log('\\n🐳 Quick MySQL with Docker:');
      console.log('docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password --name mysql-agora mysql:8.0');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\\n💡 Authentication Error:');
      console.log('1. Check MySQL username and password in .env');
      console.log('2. Make sure the user has database creation privileges');
    }
  }
}

setupMySQL();