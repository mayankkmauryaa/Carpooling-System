const { connectDB, disconnectDB, databaseConnection } = require('./connection');
const { connectRedis, disconnectRedis, getRedisClient, redisConnection } = require('./redis');

module.exports = {
  connectDB,
  disconnectDB,
  databaseConnection,
  connectRedis,
  disconnectRedis,
  getRedisClient,
  redisConnection
};
