import { Sequelize } from 'sequelize';

// Connection state tracking
let isConnected = false;
let sequelize: Sequelize | null = null;

export const isMySQLConnected = (): boolean => {
  return isConnected && sequelize !== null;
};

export const waitForMySQLConnection = async (maxWaitTime = 10000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (!isMySQLConnected() && (Date.now() - startTime) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 100));
  } 
  
  return isMySQLConnected();
};

export const connectMySQL = async (): Promise<Sequelize> => {
  try {
    const dbConfig = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3307'),
      database: process.env.MYSQL_DATABASE || 'backend_node',
      username: process.env.MYSQL_USERNAME || 'root',
      password: process.env.MYSQL_PASSWORD || 'Nzallawahe7',
    };

    console.log('🔄 Attempting to connect to MySQL...');
    console.log(`📍 MySQL Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`📊 Database: ${dbConfig.database}`);

    sequelize = new Sequelize({
      dialect: 'mysql',
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      password: dbConfig.password,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
    });

    // Test the connection
    await sequelize.authenticate();
    
    console.log('✅ Connected to MySQL successfully');
    console.log(`📊 Database: ${dbConfig.database}`);
    
    // Set connection state
    isConnected = true;

    // Sync database (create tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('🔄 Database synchronized');
    }

    return sequelize;

  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error);
    console.error('💡 Make sure MySQL is running on your system.');
    console.error('💡 Install MySQL from: https://dev.mysql.com/downloads/mysql/');
    console.error('💡 Or use Docker: docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql:8.0');
    isConnected = false;
    throw error;
  }
};

export const disconnectMySQL = async (): Promise<void> => {
  try {
    if (sequelize) {
      await sequelize.close();
      sequelize = null;
    }
    isConnected = false;
    console.log('✅ Disconnected from MySQL');
  } catch (error) {
    console.error('❌ Error disconnecting from MySQL:', error);
    isConnected = false;
    throw error;
  }
};

export const getSequelize = (): Sequelize | null => {
  return sequelize;
};