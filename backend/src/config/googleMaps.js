class GoogleMapsConfig {
  static get apiKey() {
    return process.env.GOOGLE_MAPS_API_KEY;
  }

  static isEnabled() {
    return process.env.GOOGLE_MAPS_ENABLED === 'true' && !!this.apiKey;
  }

  static get baseUrl() {
    return 'https://maps.googleapis.com/maps/api';
  }

  static get distanceMatrixUrl() {
    return `${this.baseUrl}/distancematrix/json`;
  }

  static get geocodingUrl() {
    return `${this.baseUrl}/geocoding/json`;
  }

  static get directionsUrl() {
    return `${this.baseUrl}/directions/json`;
  }

  static get placesUrl() {
    return `${this.baseUrl}/places/json`;
  }

  static get timeout() {
    return parseInt(process.env.GOOGLE_MAPS_TIMEOUT) || 10000;
  }

  static getCacheKey(prefix, params) {
    return `${prefix}:${Object.values(params).join(':')}`;
  }
}

module.exports = GoogleMapsConfig;
