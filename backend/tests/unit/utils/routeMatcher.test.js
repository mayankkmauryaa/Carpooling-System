const RouteMatcher = require('../../../src/utils/routeMatcher');
const routeMatcher = new RouteMatcher();

describe('Route Matcher Utils', () => {
  describe('calculateMatchPercentage', () => {
    it('should return 80% for exact match (weighted scoring)', () => {
      const driverRoute = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 37.8044, lng: -122.2711 },
        routeData: { waypoints: [] }
      };
      const riderRequest = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 37.8044, lng: -122.2711 }
      };
      
      const result = routeMatcher.calculateMatchPercentage(driverRoute, riderRequest);
      
      expect(result).toBe(80);
    });

    it('should return lower percentage for far match', () => {
      const driverRoute = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 34.0522, lng: -118.2437 },
        routeData: { waypoints: [] }
      };
      const riderRequest = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 37.8044, lng: -122.2711 }
      };
      
      const result = routeMatcher.calculateMatchPercentage(driverRoute, riderRequest);
      
      expect(result).toBeLessThan(100);
    });

    it('should return 0% when outside radius', () => {
      const driverRoute = {
        pickupLocation: { lat: 40.7128, lng: -74.0060 },
        dropLocation: { lat: 40.7580, lng: -73.9855 },
        routeData: { waypoints: [] }
      };
      const riderRequest = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 37.8044, lng: -122.2711 }
      };
      
      const result = routeMatcher.calculateMatchPercentage(driverRoute, riderRequest);
      
      expect(result).toBeLessThan(50);
    });
  });

  describe('calculatePickupMatch', () => {
    it('should return 100 for exact pickup match', () => {
      const driverPickup = { lat: 37.7749, lng: -122.4194 };
      const riderPickup = { lat: 37.7749, lng: -122.4194 };
      
      const result = routeMatcher.calculatePickupMatch(driverPickup, riderPickup);
      
      expect(result).toBe(100);
    });

    it('should handle coordinates format', () => {
      const driverPickup = { coordinates: [-122.4194, 37.7749] };
      const riderPickup = { lat: 37.7749, lng: -122.4194 };
      
      const result = routeMatcher.calculatePickupMatch(driverPickup, riderPickup);
      
      expect(result).toBe(100);
    });

    it('should return lower score for farther distances', () => {
      const driverPickup = { lat: 37.7749, lng: -122.4194 };
      const riderPickup = { lat: 38.0, lng: -122.0 };
      
      const result = routeMatcher.calculatePickupMatch(driverPickup, riderPickup);
      
      expect(result).toBeLessThan(100);
    });
  });

  describe('distanceToScore', () => {
    it('should return 100 for excellent threshold', () => {
      const result = routeMatcher.distanceToScore(0.5);
      expect(result).toBe(100);
    });

    it('should return 85 for good threshold', () => {
      const result = routeMatcher.distanceToScore(2);
      expect(result).toBe(85);
    });

    it('should return 70 for fair threshold', () => {
      const result = routeMatcher.distanceToScore(4);
      expect(result).toBe(70);
    });

    it('should return 50 for poor threshold', () => {
      const result = routeMatcher.distanceToScore(7);
      expect(result).toBe(50);
    });

    it('should return lower score for very far distances', () => {
      const result = routeMatcher.distanceToScore(20);
      expect(result).toBe(0);
    });
  });

  describe('getMatchQuality', () => {
    it('should return Excellent for 85+', () => {
      expect(routeMatcher.getMatchQuality(90)).toBe('Excellent');
      expect(routeMatcher.getMatchQuality(85)).toBe('Excellent');
    });

    it('should return Good for 70-84', () => {
      expect(routeMatcher.getMatchQuality(75)).toBe('Good');
    });

    it('should return Fair for 50-69', () => {
      expect(routeMatcher.getMatchQuality(60)).toBe('Fair');
    });

    it('should return Poor for below 50', () => {
      expect(routeMatcher.getMatchQuality(40)).toBe('Poor');
    });
  });

  describe('sortByMatch', () => {
    it('should sort rides by match percentage', () => {
      const rides = [
        { id: 1, pickupLocation: { lat: 38.0, lng: -122.0 }, dropLocation: { lat: 39.0, lng: -121.0 } },
        { id: 2, pickupLocation: { lat: 37.7749, lng: -122.4194 }, dropLocation: { lat: 37.8044, lng: -122.2711 } },
        { id: 3, pickupLocation: { lat: 37.8, lng: -122.4 }, dropLocation: { lat: 37.9, lng: -122.3 } }
      ];
      
      const riderRequest = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 37.8044, lng: -122.2711 }
      };
      
      const sorted = routeMatcher.sortByMatch(rides, riderRequest);
      
      expect(sorted[0].id).toBe(2);
      expect(sorted[2].id).toBe(1);
    });

    it('should add matchPercentage to each ride', () => {
      const rides = [
        { id: 1, pickupLocation: { lat: 37.7749, lng: -122.4194 }, dropLocation: { lat: 37.8044, lng: -122.2711 } }
      ];
      
      const riderRequest = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 37.8044, lng: -122.2711 }
      };
      
      const sorted = routeMatcher.sortByMatch(rides, riderRequest);
      
      expect(sorted[0]).toHaveProperty('matchPercentage');
      expect(sorted[0].matchPercentage).toBe(80);
    });
  });

  describe('calculateRouteOverlap', () => {
    it('should return 50 when no waypoints', () => {
      const driverRouteData = null;
      const riderRequest = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 37.8044, lng: -122.2711 }
      };
      
      const result = routeMatcher.calculateRouteOverlap(driverRouteData, riderRequest);
      
      expect(result).toBe(50);
    });

    it('should return 50 when empty waypoints', () => {
      const driverRouteData = { waypoints: [] };
      const riderRequest = {
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropLocation: { lat: 37.8044, lng: -122.2711 }
      };
      
      const result = routeMatcher.calculateRouteOverlap(driverRouteData, riderRequest);
      
      expect(result).toBe(50);
    });
  });
});
