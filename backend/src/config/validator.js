class EnvironmentValidationError extends Error {
  constructor(missingVars) {
    super(`Missing required environment variables: ${missingVars.join(', ')}`);
    this.name = 'EnvironmentValidationError';
    this.missingVars = missingVars;
  }
}

const REQUIRED_VARS = {
  common: [
    'NODE_ENV',
    'PORT',
    'API_PREFIX',
    'API_VERSION',
    'JWT_SECRET',
    'JWT_EXPIRES_IN'
  ],
  database: [
    'DATABASE_URL'
  ],
  redis: [],
  razorpay: [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ],
  googleMaps: [
    'GOOGLE_MAPS_API_KEY'
  ],
  cloudinary: [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ],
  email: [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM'
  ],
  kafka: []
};

const OPTIONAL_VARS = {
  redis: [
    'REDIS_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD'
  ],
  kafka: [
    'KAFKA_BROKERS',
    'KAFKA_CLIENT_ID',
    'KAFKA_GROUP_ID'
  ],
  oauth: [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_CLIENT_ID',
    'FACEBOOK_CLIENT_SECRET',
    'APPLE_CLIENT_ID',
    'APPLE_TEAM_ID',
    'APPLE_KEY_ID',
    'APPLE_PRIVATE_KEY_PATH'
  ]
};

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validate() {
    this.errors = [];
    this.warnings = [];

    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';

    this.validateCommon();
    this.validateDatabase();

    if (isProduction) {
      this.validateRazorpay();
      this.validateGoogleMaps();
      this.validateCloudinary();
      this.validateEmail();
    } else {
      this.warnIfMissing('razorpay', REQUIRED_VARS.razorpay);
      this.warnIfMissing('googleMaps', REQUIRED_VARS.googleMaps);
      this.warnIfMissing('cloudinary', REQUIRED_VARS.cloudinary);
      this.warnIfMissing('email', REQUIRED_VARS.email);
    }

    this.validateRedis();
    this.validateKafka();
    this.validateOAuth();

    this.validateJwtSecret();
    this.validateNodeEnv();

    if (this.errors.length > 0) {
      throw new EnvironmentValidationError(this.errors);
    }

    return {
      valid: true,
      warnings: this.warnings
    };
  }

  validateCommon() {
    for (const varName of REQUIRED_VARS.common) {
      if (!process.env[varName]) {
        this.errors.push(varName);
      }
    }
  }

  validateDatabase() {
    for (const varName of REQUIRED_VARS.database) {
      if (!process.env[varName]) {
        this.errors.push(varName);
      }
    }

    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL;
      if (!url.includes('postgresql://') && !url.includes('postgres://')) {
        this.errors.push('DATABASE_URL must be a PostgreSQL connection string');
      }
    }
  }

  validateRedis() {
    const hasRedisConfig = REQUIRED_VARS.redis.some(v => process.env[v]);
    if (!hasRedisConfig && !process.env.REDIS_URL) {
      this.warnings.push('Redis not configured. Using in-memory fallback cache.');
    }
  }

  validateKafka() {
    if (process.env.KAFKA_ENABLED === 'true') {
      if (!process.env.KAFKA_BROKERS) {
        this.errors.push('KAFKA_BROKERS is required when KAFKA_ENABLED=true');
      }
    }
  }

  validateRazorpay() {
    for (const varName of REQUIRED_VARS.razorpay) {
      if (!process.env[varName]) {
        this.errors.push(varName);
      }
    }
  }

  validateGoogleMaps() {
    for (const varName of REQUIRED_VARS.googleMaps) {
      if (!process.env[varName]) {
        this.errors.push(varName);
      }
    }
  }

  validateCloudinary() {
    for (const varName of REQUIRED_VARS.cloudinary) {
      if (!process.env[varName]) {
        this.errors.push(varName);
      }
    }
  }

  validateEmail() {
    for (const varName of REQUIRED_VARS.email) {
      if (!process.env[varName]) {
        this.errors.push(varName);
      }
    }
  }

  validateOAuth() {
    if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
      this.warnings.push('GOOGLE_CLIENT_SECRET is missing for Google OAuth');
    }
  }

  validateJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret && secret.length < 32) {
      this.warnings.push('JWT_SECRET should be at least 32 characters for security');
    }
    if (!secret) {
      this.errors.push('JWT_SECRET');
    }
  }

  validateNodeEnv() {
    const validEnvs = ['development', 'production', 'staging', 'test'];
    const env = process.env.NODE_ENV;
    if (env && !validEnvs.includes(env)) {
      this.warnings.push(`NODE_ENV '${env}' is not standard. Use: ${validEnvs.join(', ')}`);
    }
  }

  warnIfMissing(group, vars) {
    for (const varName of vars) {
      if (!process.env[varName]) {
        this.warnings.push(`${varName} (${group}) is not set - some features may not work`);
      }
    }
  }
}

function validateEnvironment() {
  const validator = new ConfigValidator();
  return validator.validate();
}

module.exports = {
  validateEnvironment,
  ConfigValidator,
  EnvironmentValidationError,
  REQUIRED_VARS,
  OPTIONAL_VARS
};
