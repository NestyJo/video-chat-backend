/// <reference types="jest" />
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, IUser, UserRole } from '../../models/User';

describe('User Model', () => {
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

  describe('User Creation', () => {
    it('should create a user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as UserRole,
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('user');
      expect(savedUser.isActive).toBe(true);
    });

    it('should hash password on save', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'PlainPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      // Password should be hashed
      expect(savedUser.password).not.toBe('PlainPassword123!');
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude password and __v from JSON output', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      // Convert to JSON
      const userJSON = savedUser.toJSON();

      // Should not contain password or __v
      expect(userJSON).not.toHaveProperty('password');
      expect(userJSON).not.toHaveProperty('__v');

      // Should contain other fields
      expect(userJSON).toHaveProperty('username', 'testuser');
      expect(userJSON).toHaveProperty('email', 'test@example.com');
      expect(userJSON).toHaveProperty('firstName', 'Test');
      expect(userJSON).toHaveProperty('lastName', 'User');
    });

    it('should exclude password and __v from Object output', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      // Convert to Object
      const userObject = savedUser.toObject();

      // Should not contain password or __v
      expect(userObject).not.toHaveProperty('password');
      expect(userObject).not.toHaveProperty('__v');

      // Should contain other fields
      expect(userObject).toHaveProperty('username', 'testuser');
      expect(userObject).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('Instance Methods', () => {
    let user: IUser;

    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
      };

      user = new User(userData);
      await user.save();
    });

    it('should compare passwords correctly', async () => {
      const isValidPassword = await user.comparePassword('Test123!@#');
      expect(isValidPassword).toBe(true);

      const isInvalidPassword = await user.comparePassword('WrongPassword');
      expect(isInvalidPassword).toBe(false);
    });

    it('should return full name', () => {
      const fullName = user.getFullName();
      expect(fullName).toBe('John Doe');
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new User(userData);
      await user.save();
    });

    it('should find user by email', async () => {
      const foundUser = await (User as any).findByEmail('test@example.com');
      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe('testuser');
    });

    it('should find user by username', async () => {
      const foundUser = await (User as any).findByUsername('testuser');
      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe('test@example.com');
    });

    it('should handle case insensitive email search', async () => {
      const foundUser = await (User as any).findByEmail('TEST@EXAMPLE.COM');
      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe('testuser');
    });

    it('should handle case insensitive username search', async () => {
      const foundUser = await (User as any).findByUsername('TESTUSER');
      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe('test@example.com');
    });
  });

  describe('Validation', () => {
    it('should require username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Username is required');
    });

    it('should require email', async () => {
      const userData = {
        username: 'testuser',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    it('should validate username format', async () => {
      const userData = {
        username: 'test user!', // Invalid characters
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData1 = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const userData2 = {
        username: 'testuser2',
        email: 'test@example.com', // Same email
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      const userData1 = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const userData2 = {
        username: 'testuser', // Same username
        email: 'test2@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });
});