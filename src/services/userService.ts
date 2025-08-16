import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedUsers {
  users: User[];
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
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  role: string;
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
      sortOrder = 'DESC',
    } = queryParams;

    // Build where clause
    const whereClause: any = { isActive: true };

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Execute query
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      attributes: { exclude: ['password'] },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: count,
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
    const user = await User.findByPk(parseInt(id), {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 404);
    }

    return {
      id: user.id,
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
    const user = await User.findByUsername(username);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 404);
    }

    return {
      id: user.id,
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

    const user = await User.findByPk(parseInt(userId));

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('User is already deactivated', 400);
    }

    await user.update({ isActive: false });
  }

  /**
   * Activate user account
   */
  static async activateUser(userId: string): Promise<void> {
    const user = await User.findByPk(parseInt(userId));

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isActive) {
      throw new AppError('User is already active', 400);
    }

    await user.update({ isActive: true });
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
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: false } }),
      User.count({ where: { role: 'admin' } }),
      User.count({ where: { role: 'user' } }),
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

    const whereClause: any = {
      [Op.or]: [
        { username: { [Op.like]: `%${searchTerm}%` } },
        { firstName: { [Op.like]: `%${searchTerm}%` } },
        { lastName: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
      ],
    };

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit,
      order: [['createdAt', 'DESC']],
    });

    return users.map(user => ({
      id: user.id,
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

    const whereClause: any = { [Op.or]: [] };

    if (email) {
      whereClause[Op.or].push({ email });
    }

    if (username) {
      whereClause[Op.or].push({ username });
    }

    const existingUser = await User.findOne({ where: whereClause });

    if (!existingUser) {
      return { exists: false };
    }

    // Determine which field matched
    const field = existingUser.email === email ? 'email' : 'username';

    return { exists: true, field };
  }
}