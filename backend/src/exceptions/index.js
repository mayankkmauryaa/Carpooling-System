const BaseException = require('./BaseException');
const AuthException = require('./AuthException');
const ValidationException = require('./ValidationException');
const NotFoundException = require('./NotFoundException');
const ForbiddenException = require('./ForbiddenException');
const ConflictException = require('./ConflictException');
const BadRequestException = require('./BadRequestException');

module.exports = {
  BaseException,
  AuthException,
  ValidationException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException
};
