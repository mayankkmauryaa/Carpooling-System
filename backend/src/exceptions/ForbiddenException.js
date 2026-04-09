const BaseException = require('./BaseException');

class ForbiddenException extends BaseException {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.name = 'ForbiddenException';
  }

  static notOwner() {
    return new ForbiddenException('Not authorized to modify this resource');
  }

  static requireDriver() {
    return new ForbiddenException('Only drivers can perform this action');
  }

  static requireAdmin() {
    return new ForbiddenException('Admin access required');
  }

  static requireRole(role) {
    return new ForbiddenException(`Role '${role}' is required for this action`);
  }
}

module.exports = ForbiddenException;
