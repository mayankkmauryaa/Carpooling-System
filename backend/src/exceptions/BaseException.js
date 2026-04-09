class BaseException extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: 'error',
      message: this.message,
      ...(this.errors.length > 0 && { errors: this.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

module.exports = BaseException;
