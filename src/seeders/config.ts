import { SeedUserData } from './userSeeder';

/**
 * Default admin user configuration
 * You can modify these values or override them with environment variables
 */
export const DEFAULT_ADMIN: SeedUserData = {
  username: process.env.ADMIN_USERNAME || 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@agora.com',
  password: process.env.ADMIN_PASSWORD || 'Admin123!@#',
  firstName: process.env.ADMIN_FIRST_NAME || 'System',
  lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
  role: 'admin',
  bio: 'Default system administrator account',
};

/**
 * Sample users for development
 */
export const SAMPLE_USERS: SeedUserData[] = [
  {
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'User123!@#',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    bio: 'Sample user account for testing',
  },
  {
    username: 'janedoe',
    email: 'jane.doe@example.com',
    password: 'User123!@#',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'user',
    bio: 'Another sample user account',
  },
  {
    username: 'moderator',
    email: 'moderator@agora.com',
    password: 'Mod123!@#',
    firstName: 'Site',
    lastName: 'Moderator',
    role: 'admin',
    bio: 'Site moderator with admin privileges',
  },
  {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    bio: 'Test user for automated testing',
  },
];

/**
 * Seeding configuration
 */
export const SEED_CONFIG = {
  // Skip existing users by default
  skipExisting: true,
  
  // Update existing users if they already exist
  updateExisting: false,
  
  // Show detailed logging
  verbose: process.env.NODE_ENV === 'development',
};