const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp,
      ...meta
    }));
  },
  
  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp,
      ...meta
    }));
  },
  
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp,
      ...meta
    }));
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(JSON.stringify({
        level: 'debug',
        message,
        timestamp,
        ...meta
      }));
    }
  }
};

module.exports = logger;
