import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedDefaultAdmin, seedSampleUsers, clearUsers } from './userSeeder';

// Load environment variables
dotenv.config();

/**
 * Main seeding function
 */
export const runSeeders = async (options: {
  admin?: boolean;
  samples?: boolean;
  clear?: boolean;
} = {}): Promise<void> => {
  const { admin = true, samples = false, clear = false } = options;

  try {
    console.log('🚀 Starting database seeding...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Connect to database
    await connectDatabase();

    // Clear existing data if requested
    if (clear) {
      console.log('⚠️  Clearing existing data...');
      await clearUsers();
    }

    // Seed admin user
    if (admin) {
      await seedDefaultAdmin();
    }

    // Seed sample users
    if (samples) {
      await seedSampleUsers();
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    // Disconnect from database
    await disconnectDatabase();
  }
};

/**
 * CLI interface for seeding
 */
const runCLI = async (): Promise<void> => {
  const args = process.argv.slice(2);
  
  const options = {
    admin: args.includes('--admin') || args.includes('-a') || args.length === 0,
    samples: args.includes('--samples') || args.includes('-s'),
    clear: args.includes('--clear') || args.includes('-c'),
  };

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🌱 Database Seeder

Usage: npm run seed [options]

Options:
  --admin, -a     Seed default admin user (default: true)
  --samples, -s   Seed sample users for development
  --clear, -c     Clear all existing users before seeding
  --help, -h      Show this help message

Examples:
  npm run seed                    # Seed admin user only
  npm run seed --admin            # Seed admin user only
  npm run seed --samples          # Seed admin + sample users
  npm run seed --clear --samples  # Clear all users, then seed admin + samples

Default Admin Credentials:
  Username: admin
  Email: admin@agora.com
  Password: Admin123!@#
    `);
    return;
  }

  try {
    await runSeeders(options);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  }
};

// Run CLI if this file is executed directly
if (require.main === module) {
  runCLI();
}