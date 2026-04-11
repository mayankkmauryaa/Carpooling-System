const { PrismaClient } = require('@prisma/client');
const logger = require('../middleware/logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (typeof prisma.$connect === 'function') {
  prisma.$connect();
}

prisma.$on('error', (e) => {
  logger.error(`Prisma Error: ${e.message}`);
});

prisma.$on('warn', (e) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL (Neon) successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to connect to PostgreSQL: ${error.message}`);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from PostgreSQL');
  } catch (error) {
    logger.error(`Error disconnecting from PostgreSQL: ${error.message}`);
    throw error;
  }
};

const shutdownDB = async () => {
  try {
    await disconnectDB();
    logger.info('Database shutdown complete');
  } catch (error) {
    logger.error(`Error during database shutdown: ${error.message}`);
    throw error;
  }
};

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
  shutdownDB
};
