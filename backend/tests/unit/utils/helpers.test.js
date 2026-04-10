const helpers = require('../../../src/utils/helpers');

describe('Helpers Utils', () => {
  describe('generateOTP', () => {
    it('should generate 6-digit OTP by default', () => {
      const result = helpers.generateOTP();
      
      expect(result).toHaveLength(6);
      expect(result).toMatch(/^\d{6}$/);
    });

    it('should generate OTP with custom length', () => {
      const result = helpers.generateOTP(4);
      
      expect(result).toHaveLength(4);
      expect(result).toMatch(/^\d{4}$/);
    });

    it('should generate different OTPs on consecutive calls', () => {
      const result1 = helpers.generateOTP();
      
      setTimeout(() => {
        const result2 = helpers.generateOTP();
        expect(result1).not.toBe(result2);
      }, 10);
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique ID with prefix', () => {
      const result = helpers.generateUniqueId('USER');
      
      expect(result).toMatch(/^USER_\d+$/);
    });

    it('should generate unique IDs', () => {
      const result1 = helpers.generateUniqueId('TEST');
      const result2 = helpers.generateUniqueId('TEST');
      
      expect(result1).not.toBe(result2);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(helpers.validateEmail('test@example.com')).toBe(true);
      expect(helpers.validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(helpers.validateEmail('invalid')).toBe(false);
      expect(helpers.validateEmail('test@')).toBe(false);
      expect(helpers.validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid phone', () => {
      expect(helpers.validatePhone('+1234567890')).toBe(true);
      expect(helpers.validatePhone('1234567890')).toBe(true);
      expect(helpers.validatePhone('+1 234 567 8901')).toBe(true);
    });

    it('should return false for invalid phone', () => {
      expect(helpers.validatePhone('123')).toBe(false);
      expect(helpers.validatePhone('abcdefghij')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      const result = helpers.sanitizeString('  test  ');
      
      expect(result).toBe('test');
    });

    it('should remove special characters', () => {
      const result = helpers.sanitizeString('test<script>alert("xss")</script>');
      
      expect(result).not.toContain('<script>');
    });

    it('should handle empty string', () => {
      const result = helpers.sanitizeString('');
      
      expect(result).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      const result = helpers.formatCurrency(10.50);
      
      expect(result).toMatch(/\$10\.50/);
    });

    it('should format with custom currency', () => {
      const result = helpers.formatCurrency(10.50, 'EUR');
      
      expect(result).toMatch(/10\.50/);
    });

    it('should handle 0', () => {
      const result = helpers.formatCurrency(0);
      
      expect(result).toMatch(/\$0\.00/);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated';
      const result = helpers.truncateText(text, 20);
      
      expect(result.length).toBeLessThanOrEqual(23);
      expect(result).toContain('...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = helpers.truncateText(text, 20);
      
      expect(result).toBe('Short text');
    });

    it('should handle empty text', () => {
      const result = helpers.truncateText('', 20);
      
      expect(result).toBe('');
    });
  });

  describe('isValidCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(helpers.isValidCoordinates(37.7749, -122.4194)).toBe(true);
      expect(helpers.isValidCoordinates(0, 0)).toBe(true);
    });

    it('should return false for invalid latitude', () => {
      expect(helpers.isValidCoordinates(91, -122.4194)).toBe(false);
      expect(helpers.isValidCoordinates(-91, -122.4194)).toBe(false);
    });

    it('should return false for invalid longitude', () => {
      expect(helpers.isValidCoordinates(37.7749, 181)).toBe(false);
      expect(helpers.isValidCoordinates(37.7749, -181)).toBe(false);
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      
      const result = helpers.calculateAge(birthDate);
      
      expect(result).toBe(25);
    });

    it('should return 0 for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const result = helpers.calculateAge(futureDate);
      
      expect(result).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('should format date', () => {
      const date = new Date('2026-04-10');
      
      const result = helpers.formatDate(date);
      
      expect(result).toMatch(/Apr/);
      expect(result).toMatch(/10/);
      expect(result).toMatch(/2026/);
    });

    it('should handle custom format', () => {
      const date = new Date('2026-04-10');
      
      const result = helpers.formatDate(date, 'YYYY-MM-DD');
      
      expect(result).toBe('2026-04-10');
    });
  });
});
