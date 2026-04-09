module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_OPTIONS: {
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  }
};
