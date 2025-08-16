import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { generateToken } from '../utils/jwt';

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
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
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
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      throw new AppError('Email already registered', 400);
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      throw new AppError('Username already taken', 400);
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'user',
      isActive: true,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user.id,
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

    // Find user by email
    const user = await User.findByEmail(email);

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
      userId: user.id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user.id,
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
  static async getUserProfile(userId: string): Promise<User> {
    const user = await User.findByPk(parseInt(userId));

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
  ): Promise<User> {
    const { username, firstName, lastName, bio } = updateData;

    const user = await User.findByPk(parseInt(userId));

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== user.id) {
        throw new AppError('Username already taken', 400);
      }
    }

    // Update user
    await user.update({
      ...(username && { username }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(bio !== undefined && { bio }),
    });

    return user;
  }
}