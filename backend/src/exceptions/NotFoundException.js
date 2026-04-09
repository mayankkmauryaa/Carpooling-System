const BaseException = require('./BaseException');

class NotFoundException extends BaseException {
  constructor(resource = 'Resource', identifier = '') {
    const message = identifier 
      ? `${resource} not found with identifier: ${identifier}`
      : `${resource} not found`;
    super(message, 404);
    this.name = 'NotFoundException';
    this.resource = resource;
    this.identifier = identifier;
  }

  static user(identifier = '') {
    return new NotFoundException('User', identifier);
  }

  static vehicle(identifier = '') {
    return new NotFoundException('Vehicle', identifier);
  }

  static ride(identifier = '') {
    return new NotFoundException('Ride', identifier);
  }

  static trip(identifier = '') {
    return new NotFoundException('Trip', identifier);
  }

  static review(identifier = '') {
    return new NotFoundException('Review', identifier);
  }

  static message(identifier = '') {
    return new NotFoundException('Message', identifier);
  }

  static request(identifier = '') {
    return new NotFoundException('Request', identifier);
  }

  static sosAlert(identifier = '') {
    return new NotFoundException('SOS Alert', identifier);
  }
}

module.exports = NotFoundException;
