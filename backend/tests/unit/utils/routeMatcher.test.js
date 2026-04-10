const routeMatcher = require('../../../src/utils/routeMatcher');

describe('Route Matcher Utils', () => {
  describe('calculateMatchPercentage', () => {
    it('should return 100% for exact match', () => {
      const pickup = { lat: 37.7749, lng: -122.4194 };
      const drop = { lat: 37.8044, lng: -122.2711 };
      const ride = {
        pickupLocation: {
          coordinates: [-122.4194, 37.7749]
        },
        dropLocation: {
          coordinates: [-122.2711, 37.8044]
        }
      };
      
      const result = routeMatcher.calculateMatchPercentage(pickup, drop, ride);
      
      expect(result).toBeGreaterThanOrEqual(90);
    });

    it('should return lower percentage for far match', () => {
      const pickup = { lat: 37.7749, lng: -122.4194 };
      const drop = { lat: 34.0522, lng: -118.2437 };
      const ride = {
        pickupLocation: {
          coordinates: [-122.4194, 37.7749]
        },
        dropLocation: {
          coordinates: [-122.2711, 37.8044]
        }
      };
      
      const result = routeMatcher.calculateMatchPercentage(pickup, drop, ride, 50);
      
      expect(result).toBeLessThan(50);
    });

    it('should return 0% when outside radius', () => {
      const pickup = { lat: 40.7128, lng: -74.0060 };
      const drop = { lat: 40.7580, lng: -73.9855 };
      const ride = {
        pickupLocation: {
          coordinates: [-122.4194, 37.7749]
        },
        dropLocation: {
          coordinates: [-122.2711, 37.8044]
        }
      };
      
      const result = routeMatcher.calculateMatchPercentage(pickup, drop, ride, 10);
      
      expect(result).toBe(0);
    });
  });

  describe('isRouteCompatible', () => {
    it('should return true for compatible route', () => {
      const userPickup = { lat: 37.7749, lng: -122.4194 };
      const userDrop = { lat: 37.8044, lng: -122.2711 };
      const ride = {
        pickupLocation: {
          coordinates: [-122.4194, 37.7749]
        },
        dropLocation: {
          coordinates: [-122.2711, 37.8044]
        }
      };
      
      const result = routeMatcher.isRouteCompatible(userPickup, userDrop, ride, 10);
      
      expect(result).toBe(true);
    });

    it('should return false for incompatible route', () => {
      const userPickup = { lat: 40.7128, lng: -74.0060 };
      const userDrop = { lat: 40.7580, lng: -73.9855 };
      const ride = {
        pickupLocation: {
          coordinates: [-122.4194, 37.7749]
        },
        dropLocation: {
          coordinates: [-122.2711, 37.8044]
        }
      };
      
      const result = routeMatcher.isRouteCompatible(userPickup, userDrop, ride, 5);
      
      expect(result).toBe(false);
    });
  });

  describe('rankRides', () => {
    it('should rank rides by match percentage', () => {
      const pickup = { lat: 37.7749, lng: -122.4194 };
      const drop = { lat: 37.8044, lng: -122.2711 };
      
      const rides = [
        {
          id: 1,
          pickupLocation: { coordinates: [-122.4200, 37.7750] },
          dropLocation: { coordinates: [-122.2710, 37.8045] }
        },
        {
          id: 2,
          pickupLocation: { coordinates: [-122.4194, 37.7749] },
          dropLocation: { coordinates: [-122.2711, 37.8044] }
        },
        {
          id: 3,
          pickupLocation: { coordinates: [-122.4500, 37.8000] },
          dropLocation: { coordinates: [-122.3000, 37.8200] }
        }
      ];
      
      const ranked = routeMatcher.rankRides(pickup, drop, rides, 20);
      
      expect(ranked[0].id).toBe(2);
      expect(ranked[2].id).toBe(3);
    });

    it('should return empty array for empty rides', () => {
      const pickup = { lat: 37.7749, lng: -122.4194 };
      const drop = { lat: 37.8044, lng: -122.2711 };
      
      const result = routeMatcher.rankRides(pickup, drop, [], 20);
      
      expect(result).toEqual([]);
    });
  });
});
