const appConfig = require("./app");
const databaseConfig = require("./database");
const jwtConfig = require("./jwt");
const redisConfig = require("./redis");
const rateLimitConfig = require("./rateLimit");

const config = {
  ...appConfig,
  ...databaseConfig,
  ...jwtConfig,
  ...redisConfig,
  ...rateLimitConfig
};

module.exports = config;
