const DistanceCalculator = require('../../../src/utils/distance');

describe('Distance Utils', () => {
  describe('haversine (static)', () => {
    it('should calculate distance between two points correctly', () => {
      const lat1 = 37.7749, lng1 = -122.4194;
      const lat2 = 34.0522, lng2 = -118.2437;
      
      const result = DistanceCalculator.haversine(lat1, lng1, lat2, lng2);
      
      expect(result).toBeGreaterThan(500);
      expect(result).toBeLessThan(600);
    });

    it('should return 0 for same point', () => {
      const lat = 37.7749, lng = -122.4194;
      
      const result = DistanceCalculator.haversine(lat, lng, lat, lng);
      
      expect(result).toBe(0);
    });

    it('should handle coordinates across hemispheres', () => {
      const nyc = { lat: 40.7128, lng: -74.0060 };
      const london = { lat: 51.5074, lng: -0.1278 };
      
      const result = DistanceCalculator.haversine(nyc.lat, nyc.lng, london.lat, london.lng);
      
      expect(result).toBeGreaterThan(5000);
      expect(result).toBeLessThan(6000);
    });
  });

  describe('haversineMeters (static)', () => {
    it('should calculate distance in meters', () => {
      const lat1 = 37.7749, lng1 = -122.4194;
      const lat2 = 37.7849, lng2 = -122.4094;
      
      const result = DistanceCalculator.haversineMeters(lat1, lng1, lat2, lng2);
      
      expect(result).toBeGreaterThan(1000);
    });
  });

  describe('isWithinRadius (static)', () => {
    it('should return true when point is within radius', () => {
      const lat1 = 37.7749, lng1 = -122.4194;
      const lat2 = 37.7849, lng2 = -122.4094;
      
      const result = DistanceCalculator.isWithinRadius(lat1, lng1, lat2, lng2, 5);
      
      expect(result).toBe(true);
    });

    it('should return false when point is outside radius', () => {
      const lat1 = 37.7749, lng1 = -122.4194;
      const lat2 = 38.7749, lng2 = -121.4194;
      
      const result = DistanceCalculator.isWithinRadius(lat1, lng1, lat2, lng2, 5);
      
      expect(result).toBe(false);
    });
  });

  describe('toRadians (static)', () => {
    it('should convert degrees to radians', () => {
      const result = DistanceCalculator.toRadians(180);
      
      expect(result).toBeCloseTo(Math.PI, 5);
    });
  });
});
