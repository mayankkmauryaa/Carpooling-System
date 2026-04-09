const BaseException = require('./BaseException');

class ValidationException extends BaseException {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, errors);
    this.name = 'ValidationException';
  }

  static fromJoi(error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return new ValidationException('Invalid input data', errors);
  }

  static fromMongoose(error) {
    const errors = Object.values(error.errors || {}).map(err => ({
      field: err.path,
      message: err.message
    }));
    return new ValidationException('Invalid input data', errors);
  }
}

module.exports = ValidationException;
