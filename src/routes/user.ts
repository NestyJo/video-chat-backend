import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getUserByUsername,
  deactivateUser,
  activateUser,
  getUserStats,
  searchUsers,
  checkUserExists,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and search
 * @access  Private
 */
router.get('/', authenticate, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, getUserById);

/**
 * @route   GET /api/users/username/:username
 * @desc    Get user by username
 * @access  Private
 */
router.get('/username/:username', authenticate, getUserByUsername);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (Admin only)
 */
router.put('/:id/deactivate', authenticate, authorize('admin'), deactivateUser);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activate user account
 * @access  Private (Admin only)
 */
router.put('/:id/activate', authenticate, authorize('admin'), activateUser);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, authorize('admin'), getUserStats);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search', authenticate, searchUsers);

/**
 * @route   GET /api/users/check
 * @desc    Check if user exists by email or username
 * @access  Public
 */
router.get('/check', checkUserExists);

export default router;