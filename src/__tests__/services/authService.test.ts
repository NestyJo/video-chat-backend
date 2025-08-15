/// <reference types="jest" />
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../models/User';
import { AuthService } from '../../services/authService';
import { AppError } from '../../utils/AppError';

describe('AuthService', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await AuthService.registerUser(userData);

      expect(result.user.username).toBe(userData.username);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.role).toBe('user');
      expect(result.token).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      await AuthService.registerUser(userData);

      const duplicateData = {
        ...userData,
        username: 'different',
      };

      await expect(AuthService.registerUser(duplicateData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      await AuthService.registerUser(userData);

      const duplicateData = {
        ...userData,
        email: 'different@example.com',
      };

      await expect(AuthService.registerUser(duplicateData)).rejects.toThrow(
        'Username already taken'
      );
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };
      await AuthService.registerUser(userData);
    });

    it('should login user with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      const result = await AuthService.loginUser(loginData);

      expect(result.user.email).toBe(loginData.email);
      expect(result.token).toBeDefined();
      expect(result.user.lastLogin).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'Test123!@#',
      };

      await expect(AuthService.loginUser(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      await expect(AuthService.loginUser(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for deactivated account', async () => {
      // Deactivate the user
      await User.findOneAndUpdate(
        { email: 'test@example.com' },
        { isActive: false }
      );

      const loginData = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      await expect(AuthService.loginUser(loginData)).rejects.toThrow(
        'Account is deactivated'
      );
    });
  });

  describe('getUserProfile', () => {
    let userId: string;

    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };
      const result = await AuthService.registerUser(userData);
      userId = result.user.id;
    });

    it('should get user profile successfully', async () => {
      const profile = await AuthService.getUserProfile(userId);

      expect(profile.username).toBe('testuser');
      expect(profile.email).toBe('test@example.com');
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(AuthService.getUserProfile(fakeId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('updateUserProfile', () => {
    let userId: string;

    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };
      const result = await AuthService.registerUser(userData);
      userId = result.user.id;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio',
      };

      const updatedUser = await AuthService.updateUserProfile(userId, updateData);

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.bio).toBe('Updated bio');
    });

    it('should throw error for duplicate username', async () => {
      // Create another user
      const anotherUser = {
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Test123!@#',
        firstName: 'Another',
        lastName: 'User',
      };
      await AuthService.registerUser(anotherUser);

      const updateData = {
        username: 'anotheruser', // Try to use existing username
      };

      await expect(
        AuthService.updateUserProfile(userId, updateData)
      ).rejects.toThrow('Username already taken');
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        firstName: 'Updated',
      };

      await expect(
        AuthService.updateUserProfile(fakeId, updateData)
      ).rejects.toThrow('User not found');
    });
  });
});