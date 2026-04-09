module.exports = {
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: parseInt(process.env.REDIS_DB) || 0,
  REDIS_URL: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 300,
  CACHE_USER_TTL: parseInt(process.env.CACHE_USER_TTL) || 600,
  CACHE_RIDE_TTL: parseInt(process.env.CACHE_RIDE_TTL) || 300,
  CACHE_SEARCH_TTL: parseInt(process.env.CACHE_SEARCH_TTL) || 60
};
