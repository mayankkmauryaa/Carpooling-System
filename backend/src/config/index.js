require("dotenv").config();

const appConfig = require("./app");
const databaseConfig = require("./database");
const jwtConfig = require("./jwt");
const redisConfig = require("./redis");
const rateLimitConfig = require("./rateLimit");
const googleConfig = require("./google");

module.exports = {
  ...appConfig,
  ...databaseConfig,
  ...jwtConfig,
  ...redisConfig,
  ...rateLimitConfig,
  google: googleConfig
};
