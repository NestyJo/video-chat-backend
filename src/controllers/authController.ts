import { Request, Response, NextFunction } from 'express';
import { AuthService, RegisterUserData, UpdateUserData } from '../services/authService';
import { AppError } from '../utils/AppError';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userData: RegisterUserData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    };
    
    const result = await AuthService.registerUser(userData);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loginData = {
      email: req.body.email,
      password: req.body.password,
    };
    
    const result = await AuthService.loginUser(loginData);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }
    
    const userProfile = await AuthService.getUserProfile(user._id.toString());
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: userProfile._id,
          username: userProfile.username,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          bio: userProfile.bio,
          role: userProfile.role,
          isActive: userProfile.isActive,
          lastLogin: userProfile.lastLogin,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }
    
    const updateData: UpdateUserData = {
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio,
    };
    
    const updatedUser = await AuthService.updateUserProfile(
      user._id.toString(),
      updateData
    );
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          bio: updatedUser.bio,
          role: updatedUser.role,
          updatedAt: updatedUser.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};