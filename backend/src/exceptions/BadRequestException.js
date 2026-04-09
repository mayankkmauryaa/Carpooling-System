const BaseException = require('./BaseException');

class BadRequestException extends BaseException {
  constructor(message = 'Bad request', errors = []) {
    super(message, 400, errors);
    this.name = 'BadRequestException';
  }

  static invalidId() {
    return new BadRequestException('Invalid ID format');
  }

  static missingField(field) {
    return new BadRequestException(`${field} is required`);
  }

  static invalidField(field, reason = '') {
    return new BadRequestException(
      reason ? `${field}: ${reason}` : `Invalid ${field}`
    );
  }

  static rideNotActive() {
    return new BadRequestException('Ride is not available');
  }

  static tripNotInProgress() {
    return new BadRequestException('Trip is not in progress');
  }

  static noSeatsAvailable() {
    return new BadRequestException('No available seats');
  }

  static incorrectPassword() {
    return new BadRequestException('Current password is incorrect');
  }
}

module.exports = BadRequestException;
