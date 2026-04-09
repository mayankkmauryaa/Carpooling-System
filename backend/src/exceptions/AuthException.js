const BaseException = require('./BaseException');

class AuthException extends BaseException {
  constructor(message = 'Authentication failed', statusCode = 401) {
    super(message, statusCode);
    this.name = 'AuthException';
  }

  static invalidCredentials() {
    return new AuthException('Invalid email or password', 401);
  }

  static tokenExpired() {
    return new AuthException('Token expired', 401);
  }

  static invalidToken() {
    return new AuthException('Invalid token', 401);
  }

  static unauthorized() {
    return new AuthException('Authentication required', 401);
  }

  static accountDeactivated() {
    return new AuthException('Account is deactivated', 401);
  }

  static emailExists() {
    return new AuthException('Email already registered', 409);
  }
}

module.exports = AuthException;
