const PrivacyService = require('../../../src/utils/privacy');

describe('Privacy Utils', () => {
  describe('maskPhoneNumber', () => {
    it('should mask phone number correctly', () => {
      const phone = '+1234567890';
      const result = PrivacyService.maskPhoneNumber(phone);
      
      expect(result).toMatch(/^\d{3}-\*{4}-7890$/);
      expect(result).toContain('7890');
    });

    it('should handle 10-digit US numbers', () => {
      const phone = '1234567890';
      const result = PrivacyService.maskPhoneNumber(phone);
      
      expect(result).toMatch(/^\d{3}-\*{4}-7890$/);
    });

    it('should handle numbers with spaces', () => {
      const phone = '123 456 7890';
      const result = PrivacyService.maskPhoneNumber(phone);
      
      expect(result).toContain('7890');
    });

    it('should return asterisks for invalid phone', () => {
      const phone = '123';
      const result = PrivacyService.maskPhoneNumber(phone);
      
      expect(result).toBe('***-***-****');
    });
  });

  describe('generateVirtualNumber', () => {
    it('should generate virtual number with correct format', () => {
      const result = PrivacyService.generateVirtualNumber();
      
      expect(result).toMatch(/^\+1-\d{3}-\d{3}-\d{4}$/);
    });

    it('should generate unique numbers for different calls', () => {
      const result1 = PrivacyService.generateVirtualNumber();
      const result2 = PrivacyService.generateVirtualNumber();
      
      expect(result1).not.toBe(result2);
    });
  });

  describe('canShowPhoneNumber', () => {
    it('should return true for in-progress rides', () => {
      expect(PrivacyService.canShowPhoneNumber('in-progress')).toBe(true);
    });

    it('should return true for scheduled rides', () => {
      expect(PrivacyService.canShowPhoneNumber('scheduled')).toBe(true);
    });

    it('should return false for completed rides', () => {
      expect(PrivacyService.canShowPhoneNumber('completed')).toBe(false);
    });
  });

  describe('blurProfile', () => {
    it('should blur profile when not confirmed', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'url/to/pic'
      };
      
      const result = PrivacyService.blurProfile(user, false);
      
      expect(result.lastName).toBeNull();
      expect(result.profilePicture).toBe('blurred');
    });

    it('should show full profile when confirmed', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'url/to/pic'
      };
      
      const result = PrivacyService.blurProfile(user, true);
      
      expect(result.lastName).toBe('Doe');
      expect(result.profilePicture).toBe('url/to/pic');
    });
  });

  describe('encryptData', () => {
    it('should encrypt data', () => {
      const key = 'a'.repeat(64);
      const data = 'test data';
      
      const result = PrivacyService.encryptData(data, key);
      
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('data');
      expect(result.data).not.toBe(data);
    });

    it('should return object with iv and data', () => {
      const key = 'a'.repeat(64);
      
      const result = PrivacyService.encryptData('test', key);
      
      expect(typeof result.iv).toBe('string');
      expect(typeof result.data).toBe('string');
    });
  });

  describe('decryptData', () => {
    it('should decrypt encrypted data', () => {
      const key = 'a'.repeat(64);
      const data = 'test data';
      
      const encrypted = PrivacyService.encryptData(data, key);
      const decrypted = PrivacyService.decryptData(encrypted.data, key, encrypted.iv);
      
      expect(decrypted).toBe(data);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid 10-digit phone', () => {
      expect(PrivacyService.isValidPhoneNumber('1234567890')).toBe(true);
    });

    it('should return true for valid 11-digit phone', () => {
      expect(PrivacyService.isValidPhoneNumber('11234567890')).toBe(true);
    });

    it('should return false for too short phone', () => {
      expect(PrivacyService.isValidPhoneNumber('12345')).toBe(false);
    });
  });
});
