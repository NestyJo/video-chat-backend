import { Router, Request, Response } from 'express';
import { isMySQLConnected } from '../config/mysql';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      status: isMySQLConnected() ? 'Connected' : 'Disconnected',
      type: 'MySQL',
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || '3307',
    },
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
    },
  };

  res.status(200).json({
    success: true,
    data: healthData,
  });
});

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check endpoint
 * @access  Public
 */
router.get('/ready', (req: Request, res: Response) => {
  const isReady = isMySQLConnected();
  
  if (isReady) {
    res.status(200).json({
      success: true,
      message: 'Service is ready with database connection',
      data: {
        database: {
          status: 'Connected',
          connected: true,
          type: 'MySQL',
        },
        server: {
          status: 'Running',
          ready: true,
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Service is not ready - database connection required',
      data: {
        database: {
          status: 'Disconnected',
          connected: false,
          type: 'MySQL',
        },
        server: {
          status: 'Running',
          ready: false,
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  }
});

export default router;