# Algorithms - Carpooling System

## 📋 Overview

This document explains the core algorithms implemented in the carpooling system, including route matching, location-based queries, and dispatch logic.

---

## 1. Geospatial Location Algorithm

### S2 Cell Concept (Simplified)

The S2 library (used by Uber) divides the Earth's surface into a hierarchical grid of cells. For learning purposes, we implement a simplified version.

### Implementation

```javascript
class S2CellManager {
  // Earth radius in km
  static EARTH_RADIUS = 6371;

  // Cell size in km (similar to Uber's ~3km cells)
  static CELL_SIZE = 3;

  // Convert lat/lng to cell ID
  static latLngToCellId(lat, lng, level = 15) {
    // Normalize coordinates
    const normalizedLat = (lat + 90) / 180;
    const normalizedLng = (lng + 180) / 360;

    // Convert to cell ID using Hilbert curve (simplified)
    const cellSize = Math.pow(2, level);
    const x = Math.floor(normalizedLng * cellSize);
    const y = Math.floor(normalizedLat * cellSize);

    // Interleave bits for better spatial locality (Z-order curve)
    return this.interleaveBits(x, y);
  }

  // Get neighboring cell IDs
  static getNeighborCells(cellId, radius = 1) {
    const neighbors = [];
    const decoded = this.decodeCellId(cellId);

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const neighborX = decoded.x + dx;
        const neighborY = decoded.y + dy;

        // Check bounds
        if (neighborX >= 0 && neighborY >= 0) {
          neighbors.push(this.interleaveBits(neighborX, neighborY));
        }
      }
    }

    return neighbors;
  }

  // Interleave bits for Z-order curve
  static interleaveBits(x, y) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
      result |= ((x >> i) & 1) << (2 * i);
      result |= ((y >> i) & 1) << (2 * i + 1);
    }
    return result;
  }

  // Decode cell ID back to coordinates
  static decodeCellId(cellId) {
    let x = 0,
      y = 0;
    for (let i = 0; i < 32; i++) {
      x |= ((cellId >> (2 * i)) & 1) << i;
      y |= ((cellId >> (2 * i + 1)) & 1) << i;
    }
    return { x, y };
  }
}

module.exports = S2CellManager;
```

### Time Complexity

- **O(1)** for cell ID generation
- **O(n)** where n = number of neighboring cells for neighbor queries

---

## 2. Distance Calculation - Haversine Formula

### Purpose

Calculate the great-circle distance between two points on Earth's surface.

### Algorithm

```javascript
class DistanceCalculator {
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lng1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lng2 - Longitude of point 2
   * @returns {number} Distance in kilometers
   */
  static haversine(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km

    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate distance in meters
   */
  static haversineMeters(lat1, lng1, lat2, lng2) {
    return this.haversine(lat1, lng1, lat2, lng2) * 1000;
  }

  /**
   * Check if point is within radius
   */
  static isWithinRadius(lat1, lng1, lat2, lng2, radiusKm) {
    return this.haversine(lat1, lng1, lat2, lng2) <= radiusKm;
  }
}

// Usage examples:
console.log(
  DistanceCalculator.haversine(
    37.7749,
    -122.4194, // San Francisco
    37.4028,
    -122.0869, // Palo Alto
  ),
); // Output: ~45.2 km
```

### Time Complexity

- **O(1)** - Constant time calculation

---

## 3. Route Match Percentage Algorithm

### Purpose

Calculate how well a driver's route matches a rider's origin and destination.

### Implementation

