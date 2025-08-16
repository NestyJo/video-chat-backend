import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectMySQL, getSequelize } from './config/mysql';
import { initUserModel } from './models/User';
import { initMeetingModel } from './models/Meeting';
import { initMeetingParticipantModel } from './models/MeetingParticipant';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import calendarRoutes from './routes/calendar';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
app.use(rateLimiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MySQL
    try {
      const sequelize = await connectMySQL();
      // Initialize MySQL models
      const User = initUserModel(sequelize);
      const Meeting = initMeetingModel(sequelize);
      const MeetingParticipant = initMeetingParticipantModel(sequelize);
      
      // Set up model associations
      User.hasMany(Meeting, { foreignKey: 'organizerId', as: 'organizedMeetings' });
      Meeting.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });
      
      Meeting.hasMany(MeetingParticipant, { foreignKey: 'meetingId', as: 'participants' });
      MeetingParticipant.belongsTo(Meeting, { foreignKey: 'meetingId', as: 'meeting' });
      
      User.hasMany(MeetingParticipant, { foreignKey: 'userId', as: 'participations' });
      MeetingParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      
      console.log('✅ MySQL models and associations initialized');
    } catch (mysqlError) {
      console.error('❌ MySQL connection failed:', mysqlError);
      console.error('❌ Server cannot start without database');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔍 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`📅 Calendar API: http://localhost:${PORT}/api/calendar`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📝 Development Mode:');
        console.log('- MySQL database connected and ready');
        console.log('- Auth endpoints: /api/auth/*');
        console.log('- Calendar endpoints: /api/calendar/*');
        console.log('- Use MySQL on port 3307');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

export default app;