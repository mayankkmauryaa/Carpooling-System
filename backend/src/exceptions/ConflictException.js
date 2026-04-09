const BaseException = require('./BaseException');

class ConflictException extends BaseException {
  constructor(message = 'Resource already exists', field = '') {
    super(message, 409);
    this.name = 'ConflictException';
    this.field = field;
  }

  static duplicateKey(field) {
    return new ConflictException(`${field} already exists`, field);
  }

  static alreadyExists(resource) {
    return new ConflictException(`${resource} already exists`);
  }

  static alreadyHasRequest() {
    return new ConflictException('You already have a request for this ride');
  }

  static alreadyReviewed() {
    return new ConflictException('You have already reviewed this trip');
  }
}

module.exports = ConflictException;
