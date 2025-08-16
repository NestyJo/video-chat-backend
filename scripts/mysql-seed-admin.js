#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedMySQLAdmin() {
  console.log('🌱 Seeding MySQL Admin User...');
  
  const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || 'agora_backend',
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  };

  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    username: dbConfig.username,
    password: dbConfig.password,
    logging: false,
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database');

    // Define User model (simplified for seeding)
    const User = sequelize.define('User', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    }, {
      tableName: 'users',
      timestamps: true,
      underscored: true,
    });

    // Sync database (create tables)
    await sequelize.sync({ force: false });
    console.log('🔄 Database tables synchronized');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@agora.com' }
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists, updating...');
      
      // Update existing admin
      const hashedPassword = await bcrypt.hash('Admin123!@#', 12);
      await existingAdmin.update({
        username: 'admin',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
      });
      
      console.log('✅ Admin user updated successfully');
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const hashedPassword = await bcrypt.hash('Admin123!@#', 12);
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@agora.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
      });
      
      console.log('✅ Admin user created successfully');
    }

    // Test login
    console.log('\\n🧪 Testing admin credentials...');
    const testAdmin = await User.findOne({
      where: { email: 'admin@agora.com' }
    });
    
    if (testAdmin) {
      const passwordTest = await bcrypt.compare('Admin123!@#', testAdmin.password);
      console.log(`🔐 Password test: ${passwordTest ? '✅ VALID' : '❌ INVALID'}`);
      
      if (passwordTest) {
        console.log('\\n🎉 MySQL Admin user is ready!');
        console.log('\\n📋 Admin Credentials:');
        console.log('Email: admin@agora.com');
        console.log('Password: Admin123!@#');
        console.log('\n🔗 Test endpoints:');
        console.log('POST /api/auth/login');
        console.log('GET  /api/auth/profile');
        console.log('PUT  /api/auth/profile');
        console.log('GET  /api/health');
      }
    }

  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.log('\\n💡 Connection Error:');
      console.log('1. Make sure MySQL is running');
      console.log('2. Check database configuration in .env');
      console.log('3. Run: npm run mysql:setup first');
    }
  } finally {
    await sequelize.close();
    console.log('\\n🔌 Disconnected from MySQL');
  }
}

seedMySQLAdmin();