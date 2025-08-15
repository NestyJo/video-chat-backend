import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean up expired entries
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
  
  // Initialize or get client data
  if (!store[clientId] || store[clientId].resetTime < now) {
    store[clientId] = {
      count: 1,
      resetTime: now + windowMs,
    };
  } else {
    store[clientId].count++;
  }
  
  const { count, resetTime } = store[clientId];
  
  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': Math.max(0, maxRequests - count).toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
  });
  
  // Check if limit exceeded
  if (count > maxRequests) {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        retryAfter: new Date(resetTime).toISOString(),
      },
    });
    return;
  }
  
  next();
};