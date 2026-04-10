const ETACalculator = require('../../../src/utils/eta');

describe('ETA Utils', () => {
  describe('calculate (static method)', () => {
    it('should calculate ETA in minutes', () => {
      const distanceKm = 20;
      const trafficCondition = 'moderate';
      
      const result = ETACalculator.calculate(distanceKm, trafficCondition);
      
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 for zero distance', () => {
      const result = ETACalculator.calculate(0);
      
      expect(result).toBe(0);
    });

    it('should use traffic condition for speed', () => {
      const lightResult = ETACalculator.calculate(50, 'light');
      const heavyResult = ETACalculator.calculate(50, 'heavy');
      
      expect(lightResult).toBeLessThan(heavyResult);
    });
  });

  describe('withStops', () => {
    it('should add stop time to base ETA', () => {
      const distanceKm = 30;
      const stops = 2;
      
      const result = ETACalculator.withStops(distanceKm, stops);
      
      expect(result).toBeGreaterThan(30);
    });

    it('should return base ETA when no stops', () => {
      const distanceKm = 30;
      
      const result = ETACalculator.withStops(distanceKm, 0);
      
      expect(result).toBeGreaterThan(30);
    });
  });

  describe('format', () => {
    it('should format minutes as minutes', () => {
      const result = ETACalculator.format(30);
      
      expect(result).toContain('30 min');
    });

    it('should format hours and minutes', () => {
      const result = ETACalculator.format(90);
      
      expect(result).toContain('1 hr');
      expect(result).toContain('30 min');
    });

    it('should format exact hours', () => {
      const result = ETACalculator.format(120);
      
      expect(result).toContain('2 hr');
      expect(result).not.toContain('min');
    });

    it('should handle 0 minutes', () => {
      const result = ETACalculator.format(0);
      
      expect(result).toBe('0 min');
    });
  });
});
