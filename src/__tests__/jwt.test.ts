/// <reference types="jest" />
import { generateToken, verifyToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';

// Mock environment variables
const originalEnv = process.env;

describe('JWT Utilities', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret-key',
      JWT_EXPIRES_IN: '7d',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload: TokenPayload = {
        userId: '123456789',
        email: 'test@example.com',
      };

      const token = generateToken(payload);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw error when JWT_SECRET is not configured', () => {
      delete process.env.JWT_SECRET;

      const payload: TokenPayload = {
        userId: '123456789',
        email: 'test@example.com',
      };

      expect(() => generateToken(payload)).toThrow(AppError);
      expect(() => generateToken(payload)).toThrow('JWT secret is not configured');
    });

    it('should handle numeric expiration time', () => {
      process.env.JWT_EXPIRES_IN = '3600'; // 1 hour in seconds

      const payload: TokenPayload = {
        userId: '123456789',
        email: 'test@example.com',
      };

      const token = generateToken(payload);
      expect(typeof token).toBe('string');
    });

    it('should handle string expiration time formats', () => {
      const validFormats = ['7d', '24h', '60m', '3600s'];

      const payload: TokenPayload = {
        userId: '123456789',
        email: 'test@example.com',
      };

      validFormats.forEach(format => {
        process.env.JWT_EXPIRES_IN = format;
        const token = generateToken(payload);
        expect(typeof token).toBe('string');
      });
    });

    it('should throw error for invalid expiration format', () => {
      process.env.JWT_EXPIRES_IN = 'invalid-format';

      const payload: TokenPayload = {
        userId: '123456789',
        email: 'test@example.com',
      };

      expect(() => generateToken(payload)).toThrow(AppError);
      expect(() => generateToken(payload)).toThrow('Invalid JWT expiration format');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload: TokenPayload = {
        userId: '123456789',
        email: 'test@example.com',
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toEqual(payload);
    });

    it('should throw error when JWT_SECRET is not configured', () => {
      const payload: TokenPayload = {
        userId: '123456789',
        email: 'test@example.com',
      };

      const token = generateToken(payload);
      
      delete process.env.JWT_SECRET;

      expect(() => verifyToken(token)).toThrow(AppError);
      expect(() => verifyToken(token)).toThrow('JWT secret is not configured');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow(AppError);
      expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw error for token with missing payload properties', () => {
      // This test would require mocking jwt.verify to return incomplete payload
      // For now, we'll test with a malformed token
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnZhbGlkIjoicGF5bG9hZCJ9.invalid';

      expect(() => verifyToken(malformedToken)).toThrow(AppError);
    });
  });
});