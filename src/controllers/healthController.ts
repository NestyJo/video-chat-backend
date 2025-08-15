import { Request, Response } from 'express';
import { HealthService } from '../services/healthService';

export const healthCheck = (req: Request, res: Response): void => {
  const healthStatus = HealthService.getHealthStatus();

  res.status(200).json({
    success: true,
    data: healthStatus,
  });
};

export const readinessCheck = (req: Request, res: Response): void => {
  const { isReady, status, message } = HealthService.getReadinessStatus();
  
  if (isReady) {
    res.status(200).json({
      success: true,
      message,
      data: status,
    });
  } else {
    res.status(503).json({
      success: false,
      message,
      data: status,
    });
  }
};