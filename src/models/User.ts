import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User role types
 */
export type UserRole = 'user' | 'admin';

/**
 * Transform function to remove sensitive and internal fields from user output
 * Used for both toJSON and toObject transformations
 */
function transformUserOutput(doc: any, ret: Record<string, any>): Record<string, any> {
  // Remove sensitive and internal fields using destructuring
  const { password, __v, ...cleanedRet } = ret;
  return cleanedRet;
}

/**
 * User document interface extending Mongoose Document
 */
export interface IUser extends Document {
  /** Unique username for the user */
  username: string;
  /** User's email address (unique) */
  email: string;
  /** Hashed password (excluded from queries by default) */
  password: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Optional user biography */
  bio?: string;
  /** User role - either 'user' or 'admin' */
  role: UserRole;
  /** Whether the user account is active */
  isActive: boolean;
  /** Last login timestamp */
  lastLogin?: Date;
  /** Account creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  
  // Instance methods
  /** Compare provided password with stored hash */
  comparePassword(candidatePassword: string): Promise<boolean>;
  /** Get user's full name */
  getFullName(): string;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username must not exceed 30 characters'],
      match: [/^[a-zA-Z0-9]+$/, 'Username must contain only alphanumeric characters'],
    },
    
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },
    
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters long'],
      maxlength: [50, 'First name must not exceed 50 characters'],
    },
    
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters long'],
      maxlength: [50, 'Last name must not exceed 50 characters'],
    },
    
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must not exceed 500 characters'],
    },
    
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: transformUserOutput,
    },
    toObject: {
      transform: transformUserOutput,
    },
  }
);

// Indexes (email and username already have unique indexes from schema definition)
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get full name
userSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by username
userSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username: username.toLowerCase() });
};

export const User = mongoose.model<IUser>('User', userSchema);