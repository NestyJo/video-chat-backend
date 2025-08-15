import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { AppError } from './AppError';

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Validates and converts JWT expiration time to proper format
 * @param expiresIn - Expiration time as string or number
 * @returns Properly formatted expiration time
 */
const validateExpiresIn = (expiresIn: string): string | number => {
  // If it's a number string, convert to number (seconds)
  if (/^\d+$/.test(expiresIn)) {
    return parseInt(expiresIn, 10);
  }
  
  // Validate string format (e.g., '7d', '24h', '60m', '3600s')
  const validTimeFormat = /^\d+[smhd]$/.test(expiresIn);
  if (!validTimeFormat) {
    throw new AppError(
      'Invalid JWT expiration format. Use formats like: 7d, 24h, 60m, 3600s, or number of seconds',
      500
    );
  }
  
  return expiresIn;
};

/**
 * Generates a JWT token with the provided payload
 * @param payload - Token payload containing userId and email
 * @returns Signed JWT token string
 * @throws AppError if JWT secret is not configured or expiration format is invalid
 */
export const generateToken = (payload: TokenPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  if (!jwtSecret) {
    throw new AppError('JWT secret is not configured', 500);
  }
  
  // Validate and convert expiresIn to proper type
  const expiresIn = validateExpiresIn(jwtExpiresIn);
  
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };
  
  return jwt.sign(payload, jwtSecret, options);
};

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws AppError if token is invalid, expired, or malformed
 */
export const verifyToken = (token: string): TokenPayload => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new AppError('JWT secret is not configured', 500);
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload & TokenPayload;
    
    // Validate that the decoded token has the required properties
    if (!decoded.userId || !decoded.email) {
      throw new AppError('Invalid token payload', 401);
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    } else if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError('Token verification failed', 401);
    }
  }
};