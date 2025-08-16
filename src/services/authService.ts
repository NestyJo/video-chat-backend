import { User, IUser, UserRole } from '../models/User';
import { AppError } from '../utils/AppError';
import { generateToken, TokenPayload } from '../utils/jwt';

/**
 * Helper function to safely get user ID as string
 */
function getUserId(user: IUser): string {
  return user._id.toString();
}

export interface RegisterUserData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: Date;
    lastLogin?: Date;
  };
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async registerUser(userData: RegisterUserData): Promise<AuthResponse> {
    const { username, email, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError('Email already registered', 400);
      }
      if (existingUser.username === username) {
        throw new AppError('Username already taken', 400);
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: getUserId(user),
      email: user.email,
    });

    return {
      user: {
        id: getUserId(user),
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Login user
   */
  static async loginUser(loginData: LoginUserData): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user by email and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: getUserId(user),
      email: user.email,
    });

    return {
      user: {
        id: getUserId(user),
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      token,
    };
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updateData: UpdateUserData
  ): Promise<IUser> {
    const { username, firstName, lastName, bio } = updateData;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new AppError('Username already taken', 400);
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(username && { username }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    return updatedUser;
  }

  /**
   * Verify user token and get user data
   */
  static async verifyUserToken(token: string): Promise<IUser> {
    // This would typically use the JWT utility to verify the token
    // and then fetch the user from the database
    // Implementation depends on your JWT verification logic
    throw new AppError('Method not implemented', 500);
  }
}