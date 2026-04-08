const DistanceCalculator = require('./distance');
const ETACalculator = require('./eta');
const RouteMatcher = require('./routeMatcher');

class DispatchEngine {
  constructor() {
    this.maxSearchRadius = 15;
    this.maxResults = 10;
  }
  
  findMatches(availableRides, riderRequest) {
    const scoredRides = availableRides
      .map(ride => this.scoreRide(ride, riderRequest))
      .filter(ride => ride.score > 0)
      .sort((a, b) => b.score - a.score);
    
    return scoredRides.slice(0, this.maxResults);
  }
  
  scoreRide(ride, riderRequest) {
    const routeMatcher = new RouteMatcher();
    
    let riderPickup, riderDropoff;
    
    if (riderRequest.pickupLocation.coordinates) {
      riderPickup = {
        lat: riderRequest.pickupLocation.coordinates[1],
        lng: riderRequest.pickupLocation.coordinates[0]
      };
      riderDropoff = {
        lat: riderRequest.dropLocation.coordinates[1],
        lng: riderRequest.dropLocation.coordinates[0]
      };
    } else {
      riderPickup = riderRequest.pickupLocation;
      riderDropoff = riderRequest.dropLocation;
    }
    
    const matchPercentage = routeMatcher.calculateMatchPercentage(
      {
        pickupLocation: { 
          coordinates: ride.pickupLocation.coordinates,
          lat: ride.pickupLocation.coordinates[1],
          lng: ride.pickupLocation.coordinates[0]
        },
        dropLocation: { 
          coordinates: ride.dropLocation.coordinates,
          lat: ride.dropLocation.coordinates[1],
          lng: ride.dropLocation.coordinates[0]
        },
        routeData: ride.routeData
      },
      {
        pickupLocation: riderPickup,
        dropLocation: riderDropoff
      }
    );
    
    let riderToPickupKm;
    if (riderRequest.pickupLocation.coordinates) {
      riderToPickupKm = DistanceCalculator.haversine(
        riderRequest.pickupLocation.coordinates[1],
        riderRequest.pickupLocation.coordinates[0],
        ride.pickupLocation.coordinates[1],
        ride.pickupLocation.coordinates[0]
      );
    } else {
      riderToPickupKm = DistanceCalculator.haversine(
        riderRequest.pickupLocation.lat,
        riderRequest.pickupLocation.lng,
        ride.pickupLocation.coordinates[1],
        ride.pickupLocation.coordinates[0]
      );
    }
    
    const etaMinutes = ETACalculator.calculate(riderToPickupKm);
    
    const preferenceScore = this.calculatePreferenceMatch(
      ride.preferences,
      riderRequest.preferences
    );
    
    const driverRating = ride.driverId ? (ride.driverId.rating || 4.0) : 4.0;
    
    const score = this.calculateCombinedScore({
      matchPercentage,
      etaMinutes,
      preferenceScore,
      driverRating,
      price: ride.pricePerSeat
    });
    
    return {
      ride,
      score,
      matchPercentage,
      etaMinutes,
      preferenceScore,
      distanceToPickup: riderToPickupKm
    };
  }
  
  calculatePreferenceMatch(ridePrefs, riderPrefs) {
    if (!riderPrefs) return 100;
    
    let matches = 0;
    let total = 0;
    
    if (riderPrefs.smoking !== undefined) {
      total++;
      if (ridePrefs.smoking === riderPrefs.smoking || !ridePrefs.smoking) matches++;
    }
    
    if (riderPrefs.pets !== undefined) {
      total++;
      if (ridePrefs.pets === true || !riderPrefs.pets) matches++;
    }
    
    if (ridePrefs.femaleOnly) {
      if (riderPrefs.gender === 'female') {
        total++;
        matches++;
      } else {
        return 0;
      }
    }
    
    return total > 0 ? (matches / total) * 100 : 100;
  }
  
  calculateCombinedScore({ matchPercentage, etaMinutes, preferenceScore, driverRating, price }) {
    const weights = {
      match: 0.35,
      eta: 0.25,
      preference: 0.20,
      rating: 0.10,
      price: 0.10
    };
    
    const etaScore = Math.max(0, 100 - (etaMinutes * 3.33));
    
    const ratingScore = (driverRating / 5) * 100;
    
    const priceScore = Math.max(0, 100 - (price * 2));
    
    return Math.round(
      (matchPercentage * weights.match) +
      (etaScore * weights.eta) +
      (preferenceScore * weights.preference) +
      (ratingScore * weights.rating) +
      (priceScore * weights.price)
    );
  }
  
  filterByRadius(availableRides, riderLocation, maxRadiusKm = this.maxSearchRadius) {
    return availableRides.filter(ride => {
      const rideLat = ride.pickupLocation.coordinates[1];
      const rideLng = ride.pickupLocation.coordinates[0];
      
      const riderLat = riderLocation.coordinates ? riderLocation.coordinates[1] : riderLocation.lat;
      const riderLng = riderLocation.coordinates ? riderLocation.coordinates[0] : riderLocation.lng;
      
      const distance = DistanceCalculator.haversine(riderLat, riderLng, rideLat, rideLng);
      
      return distance <= maxRadiusKm;
    });
  }
  
  getMatchQualityLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }
}

module.exports = DispatchEngine;
