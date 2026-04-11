const { 
  sanitizeObject, 
  sanitizeString, 
  sanitizeHtml,
  filterDangerousKeys 
} = require('../../../src/middleware/security/sanitizer');

describe('InputSanitizer', () => {
  describe('filterDangerousKeys', () => {
    it('should filter __proto__', () => {
      const input = { '__proto__': { admin: true }, name: 'test' };
      const result = filterDangerousKeys(input);
      expect(result.__proto__).toBeUndefined();
      expect(result.name).toBe('test');
    });

    it('should filter constructor', () => {
      const input = { 'constructor': { prototype: {} }, name: 'test' };
      const result = filterDangerousKeys(input);
      expect(result.constructor).toBeUndefined();
      expect(result.name).toBe('test');
    });

    it('should filter prototype', () => {
      const input = { 'prototype': {}, name: 'test' };
      const result = filterDangerousKeys(input);
      expect(result.prototype).toBeUndefined();
      expect(result.name).toBe('test');
    });

    it('should handle nested dangerous keys', () => {
      const input = {
        user: {
          '__proto__': { admin: true },
          name: 'test'
        }
      };
      const result = filterDangerousKeys(input);
      expect(result.user.__proto__).toBeUndefined();
      expect(result.user.name).toBe('test');
    });

    it('should handle arrays', () => {
      const input = [
        { '__proto__': {}, name: 'test1' },
        { name: 'test2' }
      ];
      const result = filterDangerousKeys(input);
      expect(result[0].__proto__).toBeUndefined();
      expect(result[0].name).toBe('test1');
      expect(result[1].name).toBe('test2');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize a simple object', () => {
      const input = {
        name: 'John',
        age: 30,
        '__proto__': {}
      };
      const result = sanitizeObject(input);
      expect(result.__proto__).toBeUndefined();
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'John',
          '__proto__': {}
        }
      };
      const result = sanitizeObject(input);
      expect(result.user.__proto__).toBeUndefined();
      expect(result.user.name).toBe('John');
    });

    it('should limit depth', () => {
      let input = { level: 1 };
      let current = input;
      for (let i = 2; i <= 15; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      const result = sanitizeObject(input, 0, 10);
      expect(result).toBeDefined();
    });

    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
    });
  });

  describe('sanitizeString', () => {
    it('should return non-string values unchanged', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should remove dangerous SQL patterns', () => {
      const result = sanitizeString("Robert'); DROP TABLE Users;--");
      expect(result).not.toContain("';");
      expect(result).not.toContain('DROP TABLE');
    });

    it('should remove XSS patterns', () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should preserve normal text', () => {
      const result = sanitizeString('Hello, World! This is a test.');
      expect(result).toBe('Hello, World! This is a test.');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow basic HTML tags', () => {
      const result = sanitizeHtml('<p>Hello</p> <strong>World</strong>');
      expect(result).toContain('<p>Hello</p>');
      expect(result).toContain('<strong>World</strong>');
    });

    it('should remove script tags', () => {
      const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });

    it('should remove event handlers', () => {
      const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain('onerror');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const result = sanitizeObject({});
      expect(result).toEqual({});
    });

    it('should handle arrays with mixed types', () => {
      const input = [
        '__proto__',
        { name: 'test' },
        123,
        null
      ];
      const result = filterDangerousKeys(input);
      expect(result[0]).toBe('__proto__');
      expect(result[1].name).toBe('test');
      expect(result[2]).toBe(123);
    });

    it('should handle deeply nested structures within limits', () => {
      const input = { level: 1 };
      let current = input;
      for (let i = 2; i <= 5; i++) {
        current.data = { level: i };
        current = current.data;
      }
      
      const result = sanitizeObject(input, 0, 10);
      expect(result.level).toBe(1);
      expect(result.data.level).toBe(2);
    });
  });
});
