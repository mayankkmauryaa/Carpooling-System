module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  APP_NAME: process.env.APP_NAME || 'Carpooling System',
  APP_URL: process.env.APP_URL || 'http://localhost',
  API_PREFIX: process.env.API_PREFIX || '/api',
  API_VERSION: process.env.API_VERSION || 'v1'
};
