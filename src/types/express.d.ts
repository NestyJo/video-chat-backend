import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Extend the Request interface to include user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}

export {};