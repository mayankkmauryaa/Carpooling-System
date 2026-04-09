require('dotenv').config();
const app = require('./app');
const { config } = require('./config');
const { connectDB } = require('./database/connection');
const { connectRedis } = require('./database/redis');
const logger = require('./middleware/logger');

const startServer = async () => {
  try {
    await connectDB();
    logger.info('Database connected successfully');

    try {
      await connectRedis();
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', error.message);
    }

    app.listen(config.PORT, () => {
      logger.info(`========================================`);
      logger.info(`Server is Running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Database: PostgreSQL (Neon)`);
      logger.info(`Health Check: http://localhost:${config.PORT}/api/health`);
      logger.info(`API Version: http://localhost:${config.PORT}${config.API_PREFIX}/${config.API_VERSION}`);
      logger.info(`========================================`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
