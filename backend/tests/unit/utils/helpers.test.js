const helpers = require('../../../src/utils/helpers');

describe('Helpers Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const coord1 = [-122.4194, 37.7749];
      const coord2 = [-122.2711, 37.8044];
      
      const result = helpers.calculateDistance(coord1, coord2);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(50);
    });

    it('should return 0 for same coordinates', () => {
      const coord = [-122.4194, 37.7749];
      
      const result = helpers.calculateDistance(coord, coord);
      
      expect(result).toBe(0);
    });
  });

  describe('calculateRouteMatchPercentage', () => {
    it('should calculate route match percentage', () => {
      const driverPickup = [-122.4194, 37.7749];
      const driverDrop = [-122.2711, 37.8044];
      const riderPickup = [-122.42, 37.775];
      const riderDrop = [-122.27, 37.80];
      
      const result = helpers.calculateRouteMatchPercentage(
        driverPickup, driverDrop, riderPickup, riderDrop
      );
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should return lower score for far apart locations', () => {
      const driverPickup = [-122.4194, 37.7749];
      const driverDrop = [-118.2437, 34.0522];
      const riderPickup = [-122.42, 37.775];
      const riderDrop = [-122.27, 37.80];
      
      const result = helpers.calculateRouteMatchPercentage(
        driverPickup, driverDrop, riderPickup, riderDrop
      );
      
      expect(result).toBeLessThan(100);
    });
  });

  describe('filterByPreferences', () => {
    it('should return true when no preferences', () => {
      expect(helpers.filterByPreferences(null, {})).toBe(true);
    });

    it('should filter female only rides', () => {
      const ridePreferences = { femaleOnly: true };
      const riderPreferences = { gender: 'female' };
      
      expect(helpers.filterByPreferences(ridePreferences, riderPreferences)).toBe(true);
    });

    it('should reject non-female riders for female only rides', () => {
      const ridePreferences = { femaleOnly: true };
      const riderPreferences = { gender: 'male' };
      
      expect(helpers.filterByPreferences(ridePreferences, riderPreferences)).toBe(false);
    });
  });

  describe('paginate', () => {
    it('should skip and limit query', () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      };
      
      helpers.paginate(mockQuery, 2, 10);
      
      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should use default values', () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      };
      
      helpers.paginate(mockQuery);
      
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('generateMaskedPhone', () => {
    it('should generate masked phone number', () => {
      const phone = '1234567890';
      
      const result = helpers.generateMaskedPhone(phone);
      
      expect(result).toMatch(/^\+\d{2}-555-\d{4}$/);
      expect(result).toContain('7890');
    });

    it('should return XXX for short phone', () => {
      const phone = '123';
      
      const result = helpers.generateMaskedPhone(phone);
      
      expect(result).toBe('XXX-XXX-XXXX');
    });
  });
});
