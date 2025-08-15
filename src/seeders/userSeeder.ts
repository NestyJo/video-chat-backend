import { User } from '../models/User';
import { AppError } from '../utils/AppError';

export interface SeedUserData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  bio?: string;
}

/**
 * Seeds users into the database
 * @param users - Array of user data to seed
 * @param options - Seeding options
 */
export const seedUsers = async (
  users: SeedUserData[],
  options: {
    skipExisting?: boolean;
    updateExisting?: boolean;
  } = {}
): Promise<void> => {
  const { skipExisting = true, updateExisting = false } = options;

  console.log(`🌱 Seeding ${users.length} users...`);

  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }],
      });

      if (existingUser) {
        if (skipExisting) {
          console.log(`⏭️  User ${userData.username} already exists, skipping...`);
          continue;
        } else if (updateExisting) {
          console.log(`🔄 Updating existing user ${userData.username}...`);
          
          // Update existing user (excluding password if not provided)
          const updateData: any = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            bio: userData.bio,
          };

          // Only update password if it's different from current
          if (userData.password) {
            updateData.password = userData.password;
          }

          await User.findByIdAndUpdate(existingUser._id, updateData);
          console.log(`✅ Updated user: ${userData.username}`);
          continue;
        } else {
          throw new AppError(`User ${userData.username} already exists`, 400);
        }
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    } catch (error) {
      console.error(`❌ Failed to seed user ${userData.username}:`, error);
      throw error;
    }
  }

  console.log('🎉 User seeding completed!');
};

/**
 * Creates a default admin user
 */
export const seedDefaultAdmin = async (): Promise<void> => {
  const { DEFAULT_ADMIN, SEED_CONFIG } = await import('./config');

  console.log('👑 Creating default admin user...');
  console.log(`📧 Admin email: ${DEFAULT_ADMIN.email}`);
  console.log(`👤 Admin username: ${DEFAULT_ADMIN.username}`);
  
  await seedUsers([DEFAULT_ADMIN], { skipExisting: SEED_CONFIG.skipExisting });
};

/**
 * Creates sample users for development
 */
export const seedSampleUsers = async (): Promise<void> => {
  const { SAMPLE_USERS, SEED_CONFIG } = await import('./config');

  console.log('👥 Creating sample users...');
  await seedUsers(SAMPLE_USERS, { skipExisting: SEED_CONFIG.skipExisting });
};

/**
 * Removes all users from the database (use with caution!)
 */
export const clearUsers = async (): Promise<void> => {
  console.log('🗑️  Clearing all users...');
  const result = await User.deleteMany({});
  console.log(`🗑️  Removed ${result.deletedCount} users`);
};