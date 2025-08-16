import { User, IUser, UserRole } from '../models/User';
import { AppError } from '../utils/AppError';

/**
 * Helper function to safely get user ID as string
 */
function getUserId(user: IUser): string {
  return user._id.toString();
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsers {
  users: IUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface UserPublicData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  role: UserRole;
  createdAt: Date;
}

export class UserService {
  /**
   * Get all users with pagination and search
   */
  static async getAllUsers(queryParams: UserQueryParams): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryParams;

    // Build query
    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: total,
        hasNextPage,
        hasPrevPage,
        limit,
      },
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserPublicData> {
    const user = await User.findById(id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 404);
    }

    return {
      id: getUserId(user),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<UserPublicData> {
    const user = await User.findOne({ username }).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 404);
    }

    return {
      id: getUserId(user),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId: string, currentUserId: string): Promise<void> {
    // Check if user is trying to deactivate themselves
    if (currentUserId === userId) {
      throw new AppError('You cannot deactivate your own account', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('User is already deactivated', 400);
    }

    user.isActive = false;
    await user.save();
  }

  /**
   * Activate user account
   */
  static async activateUser(userId: string): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isActive) {
      throw new AppError('User is already active', 400);
    }

    user.isActive = true;
    await user.save();
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    regularUsers: number;
  }> {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers,
    };
  }

  /**
   * Search users by various criteria
   */
  static async searchUsers(
    searchTerm: string,
    options: {
      limit?: number;
      includeInactive?: boolean;
    } = {}
  ): Promise<UserPublicData[]> {
    const { limit = 10, includeInactive = false } = options;

    const query: any = {
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (!includeInactive) {
      query.isActive = true;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit)
      .sort({ createdAt: -1 });

    return users.map(user => ({
      id: getUserId(user),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    }));
  }

  /**
   * Check if user exists by email or username
   */
  static async checkUserExists(email?: string, username?: string): Promise<{
    exists: boolean;
    field?: 'email' | 'username';
  }> {
    if (!email && !username) {
      throw new AppError('Email or username must be provided', 400);
    }

    const query: any = { $or: [] };

    if (email) {
      query.$or.push({ email });
    }

    if (username) {
      query.$or.push({ username });
    }

    const existingUser = await User.findOne(query);

    if (!existingUser) {
      return { exists: false };
    }

    // Determine which field matched
    const field = existingUser.email === email ? 'email' : 'username';

    return { exists: true, field };
  }
}