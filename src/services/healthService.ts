import mongoose from 'mongoose';

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database: {
    status: string;
    readyState: number;
    name: string;
    host: string;
    port: string;
  };
  memory: {
    used: number;
    total: number;
    external: number;
  };
}

export interface ReadinessStatus {
  database: {
    status: string;
    connected: boolean;
  };
  server: {
    status: string;
    ready: boolean;
  };
  timestamp: string;
  environment: string;
}

export class HealthService {
  /**
   * Get comprehensive health status
   */
  static getHealthStatus(): HealthStatus {
    const dbReadyState = mongoose.connection.readyState;
    const dbStates = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStates[dbReadyState as keyof typeof dbStates] || 'Unknown',
        readyState: dbReadyState,
        name: mongoose.connection.name || 'Not connected',
        host: mongoose.connection.host || 'Not connected',
        port: mongoose.connection.port?.toString() || 'Not connected',
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
      },
    };
  }

  /**
   * Get readiness status
   */
  static getReadinessStatus(): {
    isReady: boolean;
    status: ReadinessStatus;
    message: string;
  } {
    const dbReadyState = mongoose.connection.readyState;
    const isDbConnected = dbReadyState === 1;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development, consider service ready even without database
    const isReady = isDbConnected || isDevelopment;

    const dbStates = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    const status: ReadinessStatus = {
      database: {
        status: dbStates[dbReadyState as keyof typeof dbStates] || 'Unknown',
        connected: isDbConnected,
      },
      server: {
        status: 'Running',
        ready: isReady,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    const message = isDbConnected
      ? 'Service is ready with database connection'
      : isReady
      ? 'Service is ready (running without database in development mode)'
      : 'Service is not ready - database connection required in production';

    return {
      isReady,
      status,
      message,
    };
  }

  /**
   * Get database connection status
   */
  static getDatabaseStatus(): {
    connected: boolean;
    readyState: number;
    status: string;
    connectionInfo: {
      name: string;
      host: string;
      port: string;
    };
  } {
    const dbReadyState = mongoose.connection.readyState;
    const dbStates = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    return {
      connected: dbReadyState === 1,
      readyState: dbReadyState,
      status: dbStates[dbReadyState as keyof typeof dbStates] || 'Unknown',
      connectionInfo: {
        name: mongoose.connection.name || 'Not connected',
        host: mongoose.connection.host || 'Not connected',
        port: mongoose.connection.port?.toString() || 'Not connected',
      },
    };
  }

  /**
   * Get system metrics
   */
  static getSystemMetrics(): {
    uptime: number;
    memory: {
      used: number;
      total: number;
      external: number;
      rss: number;
    };
    cpu: {
      usage: NodeJS.CpuUsage;
    };
    process: {
      pid: number;
      version: string;
      platform: string;
      arch: string;
    };
  } {
    const memoryUsage = process.memoryUsage();

    return {
      uptime: process.uptime(),
      memory: {
        used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
        rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      },
      cpu: {
        usage: process.cpuUsage(),
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };
  }
}