```javascript
class RouteMatcher {
  constructor() {
    // Weights for different match components
    this.WEIGHTS = {
      pickup: 0.3,
      dropoff: 0.3,
      route: 0.4
    };

    // Thresholds in km
    this.THRESHOLDS = {
      excellent: 1,    // < 1km
      good: 3,          // < 3km
      fair: 5,          // < 5km
      poor: 10          // < 10km
    };
  }

  /**
   * Calculate overall route match percentage
   * @param {Object} driverRoute - Driver's route data
   * @param {Object} riderRequest - Rider's origin/destination
   * @returns {number} Match percentage (0-100)
   */
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

    // Weighted average
    const totalScore =
      (pickupScore * this.WEIGHTS.pickup) +
      (dropoffScore * this.WEIGHTS.dropoff) +
      (routeScore * this.WEIGHTS.route);

    return Math.round(totalScore);
  }

  /**
   * Calculate pickup location match score
   */
  calculatePickupMatch(driverPickup, riderPickup) {
    const distance = DistanceCalculator.haversine(
      driverPickup.lat, driverPickup.lng,
      riderPickup.lat, riderPickup.lng
    );

    return this.distanceToScore(distance);
  }

  /**
   * Calculate dropoff location match score
   */
  calculateDropoffMatch(driverDropoff, riderDropoff) {
    const distance = DistanceCalculator.haversine(
      driverDropoff.lat, driverDropoff.lng,
      riderDropoff.lat, riderDropoff.lng
    );

    return this.distanceToScore(distance);
  }

  /**
   * Convert distance to score (0-100)
   */
  distanceToScore(distance) {
    if (distance <= this.THRESHOLDS.excellent) return 100;
    if (distance <= this.THRESHOLDS.good) return 85;
    if (distance <= this.THRESHOLDS.fair) return 70;
    if (distance <= this.THRESHOLDS.poor) return 50;

    // Linear decrease beyond poor threshold
    return Math.max(0, 50 - (distance - 10) * 5);
  }

  /**
   * Calculate route overlap score
   * Simplified version - checks if rider's route is on driver's path
   */
  calculateRouteOverlap(driverRouteData, riderRequest) {
    if (!driverRouteData || !driverRouteData.waypoints) {
      return 50; // Default score if no route data
    }

    // Check how many rider waypoints are near driver route
    let matches = 0;
    const total = 2; // pickup and dropoff

    // Check if rider's pickup is near driver's route
    const pickupNearRoute = this.isPointNearPath(
      riderRequest.pickupLocation,
      driverRouteData.waypoints,
      5 // 5km threshold
    );

    // Check if rider's dropoff is near driver's route
    const dropoffNearRoute = this.isPointNearPath(
      riderRequest.dropLocation,
      driverRouteData.waypoints,
      5
    );

    if (pickupNearRoute) matches++;
    if (dropoffNearRoute) matches++;

    return (matches / total) * 100;
  }

  /**
   * Check if a point is near a path
   */
  isPointNearPath(point, waypoints, thresholdKm) {
    for (const waypoint of waypoints) {
      const distance = DistanceCalculator.haversine(
        point.lat, point.lng,
        waypoint.lat, waypoint.lng
      );

      if (distance <= thresholdKm) return true;
    }
    return false;
  }

  /**
   * Get match quality label
   */
  getMatchQuality(percentage) {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Poor';
  }
}

// Usage
const matcher = new RouteMatcher();
const matchPercentage = matcher.calculateMatchPercentage(
  {
    pickupLocation: { lat: 37.7749, lng: -122.4194 },
    dropLocation: { lat: 37.4028, lng: -122.0869 },
    routeData: { waypoints: [...] }
  },
  {
    pickupLocation: { lat: 37.7750, lng: -122.4190 },
    dropLocation: { lat: 37.4030, lng: -122.0870 }
  }
);
console.log(`${matchPercentage}% - ${matcher.getMatchQuality(matchPercentage)}`);
```

### Time Complexity

- **O(n)** where n = number of waypoints in route
- **O(1)** for pickup/dropoff matching

---

## 4. ETA Calculation Algorithm

### Purpose

Estimate time of arrival based on distance and traffic.

### Implementation

