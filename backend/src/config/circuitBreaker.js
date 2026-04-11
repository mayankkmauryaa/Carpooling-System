class CircuitBreakerConfig {
  static get defaults() {
    return {
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
      successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD) || 2,
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 30000,
      halfOpenMaxCalls: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS) || 3
    };
  }

  static get services() {
    return {
      razorpay: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 30000,
        halfOpenMaxCalls: 3
      },
      email: {
        failureThreshold: 3,
        successThreshold: 1,
        timeout: 15000,
        halfOpenMaxCalls: 2
      },
      maps: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 10000,
        halfOpenMaxCalls: 3
      },
      redis: {
        failureThreshold: 10,
        successThreshold: 3,
        timeout: 5000,
        halfOpenMaxCalls: 5
      }
    };
  }

  static getServiceConfig(serviceName) {
    const customConfig = this.getServiceOverrides(serviceName);
    return { ...this.services[serviceName], ...customConfig } || this.defaults;
  }

  static getServiceOverrides(serviceName) {
    const prefix = `CIRCUIT_BREAKER_${serviceName.toUpperCase()}_`;
    return {
      failureThreshold: process.env[`${prefix}FAILURE_THRESHOLD`] 
        ? parseInt(process.env[`${prefix}FAILURE_THRESHOLD`]) : undefined,
      successThreshold: process.env[`${prefix}SUCCESS_THRESHOLD`] 
        ? parseInt(process.env[`${prefix}SUCCESS_THRESHOLD`]) : undefined,
      timeout: process.env[`${prefix}TIMEOUT`] 
        ? parseInt(process.env[`${prefix}TIMEOUT`]) : undefined,
      halfOpenMaxCalls: process.env[`${prefix}HALF_OPEN_MAX_CALLS`] 
        ? parseInt(process.env[`${prefix}HALF_OPEN_MAX_CALLS`]) : undefined
    };
  }
}

module.exports = CircuitBreakerConfig;
