import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Extend the Request interface to include user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export {};