require("dotenv").config();

const config = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/carpooling",
  JWT_SECRET: process.env.JWT_SECRET || "default_secret_key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  BYCRYPT_ROUNDS: 12,
};

module.exports = config;
// Why this file?
// - Centralizes all settings in one place
// - If you need to change the database, change it here
// - If you need to change JWT secret, change it here
