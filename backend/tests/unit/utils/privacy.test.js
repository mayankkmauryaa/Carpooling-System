const privacy = require('../../../src/utils/privacy');

describe('Privacy Utils', () => {
  describe('maskPhoneNumber', () => {
    it('should mask phone number correctly', () => {
      const phone = '+1234567890';
      
      const result = privacy.maskPhoneNumber(phone);
      
      expect(result).toMatch(/^\+\d{1,3}\*+\*+\*+\d{4}$/);
      expect(result).toContain('6789');
    });

    it('should handle 10-digit US numbers', () => {
      const phone = '1234567890';
      
      const result = privacy.maskPhoneNumber(phone);
      
      expect(result).toMatch(/^\d{3}\*+\*+\*+\d{4}$/);
      expect(result).toContain('6789');
    });

    it('should handle numbers with spaces', () => {
      const phone = '+1 234 567 890';
      
      const result = privacy.maskPhoneNumber(phone);
      
      expect(result).toContain('6789');
    });

    it('should return XXX for invalid phone', () => {
      const phone = '123';
      
      const result = privacy.maskPhoneNumber(phone);
      
      expect(result).toBe('XXX-XXX-XXXX');
    });
  });

  describe('generateVirtualPhone', () => {
    it('should generate virtual phone with correct format', () => {
      const userId = 123;
      
      const result = privacy.generateVirtualPhone(userId);
      
      expect(result).toMatch(/^\+1-8XX-XXX-\d{4}$/);
      expect(result).toContain(String(userId).padStart(4, '0').slice(-4));
    });

    it('should generate unique phones for different users', () => {
      const result1 = privacy.generateVirtualPhone(123);
      const result2 = privacy.generateVirtualPhone(456);
      
      expect(result1).not.toBe(result2);
    });
  });

  describe('hashEmail', () => {
    it('should hash email consistently', () => {
      const email = 'test@example.com';
      
      const result1 = privacy.hashEmail(email);
      const result2 = privacy.hashEmail(email);
      
      expect(result1).toBe(result2);
    });

    it('should produce different hashes for different emails', () => {
      const hash1 = privacy.hashEmail('test1@example.com');
      const hash2 = privacy.hashEmail('test2@example.com');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should return 32-char hash', () => {
      const email = 'test@example.com';
      
      const result = privacy.hashEmail(email);
      
      expect(result).toHaveLength(32);
    });
  });

  describe('obfuscateAddress', () => {
    it('should obfuscate full address', () => {
      const address = '123 Main Street, San Francisco, CA 94102';
      
      const result = privacy.obfuscateAddress(address);
      
      expect(result).not.toBe(address);
      expect(result.length).toBeLessThan(address.length);
    });

    it('should preserve city when preserveCity is true', () => {
      const address = '123 Main Street, San Francisco, CA 94102';
      
      const result = privacy.obfuscateAddress(address, { preserveCity: true });
      
      expect(result).toContain('San Francisco');
    });

    it('should show only street name when detailed is false', () => {
      const address = '123 Main Street, San Francisco, CA 94102';
      
      const result = privacy.obfuscateAddress(address, { detailed: false });
      
      expect(result).toContain('Main Street');
      expect(result).not.toContain('123');
    });
  });

  describe('encryptData', () => {
    it('should encrypt data', () => {
      const data = 'sensitive information';
      
      const result = privacy.encryptData(data);
      
      expect(result).not.toBe(data);
      expect(typeof result).toBe('string');
    });

    it('should return empty string for empty input', () => {
      const result = privacy.encryptData('');
      
      expect(result).toBe('');
    });
  });

  describe('decryptData', () => {
    it('should decrypt encrypted data', () => {
      const data = 'sensitive information';
      const encrypted = privacy.encryptData(data);
      
      const decrypted = privacy.decryptData(encrypted);
      
      expect(decrypted).toBe(data);
    });

    it('should return empty string for empty input', () => {
      const result = privacy.decryptData('');
      
      expect(result).toBe('');
    });
  });
});
