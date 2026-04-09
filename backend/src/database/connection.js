const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../middleware/logger');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      logger.info('Using existing database connection');
      return this.connection;
    }

    try {
      const options = {
        ...config.MONGODB_OPTIONS
      };

      this.connection = await mongoose.connect(config.MONGODB_URI, options);
      this.isConnected = true;

      logger.info(`MongoDB Connected: ${this.connection.connection.host}`);
      
      this.setupEventListeners();
      
      return this.connection;
    } catch (error) {
      logger.error(`MongoDB connection error: ${error.message}`);
      throw error;
    }
  }

  setupEventListeners() {
    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('error', (error) => {
      logger.error(`MongoDB error: ${error.message}`);
    });
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      this.connection = null;
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error(`Error disconnecting from MongoDB: ${error.message}`);
      throw error;
    }
  }

  async dropDatabase() {
    if (config.NODE_ENV === 'test') {
      await mongoose.connection.dropDatabase();
      logger.info('Database dropped');
    }
  }
}

const databaseConnection = new DatabaseConnection();

const connectDB = async () => {
  return await databaseConnection.connect();
};

const disconnectDB = async () => {
  return await databaseConnection.disconnect();
};

module.exports = {
  connectDB,
  disconnectDB,
  databaseConnection,
  mongoose
};
