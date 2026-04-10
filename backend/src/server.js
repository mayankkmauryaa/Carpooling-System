require('dotenv').config();
const http = require('http');
const app = require('./app');
const { config } = require('./config');
const { connectDB } = require('./database/connection');
const { connectRedis } = require('./database/redis');
const { socketManager } = require('./socket');
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

    const server = http.createServer(app);
    socketManager.initialize(server);

    server.listen(config.PORT, () => {
      logger.info(`========================================`);
      logger.info(`Server is Running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Database: PostgreSQL (Neon)`);
      logger.info(`Health Check: http://localhost:${config.PORT}/api/health`);
      logger.info(`API Version: http://localhost:${config.PORT}${config.API_PREFIX}/${config.API_VERSION}`);
      logger.info(`Socket.IO: http://localhost:${config.PORT}`);
      logger.info(`Namespaces: /rides, /users, /notifications, /chat`);
      logger.info(`========================================`);
    });

    setupGracefulShutdown(server);
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

function setupGracefulShutdown(server) {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

startServer();
