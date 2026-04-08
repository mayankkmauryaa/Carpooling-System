const DistanceCalculator = require('./distance');

class RouteMatcher {
  constructor() {
    this.WEIGHTS = {
      pickup: 0.3,
      dropoff: 0.3,
      route: 0.4
    };
    
    this.THRESHOLDS = {
      excellent: 1,
      good: 3,
      fair: 5,
      poor: 10
    };
  }
  
  calculateMatchPercentage(driverRoute, riderRequest) {
    const pickupScore = this.calculatePickupMatch(
      driverRoute.pickupLocation,
      riderRequest.pickupLocation
    );
    
    const dropoffScore = this.calculateDropoffMatch(
      driverRoute.dropLocation,
      riderRequest.dropLocation
    );
    
    const routeScore = this.calculateRouteOverlap(
      driverRoute.routeData,
      riderRequest
    );
    
    const totalScore = 
      (pickupScore * this.WEIGHTS.pickup) +
      (dropoffScore * this.WEIGHTS.dropoff) +
      (routeScore * this.WEIGHTS.route);
    
    return Math.round(totalScore);
  }
  
  calculatePickupMatch(driverPickup, riderPickup) {
    let lat1, lng1, lat2, lng2;
    
    if (driverPickup.coordinates) {
      lng1 = driverPickup.coordinates[0];
      lat1 = driverPickup.coordinates[1];
    } else {
      lat1 = driverPickup.lat;
      lng1 = driverPickup.lng;
    }
    
    if (riderPickup.coordinates) {
      lng2 = riderPickup.coordinates[0];
      lat2 = riderPickup.coordinates[1];
    } else {
      lat2 = riderPickup.lat;
      lng2 = riderPickup.lng;
    }
    
    const distance = DistanceCalculator.haversine(lat1, lng1, lat2, lng2);
    
    return this.distanceToScore(distance);
  }
  
  calculateDropoffMatch(driverDropoff, riderDropoff) {
    let lat1, lng1, lat2, lng2;
    
    if (driverDropoff.coordinates) {
      lng1 = driverDropoff.coordinates[0];
      lat1 = driverDropoff.coordinates[1];
    } else {
      lat1 = driverDropoff.lat;
      lng1 = driverDropoff.lng;
    }
    
    if (riderDropoff.coordinates) {
      lng2 = riderDropoff.coordinates[0];
      lat2 = riderDropoff.coordinates[1];
    } else {
      lat2 = riderDropoff.lat;
      lng2 = riderDropoff.lng;
    }
    
    const distance = DistanceCalculator.haversine(lat1, lng1, lat2, lng2);
    
    return this.distanceToScore(distance);
  }
  
  distanceToScore(distance) {
    if (distance <= this.THRESHOLDS.excellent) return 100;
    if (distance <= this.THRESHOLDS.good) return 85;
    if (distance <= this.THRESHOLDS.fair) return 70;
    if (distance <= this.THRESHOLDS.poor) return 50;
    
    return Math.max(0, 50 - (distance - 10) * 5);
  }
  
  calculateRouteOverlap(driverRouteData, riderRequest) {
    if (!driverRouteData || !driverRouteData.waypoints || driverRouteData.waypoints.length === 0) {
      return 50;
    }
    
    let matches = 0;
    const total = 2;
    
    const riderPickup = riderRequest.pickupLocation;
    const riderDropoff = riderRequest.dropLocation;
    
    const pickupCoords = riderPickup.coordinates ? 
      { lat: riderPickup.coordinates[1], lng: riderPickup.coordinates[0] } : 
      riderPickup;
    
    const dropoffCoords = riderDropoff.coordinates ?
      { lat: riderDropoff.coordinates[1], lng: riderDropoff.coordinates[0] } :
      riderDropoff;
    
    if (this.isPointNearWaypoints(pickupCoords, driverRouteData.waypoints, 5)) matches++;
    if (this.isPointNearWaypoints(dropoffCoords, driverRouteData.waypoints, 5)) matches++;
    
    return (matches / total) * 100;
  }
  
  isPointNearWaypoints(point, waypoints, thresholdKm) {
    for (const wp of waypoints) {
      const wpCoords = wp.coordinates ? 
        { lat: wp.coordinates[1], lng: wp.coordinates[0] } : 
        wp;
      
      const distance = DistanceCalculator.haversine(
        point.lat, point.lng,
        wpCoords.lat, wpCoords.lng
      );
      
      if (distance <= thresholdKm) return true;
    }
    return false;
  }
  
  getMatchQuality(percentage) {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Poor';
  }
  
  sortByMatch(rides, riderRequest) {
    return rides.map(ride => {
      const matchPercentage = this.calculateMatchPercentage(
        {
          pickupLocation: ride.pickupLocation,
          dropLocation: ride.dropLocation,
          routeData: ride.routeData
        },
        riderRequest
      );
      return { ...ride, matchPercentage };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
}

module.exports = RouteMatcher;
