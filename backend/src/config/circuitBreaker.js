class CircuitBreakerConfig {
  static get defaults() {
    return {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      halfOpenMaxCalls: 3
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
    return this.services[serviceName] || this.defaults;
  }
}

module.exports = CircuitBreakerConfig;
