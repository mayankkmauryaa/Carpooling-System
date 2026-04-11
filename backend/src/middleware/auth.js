const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config');
const { userRepository } = require('../repositories');
const { getRedisClient } = require('../database/redis');
const logger = require('./logger');

const tokenBlacklist = new Set();
const BLACKLIST_PREFIX = 'token:blacklist:';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }
    
    const decoded = jwt.verify(token, jwtConfig.JWT_SECRET || jwtConfig.secret);
    
    const user = await userRepository.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'User account is suspended',
        reason: user.suspendedReason
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    logger.error('Authentication error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

const blacklistToken = async (token) => {
  tokenBlacklist.add(token);
  
  let ttl = 24 * 60 * 60 * 1000;
  
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      ttl = (decoded.exp * 1000) - Date.now();
      if (ttl <= 0) {
        return;
      }
    }
  } catch (error) {
    logger.warn('Failed to decode token for blacklist TTL', { error: error.message });
  }

  ttl = Math.min(ttl, 7 * 24 * 60 * 60 * 1000);

  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.setex(`${BLACKLIST_PREFIX}${token}`, Math.ceil(ttl / 1000), 'blacklisted');
      logger.info('Token blacklisted in Redis', { ttlSeconds: Math.ceil(ttl / 1000) });
    }
  } catch (error) {
    logger.error('Failed to blacklist token in Redis, using in-memory only', { error: error.message });
  }

  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, ttl);
};

const isTokenBlacklisted = async (token) => {
  if (tokenBlacklist.has(token)) {
    return true;
  }

  try {
    const redis = getRedisClient();
    if (redis) {
      const result = await redis.get(`${BLACKLIST_PREFIX}${token}`);
      if (result === 'blacklisted') {
        tokenBlacklist.add(token);
        return true;
      }
    }
  } catch (error) {
    logger.warn('Failed to check token blacklist in Redis', { error: error.message });
  }

  return false;
};

const clearBlacklist = () => {
  tokenBlacklist.clear();
};

const getBlacklistSize = () => tokenBlacklist.size;

module.exports = { 
  auth, 
  requireRole,
  blacklistToken,
  isTokenBlacklisted,
  clearBlacklist,
  getBlacklistSize
};
