class CircuitBreakerState {
  static CLOSED = 'CLOSED';
  static OPEN = 'OPEN';
  static HALF_OPEN = 'HALF_OPEN';
}

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 30000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    
    this.state = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
    
    this.onStateChange = options.onStateChange || (() => {});
    this.onFailure = options.onFailure || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    this.onReject = options.onReject || (() => {});
  }

  getState() {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      }
    }
    return this.state;
  }

  transitionTo(newState) {
    const previousState = this.state;
    this.state = newState;
    
    if (newState === CircuitBreakerState.HALF_OPEN) {
      this.halfOpenCalls = 0;
      this.successes = 0;
    }
    
    if (newState === CircuitBreakerState.CLOSED) {
      this.failures = 0;
      this.successes = 0;
    }
    
    this.onStateChange(this.name, previousState, newState);
  }

  recordSuccess() {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successes++;
      this.halfOpenCalls++;
      
      if (this.successes >= this.successThreshold) {
        this.transitionTo(CircuitBreakerState.CLOSED);
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      this.failures = Math.max(0, this.failures - 1);
    }
    
    this.onSuccess(this.name);
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionTo(CircuitBreakerState.OPEN);
    } else if (this.state === CircuitBreakerState.CLOSED) {
      this.onFailure(this.name, this.failures);
      
      if (this.failures >= this.failureThreshold) {
        this.transitionTo(CircuitBreakerState.OPEN);
      }
    }
  }

  async execute(fn) {
    const state = this.getState();
    
    if (state === CircuitBreakerState.OPEN) {
      this.onReject(this.name, 'Circuit breaker is OPEN');
      throw new Error(`Circuit breaker [${this.name}] is OPEN`);
    }
    
    if (state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
        this.onReject(this.name, 'Circuit breaker half-open limit reached');
        throw new Error(`Circuit breaker [${this.name}] half-open limit reached`);
      }
      this.halfOpenCalls++;
    }
    
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  isAvailable() {
    const state = this.getState();
    if (state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        return true;
      }
      return false;
    }
    return true;
  }

  reset() {
    this.transitionTo(CircuitBreakerState.CLOSED);
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      halfOpenCalls: this.halfOpenCalls,
      isAvailable: this.isAvailable()
    };
  }
}

class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }

  register(name, options = {}) {
    if (this.breakers.has(name)) {
      return this.breakers.get(name);
    }
    
    const breaker = new CircuitBreaker(name, options);
    this.breakers.set(name, breaker);
    
    breaker.onStateChange = (name, from, to) => {
      logger.info(`Circuit breaker state change: ${name}`, { from, to });
    };
    
    breaker.onFailure = (name, failures) => {
      logger.warn(`Circuit breaker failures: ${name}`, { failures });
    };
    
    breaker.onReject = (name, reason) => {
      logger.warn(`Circuit breaker rejected: ${name}`, { reason });
    };
    
    return breaker;
  }

  get(name) {
    return this.breakers.get(name);
  }

  getAll() {
    return Array.from(this.breakers.values()).map(b => b.getStats());
  }

  getStats() {
    const stats = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  unregister(name) {
    this.breakers.delete(name);
  }
}

let logger;

try {
  logger = require('../middleware/logger');
} catch {
  logger = {
    info: console.log,
    warn: console.warn,
    error: console.error
  };
}

const circuitBreakerRegistry = new CircuitBreakerRegistry();

function withCircuitBreaker(name, options = {}) {
  return async function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      let breaker = circuitBreakerRegistry.get(name);
      
      if (!breaker) {
        breaker = circuitBreakerRegistry.register(name, options);
      }
      
      return breaker.execute(() => originalMethod.apply(this, args));
    };
    
    return descriptor;
  };
}

module.exports = {
  CircuitBreaker,
  CircuitBreakerState,
  CircuitBreakerRegistry,
  circuitBreakerRegistry,
  withCircuitBreaker
};
