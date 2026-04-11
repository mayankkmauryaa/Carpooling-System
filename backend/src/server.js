require('dotenv').config();
const http = require('http');
const app = require('./app');
const { config } = require('./config');
const { validateEnvironment } = require('./config/validator');
const { connectDB, prisma } = require('./database/connection');
const { connectRedis } = require('./database/redis');
const { socketManager } = require('./socket');
const eventBus = require('./events/eventBus');
const { initializeConsumers } = require('./events/consumers');
const logger = require('./middleware/logger');

let server;
let isShuttingDown = false;

const startServer = async () => {
  try {
    logger.info('Validating environment configuration...');
    const validation = validateEnvironment();
    
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        logger.warn(`Environment: ${warning}`);
      });
    }
    logger.info('Environment validation passed');

    logger.info('Connecting to database...');
    await connectDB();
    logger.info('Database connected successfully');

    logger.info('Connecting to Redis...');
    try {
      await connectRedis();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis connection failed, continuing with in-memory fallback:', error.message);
    }

    logger.info('Initializing event bus...');
    await eventBus.initialize();
    logger.info(`Event bus initialized (${eventBus.isConnected ? 'Kafka' : 'In-Memory'})`);

    logger.info('Loading event consumers...');
    initializeConsumers();
    logger.info('All event consumers loaded');

    logger.info('Loading sagas...');
    require('./saga/cancellationSaga');
    require('./saga/bookingSaga');
    require('./saga/payoutSaga');
    logger.info('All sagas loaded');

    server = http.createServer(app);
    app.setSocketServer(server);
    
    logger.info('Initializing Socket.IO...');
    socketManager.initialize(server);
    logger.info('Socket.IO initialized');

    server.listen(config.PORT, () => {
      logger.info(`========================================`);
      logger.info(`Carpooling System API Started`);
      logger.info(`========================================`);
      logger.info(`Port: ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Database: PostgreSQL (Neon)`);
      logger.info(`Redis: ${process.env.REDIS_URL || 'Not configured'}`);
      logger.info(`Event Bus: ${eventBus.isConnected ? 'Kafka' : 'In-Memory'}`);
      logger.info(`========================================`);
      logger.info(`Health Endpoints:`);
      logger.info(`  Liveness:  GET /health/live`);
      logger.info(`  Readiness: GET /health/ready`);
      logger.info(`  Full:      GET /health`);
      logger.info(`  Legacy:    GET /api/health`);
      logger.info(`========================================`);
      logger.info(`API: http://localhost:${config.PORT}${config.API_PREFIX}/${config.API_VERSION}`);
      logger.info(`Socket.IO: ws://localhost:${config.PORT}`);
      logger.info(`========================================`);
    });

    setupGracefulShutdown(server);
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
};

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  logger.info(`========================================`);
  logger.info(`${signal} received. Starting graceful shutdown...`);
  logger.info(`========================================`);

  const SHUTDOWN_TIMEOUT = 30000;
  const shutdownTimer = setTimeout(() => {
    logger.error('Shutdown timeout exceeded, forcing exit...');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    logger.info('Step 1/5: Closing HTTP server...');
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed');
    }

    logger.info('Step 2/5: Disconnecting Socket.IO...');
    if (socketManager && socketManager.disconnect) {
      socketManager.disconnect();
      logger.info('Socket.IO disconnected');
    }

    logger.info('Step 3/5: Closing Event Bus...');
    await eventBus.disconnect();
    logger.info('Event bus disconnected');

    logger.info('Step 4/5: Closing Redis connection...');
    try {
      const { disconnectRedis } = require('./database/redis');
      await disconnectRedis();
      logger.info('Redis disconnected');
    } catch (error) {
      logger.warn('Redis disconnect error:', error.message);
    }

    logger.info('Step 5/5: Closing Database connection...');
    await prisma.$disconnect();
    logger.info('Database disconnected');

    clearTimeout(shutdownTimer);
    logger.info(`========================================`);
    logger.info('Graceful shutdown completed');
    logger.info(`========================================`);
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimer);
    logger.error('Error during shutdown:', error.message);
    process.exit(1);
  }
}

function setupGracefulShutdown(serverInstance) {
  server = serverInstance;

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (config.NODE_ENV === 'production') {
      gracefulShutdown('UNHANDLED_REJECTION');
    }
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received');
    gracefulShutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received');
    gracefulShutdown('SIGINT');
  });

  process.on('exit', (code) => {
    logger.info(`Process exiting with code: ${code}`);
  });

  process.on('warning', (warning) => {
    logger.warn('Process warning:', warning.name, warning.message);
  });
}

startServer();
