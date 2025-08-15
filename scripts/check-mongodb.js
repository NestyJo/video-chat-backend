#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://codeview26:ZHMFjcmjnXSaRm1Z@cluster0.jpxrpz3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB connection...');
  console.log(`📍 URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
  
  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('✅ MongoDB is running and accessible');
    
    const admin = client.db().admin();
    const status = await admin.serverStatus();
    
    console.log(`📊 MongoDB Version: ${status.version}`);
    console.log(`🏠 Host: ${status.host}`);
    console.log(`⏰ Uptime: ${Math.floor(status.uptime / 60)} minutes`);
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.log('❌ MongoDB connection failed');
    console.log(`💥 Error: ${error.message}`);
    console.log('\n💡 Solutions:');
    console.log('1. Start MongoDB with Docker: docker run -d -p 27017:27017 mongo:latest');
    console.log('2. Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.log('3. Use MongoDB Atlas: https://www.mongodb.com/cloud/atlas');
    console.log('4. Check setup guide: ./scripts/setup-mongodb.md');
    
    process.exit(1);
  }
}

checkMongoDB();