```javascript
class ETACalculator {
  // Average speeds in km/h for different conditions
  static AVERAGE_SPEEDS = {
    light: 50, // Light traffic
    moderate: 35, // Moderate traffic
    heavy: 20, // Heavy traffic
    peak: 15, // Rush hour
  };

  /**
   * Calculate ETA
   * @param {number} distanceKm - Distance in kilometers
   * @param {string} trafficCondition - Traffic condition
   * @returns {number} ETA in minutes
   */
  static calculate(distanceKm, trafficCondition = "moderate") {
    const speed =
      this.AVERAGE_SPEEDS[trafficCondition] || this.AVERAGE_SPEEDS.moderate;

    const travelTimeHours = distanceKm / speed;
    const travelTimeMinutes = travelTimeHours * 60;

    // Add buffer time for stops (1 minute per km, max 10 min)
    const stopBuffer = Math.min(distanceKm, 10);

    return Math.round(travelTimeMinutes + stopBuffer);
  }

  /**
   * Calculate ETA considering multiple stops
   */
  static withStops(distanceKm, numberOfStops, trafficCondition = "moderate") {
    const baseTime = this.calculate(distanceKm, trafficCondition);
    const stopTime = numberOfStops * 5; // 5 minutes per stop
    return baseTime + stopTime;
  }

  /**
   * Format ETA for display
   */
  static format(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${mins} min`;
  }
}

// Usage
console.log(ETACalculator.calculate(45, "moderate")); // ~87 minutes
console.log(ETACalculator.format(87)); // "1 hr 27 min"
```

### Time Complexity

- **O(1)** - Constant time calculation

---

## 5. Supply-Demand Matching Algorithm

### Purpose

Match riders with available drivers based on multiple factors.

### Implementation

```javascript
class DispatchEngine {
  constructor() {
    this.maxSearchRadius = 15; // km
    this.maxResults = 10;
  }

  /**
   * Find matching rides for a rider request
   * @param {Array} availableRides - List of available ride pools
   * @param {Object} riderRequest - Rider's request
   * @returns {Array} Sorted list of matching rides
   */
  findMatches(availableRides, riderRequest) {
    const scoredRides = availableRides
      .map((ride) => this.scoreRide(ride, riderRequest))
      .filter((ride) => ride.score > 0)
      .sort((a, b) => b.score - a.score);

    return scoredRides.slice(0, this.maxResults);
  }

  /**
   * Score a ride based on multiple factors
   */
  scoreRide(ride, riderRequest) {
    const routeMatcher = new RouteMatcher();

    // Calculate route match percentage
    const matchPercentage = routeMatcher.calculateMatchPercentage(
      {
        pickupLocation: {
          lat: ride.pickupLocation.coordinates[1],
          lng: ride.pickupLocation.coordinates[0],
        },
        dropLocation: {
          lat: ride.dropLocation.coordinates[1],
          lng: ride.dropLocation.coordinates[0],
        },
        routeData: ride.routeData,
      },
      {
        pickupLocation: riderRequest.pickupLocation,
        dropLocation: riderRequest.dropLocation,
      },
    );

    // Calculate ETA
    const riderToPickup = DistanceCalculator.haversine(
      riderRequest.pickupLocation.lat,
      riderRequest.pickupLocation.lng,
      ride.pickupLocation.coordinates[1],
      ride.pickupLocation.coordinates[0],
    );

    const etaMinutes = ETACalculator.calculate(riderToPickup);

    // Calculate preference match
    const preferenceScore = this.calculatePreferenceMatch(
      ride.preferences,
      riderRequest.preferences,
    );

    // Combined score
    const score = this.calculateCombinedScore({
      matchPercentage,
      etaMinutes,
      preferenceScore,
      driverRating: ride.driverRating || 4.0,
      price: ride.pricePerSeat,
    });

    return {
      ride,
      score,
      matchPercentage,
      etaMinutes,
      preferenceScore,
    };
  }

  /**
   * Calculate preference match score
   */
  calculatePreferenceMatch(ridePrefs, riderPrefs) {
    let matches = 0;
    let total = 0;

    // Smoking preference
    if (riderPrefs.smoking !== undefined) {
      total++;
      if (ridePrefs.smoking === riderPrefs.smoking) matches++;
    }

    // Pet preference
    if (riderPrefs.pets !== undefined) {
      total++;
      if (ridePrefs.pets === true || !riderPrefs.pets) matches++;
    }

    // Female only check
    if (ridePrefs.femaleOnly && riderPrefs.gender !== "female") {
      return 0; // Not a match
    }

    return total > 0 ? (matches / total) * 100 : 100;
  }

