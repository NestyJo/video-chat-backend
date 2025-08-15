/// <reference types="jest" />
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { seedDefaultAdmin, seedSampleUsers, clearUsers, seedUsers } from '../seeders/userSeeder';

describe('Database Seeding', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  describe('seedDefaultAdmin', () => {
    it('should create default admin user', async () => {
      await seedDefaultAdmin();

      const adminUser = await User.findOne({ role: 'admin' });
      expect(adminUser).toBeTruthy();
      expect(adminUser?.username).toBe('admin');
      expect(adminUser?.email).toBe('admin@agora.com');
      expect(adminUser?.role).toBe('admin');
    });

    it('should skip existing admin user', async () => {
      // Create admin first time
      await seedDefaultAdmin();
      const firstCount = await User.countDocuments();

      // Try to create again
      await seedDefaultAdmin();
      const secondCount = await User.countDocuments();

      expect(firstCount).toBe(secondCount);
    });
  });

  describe('seedSampleUsers', () => {
    it('should create sample users including admin', async () => {
      await seedSampleUsers();

      const totalUsers = await User.countDocuments();
      const adminUsers = await User.countDocuments({ role: 'admin' });
      const regularUsers = await User.countDocuments({ role: 'user' });

      expect(totalUsers).toBeGreaterThan(0);
      expect(adminUsers).toBeGreaterThan(0);
      expect(regularUsers).toBeGreaterThan(0);
    });

    it('should create users with correct data', async () => {
      await seedSampleUsers();

      const johnDoe = await User.findOne({ username: 'johndoe' });
      expect(johnDoe).toBeTruthy();
      expect(johnDoe?.email).toBe('john.doe@example.com');
      expect(johnDoe?.role).toBe('user');
    });
  });

  describe('seedUsers', () => {
    it('should create custom users', async () => {
      const customUsers = [
        {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
          role: 'user' as const,
        },
      ];

      await seedUsers(customUsers);

      const user = await User.findOne({ username: 'testuser' });
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });

    it('should handle duplicate users correctly', async () => {
      const userData = {
        username: 'duplicate',
        email: 'duplicate@example.com',
        password: 'Test123!@#',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'user' as const,
      };

      // Create user first time
      await seedUsers([userData]);
      const firstCount = await User.countDocuments();

      // Try to create again with skipExisting: true
      await seedUsers([userData], { skipExisting: true });
      const secondCount = await User.countDocuments();

      expect(firstCount).toBe(secondCount);
    });
  });

  describe('clearUsers', () => {
    it('should remove all users', async () => {
      // Create some users first
      await seedSampleUsers();
      const beforeCount = await User.countDocuments();
      expect(beforeCount).toBeGreaterThan(0);

      // Clear all users
      await clearUsers();
      const afterCount = await User.countDocuments();
      expect(afterCount).toBe(0);
    });
  });

  describe('password hashing', () => {
    it('should hash passwords when creating users', async () => {
      const userData = {
        username: 'hashtest',
        email: 'hash@example.com',
        password: 'PlainPassword123!',
        firstName: 'Hash',
        lastName: 'Test',
        role: 'user' as const,
      };

      await seedUsers([userData]);

      const user = await User.findOne({ username: 'hashtest' }).select('+password');
      expect(user).toBeTruthy();
      expect(user?.password).not.toBe('PlainPassword123!');
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should allow password comparison', async () => {
      const userData = {
        username: 'comparetest',
        email: 'compare@example.com',
        password: 'TestPassword123!',
        firstName: 'Compare',
        lastName: 'Test',
        role: 'user' as const,
      };

      await seedUsers([userData]);

      const user = await User.findOne({ username: 'comparetest' }).select('+password');
      expect(user).toBeTruthy();
      
      const isValid = await user!.comparePassword('TestPassword123!');
      expect(isValid).toBe(true);
      
      const isInvalid = await user!.comparePassword('WrongPassword');
      expect(isInvalid).toBe(false);
    });
  });
});