module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/carpooling",
  MONGODB_OPTIONS: {
    maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL) || 1,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_TIMEOUT) || 5000,
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000
  }
};
