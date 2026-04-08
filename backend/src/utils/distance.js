class DistanceCalculator {
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  static haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * 
              Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
  
  static haversineMeters(lat1, lng1, lat2, lng2) {
    return this.haversine(lat1, lng1, lat2, lng2) * 1000;
  }
  
  static isWithinRadius(lat1, lng1, lat2, lng2, radiusKm) {
    return this.haversine(lat1, lng1, lat2, lng2) <= radiusKm;
  }
  
  static calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = this.toRadians(lng2 - lng1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180 / Math.PI + 360) % 360;
    
    return bearing;
  }
  
  static destinationPoint(lat, lng, bearing, distanceKm) {
    const R = 6371;
    const angularDistance = distanceKm / R;
    const bearingRad = this.toRadians(bearing);
    const lat1Rad = this.toRadians(lat);
    const lng1Rad = this.toRadians(lng);
    
    const lat2 = Math.asin(
      Math.sin(lat1Rad) * Math.cos(angularDistance) +
      Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(bearingRad)
    );
    
    const lng2 = lng1Rad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1Rad),
      Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(lat2)
    );
    
    return {
      lat: lat2 * 180 / Math.PI,
      lng: lng2 * 180 / Math.PI
    };
  }
}

module.exports = DistanceCalculator;
