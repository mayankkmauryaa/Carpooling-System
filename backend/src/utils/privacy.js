class PrivacyService {
  static maskPhoneNumber(realPhone) {
    const digits = realPhone.replace(/\D/g, '');
    
    if (digits.length < 7) return '***-***-****';
    
    const firstThree = digits.slice(0, 3);
    const lastFour = digits.slice(-4);
    const middle = '*'.repeat(4);
    
    return `${firstThree}-${middle}-${lastFour}`;
  }
  
  static generateVirtualNumber() {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    
    return `+1-${areaCode}-${prefix}-${lineNumber}`;
  }
  
  static canShowPhoneNumber(rideStatus) {
    return ['in-progress', 'scheduled'].includes(rideStatus);
  }
  
  static generateTemporaryCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  static blurProfile(user, isRideConfirmed = false) {
    if (!isRideConfirmed) {
      return {
        firstName: user.firstName,
        lastName: null,
        profilePicture: user.profilePicture ? 'blurred' : null,
        fullName: user.firstName
      };
    }
    
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      fullName: `${user.firstName} ${user.lastName}`
    };
  }
  
  static getDisplayName(user, isRideConfirmed = false) {
    if (!isRideConfirmed) {
      return user.firstName;
    }
    return `${user.firstName} ${user.lastName.charAt()}.`;
  }
  
  static sanitizeUserData(user) {
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.isProfileBlurred ? null : user.lastName,
      rating: user.rating,
      totalReviews: user.totalReviews,
      profilePicture: user.isProfileBlurred ? null : user.profilePicture
    };
  }
  
  static encryptData(data, key) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      data: encrypted
    };
  }
  
  static decryptData(encryptedData, key, iv) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(
      algorithm, 
      Buffer.from(key, 'hex'), 
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  static generateSessionToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
  
  static isValidPhoneNumber(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }
  
  static formatPhoneNumber(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }
}

module.exports = PrivacyService;
