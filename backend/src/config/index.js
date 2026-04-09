require("dotenv").config();

const config = require("./config");
const databaseConfig = require("./database");
const jwtConfig = require("./jwt");
const redisConfig = require("./redis");
const rateLimitConfig = require("./rateLimit");
const appConfig = require("./app");
const googleConfig = require("./google");

module.exports = {
  config,
  database: databaseConfig,
  jwt: jwtConfig,
  redis: redisConfig,
  rateLimit: rateLimitConfig,
  app: appConfig,
  google: googleConfig
};
