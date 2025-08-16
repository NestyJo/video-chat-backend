import { Request, Response, NextFunction } from 'express';
import { UserService, UserQueryParams } from '../services/userService';
import { AppError } from '../utils/AppError';
import { IUser } from '../models/User';

/**
 * Helper function to safely get user ID as string
 */
function getUserId(user: IUser): string {
  return user._id.toString();
}

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queryParams: UserQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };
    
    const result = await UserService.getAllUsers(queryParams);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await UserService.getUserById(id);
    
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByUsername = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;
    
    const user = await UserService.getUserByUsername(username);
    
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    
    if (!currentUser) {
      throw new AppError('Authentication required', 401);
    }
    
    await UserService.deactivateUser(id, getUserId(currentUser));
    
    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const activateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    await UserService.activateUser(id);
    
    res.status(200).json({
      success: true,
      message: 'User activated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await UserService.getUserStats();
    
    res.status(200).json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users
 */
export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q: searchTerm } = req.query;
    const limit = parseInt(req.query.limit as string) || 10;
    const includeInactive = req.query.includeInactive === 'true';
    
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new AppError('Search term is required', 400);
    }
    
    const users = await UserService.searchUsers(searchTerm, {
      limit,
      includeInactive,
    });
    
    res.status(200).json({
      success: true,
      data: {
        users,
        searchTerm,
        count: users.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user exists
 */
export const checkUserExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, username } = req.query;
    
    const result = await UserService.checkUserExists(
      email as string,
      username as string
    );
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};