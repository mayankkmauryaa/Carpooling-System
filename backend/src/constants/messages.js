module.exports = {
  AUTH: {
    REGISTER_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logged out successfully',
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_DEACTIVATED: 'Account is deactivated',
    TOKEN_EXPIRED: 'Token expired',
    INVALID_TOKEN: 'Invalid token',
    EMAIL_EXISTS: 'Email already registered'
  },
  USER: {
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    USER_NOT_FOUND: 'User not found',
    USER_DELETED: 'User deleted successfully'
  },
  VEHICLE: {
    CREATED: 'Vehicle created successfully',
    UPDATED: 'Vehicle updated successfully',
    DELETED: 'Vehicle deleted successfully',
    NOT_FOUND: 'Vehicle not found'
  },
  RIDE: {
    CREATED: 'Ride created successfully',
    UPDATED: 'Ride updated successfully',
    CANCELLED: 'Ride cancelled successfully',
    NOT_FOUND: 'Ride not found',
    REQUEST_SENT: 'Join request sent',
    REQUEST_APPROVED: 'Request approved',
    REQUEST_REJECTED: 'Request rejected'
  },
  TRIP: {
    STARTED: 'Trip started',
    COMPLETED: 'Trip completed',
    CANCELLED: 'Trip cancelled',
    NOT_FOUND: 'Trip not found'
  },
  REVIEW: {
    CREATED: 'Review submitted',
    DELETED: 'Review deleted successfully',
    NOT_FOUND: 'Review not found'
  },
  MESSAGE: {
    SENT: 'Message sent',
    DELETED: 'Message deleted',
    CONVERSATION_DELETED: 'Conversation deleted'
  },
  PRIVACY: {
    SOS_SENT: 'SOS alert sent. Authorities have been notified.',
    SETTINGS_UPDATED: 'Privacy settings updated'
  },
  ERRORS: {
    VALIDATION_ERROR: 'Invalid input data',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource already exists',
    SERVER_ERROR: 'Something went wrong. Please try again later.'
  }
};
