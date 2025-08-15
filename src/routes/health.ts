import { Router } from 'express';
import { healthCheck, readinessCheck } from '../controllers/healthController';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', healthCheck);

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check endpoint
 * @access  Public
 */
router.get('/ready', readinessCheck);

export default router;