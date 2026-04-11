const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

const secret = process.env.JWT_SECRET || "dev_only_secret_do_not_use_in_production";

if (secret.length < 32) {
  console.warn('Warning: JWT_SECRET should be at least 32 characters for security');
}

module.exports = {
  jwt: {
    JWT_SECRET: secret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    JWT_ALGORITHM: "HS256",
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12
  }
};
