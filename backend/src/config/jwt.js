module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "default_secret_key_change_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_ALGORITHM: "HS256",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12
};