  /**
   * Calculate combined score
   */
  calculateCombinedScore({
    matchPercentage,
    etaMinutes,
    preferenceScore,
    driverRating,
    price,
  }) {
    // Weights
    const weights = {
      match: 0.35,
      eta: 0.25,
      preference: 0.2,
      rating: 0.1,
      price: 0.1,
    };

    // Normalize ETA (max 30 min = 100, min 0 = 0)
    const etaScore = Math.max(0, 100 - etaMinutes * 3.33);

    // Normalize rating (5 = 100, 3 = 60)
    const ratingScore = (driverRating / 5) * 100;

    // Normalize price (lower is better)
    const priceScore = Math.max(0, 100 - price * 2);

    return Math.round(
      matchPercentage * weights.match +
        etaScore * weights.eta +
        preferenceScore * weights.preference +
        ratingScore * weights.rating +
        priceScore * weights.price,
    );
  }
}

// Usage
const dispatch = new DispatchEngine();
const matches = dispatch.findMatches(availableRides, riderRequest);
```

### Time Complexity

- **O(n)** where n = number of available rides
- Each ride scoring is **O(1)**

---

## 6. Privacy - Phone Number Masking

### Purpose

Generate masked phone numbers for privacy.

### Implementation

```javascript
class PrivacyService {
  /**
   * Generate a masked phone number
   * @param {string} realPhone - Real phone number
   * @returns {string} Masked phone number
   */
  static maskPhoneNumber(realPhone) {
    // Remove all non-digit characters
    const digits = realPhone.replace(/\D/g, "");

    // Show only first 3 and last 4 digits
    if (digits.length < 7) return "***-***-****";

    const firstThree = digits.slice(0, 3);
    const lastFour = digits.slice(-4);
    const middle = "*".repeat(4);

    return `${firstThree}-${middle}-${lastFour}`;
  }

  /**
   * Generate a temporary virtual number
   */
  static generateVirtualNumber() {
    // Generate a random number in US format
    const areaCode = Math.floor(Math.random() * 900) + 100; // 100-999
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;

    return `+1-${areaCode}-${prefix}-${lineNumber}`;
  }

  /**
   * Check if ride is active (for phone visibility)
   */
  static canShowPhoneNumber(rideStatus) {
    return ["in-progress", "scheduled"].includes(rideStatus);
  }
}
```

---

## 7. Algorithm Complexity Summary

| Algorithm             | Time Complexity | Space Complexity |
| --------------------- | --------------- | ---------------- |
| S2 Cell ID Generation | O(1)            | O(1)             |
| Haversine Distance    | O(1)            | O(1)             |
| Route Match %         | O(n)            | O(1)             |
| ETA Calculation       | O(1)            | O(1)             |
| Dispatch Matching     | O(n)            | O(n)             |
| Phone Masking         | O(1)            | O(1)             |

Where **n** = number of waypoints or available rides

---

## 🧪 Testing Your Algorithms

### Console Demo - Testing Route Matching

```javascript
// test-matching.js
const DistanceCalculator = require("./utils/distance");
const RouteMatcher = require("./utils/routeMatcher");
const ETACalculator = require("./utils/eta");

console.log("=== Distance Calculator Test ===");
console.log(
  "SF to Palo Alto:",
  DistanceCalculator.haversine(37.7749, -122.4194, 37.4028, -122.0869).toFixed(
    2,
  ),
  "km",
);

console.log("\n=== Route Matcher Test ===");
const matcher = new RouteMatcher();
const score = matcher.calculateMatchPercentage(
  {
    pickupLocation: { lat: 37.7749, lng: -122.4194 },
    dropLocation: { lat: 37.4028, lng: -122.0869 },
    routeData: { waypoints: [] },
  },
  {
    pickupLocation: { lat: 37.775, lng: -122.419 },
    dropLocation: { lat: 37.403, lng: -122.087 },
  },
);
console.log("Match Score:", score, "%");

console.log("\n=== ETA Calculator Test ===");
console.log("ETA for 45km:", ETACalculator.calculate(45));
console.log("Formatted:", ETACalculator.format(87));
```

Run with: `node console/test-matching.js`

---

_Algorithms designed for learning, optimized for educational purposes._
