const hpp = require('hpp');

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/gi,
  /(--|;|\/\*|\*\/|@@|@)/g,
  /(\bOR\b|\bAND\b)\s*\d+\s*[=<>]/gi,
  /(\bOR\b|\bAND\b)\s*['"][^'"]*['"]\s*[=<>]/gi,
  /['"];?\s*(DROP|DELETE|INSERT|UPDATE)\s+/gi,
  /(WAITFOR|DELAY)\s+['"]?\d+/gi,
  /INTO\s+(OUTFILE|DUMPFILE)/gi,
  /LOAD_FILE\s*\(/gi,
  /BENCHMARK\s*\(/gi,
  /SLEEP\s*\(/gi,
  /'\s*(OR\s+)?'1'\s*=\s*'1/gi,
  /'\s*(OR\s+)?1\s*=\s*1/gi
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["']?[^"']*["']?/gi,
  /<iframe[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*["']?\s*javascript:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /<\/?[a-z][\s\S]*>/gi
];

const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$ne\s*\(/gi,
  /\$gt\s*\(/gi,
  /\$lt\s*\(/gi,
  /\$gte\s*\(/gi,
  /\$lte\s*\(/gi,
  /\$in\s*\(/gi,
  /\$nin\s*\(/gi,
  /\$or\s*\(/gi,
  /\$and\s*\(/gi,
  /\$not\s*\(/gi,
  /\$exists/gi,
  /\$regex\s*\(/gi,
  /\$text\s*\(/gi,
  /\$type\s*\(/gi,
  /\$mod\s*\(/gi,
  /\$expr\s*\(/gi,
  /\{\s*\$/g,
  /\[\s*\$/g
];

const DANGEROUS_KEYS = [
  '__proto__',
  'constructor',
  'prototype',
  '原型',
  'hasOwnProperty',
  'toString',
  'valueOf',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__'
];

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  
  let sanitized = value;
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
}

function sanitizeObject(obj, depth = 0) {
  if (depth > 10) return obj;
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase().replace(/[<>'"]/g, '');
    
    if (DANGEROUS_KEYS.includes(normalizedKey) || 
        DANGEROUS_KEYS.includes(key) ||
        normalizedKey.startsWith('$')) {
      continue;
    }
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

function sanitizeValue(value, depth = 0) {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value, depth + 1);
  }
  return value;
}

function sanitizeRequest(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

const httpParameterPollution = hpp({
  whitelist: []
});

module.exports = {
  sanitizeRequest,
  sanitizeString,
  sanitizeObject,
  sanitizeValue,
  httpParameterPollution,
  SQL_INJECTION_PATTERNS,
  XSS_PATTERNS,
  NOSQL_INJECTION_PATTERNS
};
