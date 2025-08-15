import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://codeview26:ZHMFjcmjnXSaRm1Z@cluster0.jpxrpz3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
   
    
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log(`📍 MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000, 
      bufferCommands: false, 
    });

    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.error('💡 Make sure MongoDB is running on your system.');
    console.error('💡 You can start MongoDB with: mongod --dbpath /path/to/your/db');
    console.error('💡 Or install MongoDB from: https://www.mongodb.com/try/download/community');
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};