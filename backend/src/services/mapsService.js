const GoogleMapsConfig = require('../config/googleMaps');
const DistanceCalculator = require('../utils/distance');
const ETACalculator = require('../utils/eta');
const logger = require('../middleware/logger');

class GoogleMapsService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000;
  }

  async fetchWithTimeout(url, timeout = GoogleMapsConfig.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  buildCacheKey(prefix, params) {
    return GoogleMapsConfig.getCacheKey(prefix, params);
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async makeRequest(url) {
    if (!GoogleMapsConfig.isEnabled()) {
      throw new Error('Google Maps API is not enabled');
    }

    const cacheKey = url;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Maps API error: ${data.status}`);
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Google Maps API request failed', { url, error: error.message });
      throw error;
    }
  }

  async getDistanceAndDuration(origins, destinations) {
    if (!GoogleMapsConfig.isEnabled()) {
      return this.getMockDistance(origins, destinations);
    }

    const originStr = Array.isArray(origins) 
      ? origins.map(o => `${o.lat},${o.lng}`).join('|')
      : `${origins.lat},${origins.lng}`;

    const destStr = Array.isArray(destinations)
      ? destinations.map(d => `${d.lat},${d.lng}`).join('|')
      : `${destinations.lat},${destinations.lng}`;

    const url = `${GoogleMapsConfig.distanceMatrixUrl}?origins=${originStr}&destinations=${destStr}&key=${GoogleMapsConfig.apiKey}`;

    try {
      const data = await this.makeRequest(url);
      return this.parseDistanceMatrixResponse(data);
    } catch (error) {
      logger.warn('Falling back to mock distance calculation', { error: error.message });
      return this.getMockDistance(origins, destinations);
    }
  }

  parseDistanceMatrixResponse(data) {
    if (!data.rows || !data.rows[0] || !data.rows[0].elements) {
      return this.getMockDistance({}, {});
    }

    const element = data.rows[0].elements[0];
    
    if (element.status === 'ZERO_RESULTS') {
      return {
        distance: { value: 0, text: 'Route not available' },
        duration: { value: 0, text: 'N/A' },
        status: 'ZERO_RESULTS'
      };
    }

    return {
      distance: {
        value: element.distance.value,
        text: element.distance.text
      },
      duration: {
        value: element.duration.value,
        text: element.duration.text,
        inTraffic: element.duration_in_traffic ? {
          value: element.duration_in_traffic.value,
          text: element.duration_in_traffic.text
        } : null
      },
      status: 'OK'
    };
  }

  getMockDistance(origins, destinations) {
    let totalDistance = 0;
    
    if (origins.lat && destinations.lat) {
      totalDistance = DistanceCalculator.haversine(
        origins.lat, origins.lng,
        destinations.lat, destinations.lng
      );
    }

    const distanceKm = totalDistance;
    const etaMinutes = ETACalculator.calculate(distanceKm, 'moderate');

    return {
      distance: {
        value: Math.round(distanceKm * 1000),
        text: `${distanceKm.toFixed(1)} km`
      },
      duration: {
        value: etaMinutes * 60,
        text: ETACalculator.format(etaMinutes)
      },
      status: 'MOCK'
    };
  }

  async geocodeAddress(address) {
    if (!GoogleMapsConfig.isEnabled()) {
      throw new Error('Geocoding requires Google Maps API');
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `${GoogleMapsConfig.geocodingUrl}?address=${encodedAddress}&key=${GoogleMapsConfig.apiKey}`;

    try {
      const data = await this.makeRequest(url);
      return this.parseGeocodeResponse(data);
    } catch (error) {
      logger.error('Geocoding failed', { address, error: error.message });
      throw error;
    }
  }

  parseGeocodeResponse(data) {
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      formattedAddress: result.formatted_address,
      coordinates: {
        lat: location.lat,
        lng: location.lng
      },
      placeId: result.place_id,
      types: result.types,
      components: this.parseAddressComponents(result.address_components)
    };
  }

  parseAddressComponents(components) {
    const parsed = {};
    for (const component of components) {
      for (const type of component.types) {
        if (!parsed[type]) {
          parsed[type] = component.long_name;
        }
        if (type === 'short_name' && !parsed[`${type}_short`]) {
          parsed[`${type}_short`] = component.short_name;
        }
      }
    }
    return parsed;
  }

  async reverseGeocode(lat, lng) {
    if (!GoogleMapsConfig.isEnabled()) {
      throw new Error('Reverse geocoding requires Google Maps API');
    }

    const url = `${GoogleMapsConfig.geocodingUrl}?latlng=${lat},${lng}&key=${GoogleMapsConfig.apiKey}`;

    try {
      const data = await this.makeRequest(url);
      return this.parseGeocodeResponse(data);
    } catch (error) {
      logger.error('Reverse geocoding failed', { lat, lng, error: error.message });
      throw error;
    }
  }

  async getDirections(origin, destination, waypoints = []) {
    if (!GoogleMapsConfig.isEnabled()) {
      return this.getMockDirections(origin, destination, waypoints);
    }

    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;
    
    let url = `${GoogleMapsConfig.directionsUrl}?origin=${originStr}&destination=${destStr}&key=${GoogleMapsConfig.apiKey}`;
    
    if (waypoints.length > 0) {
      const waypointStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
      url += `&waypoints=optimize:true|${waypointStr}`;
    }

    try {
      const data = await this.makeRequest(url);
      return this.parseDirectionsResponse(data);
    } catch (error) {
      logger.warn('Falling back to mock directions', { error: error.message });
      return this.getMockDirections(origin, destination, waypoints);
    }
  }

  parseDirectionsResponse(data) {
    if (!data.routes || data.routes.length === 0) {
      return this.getMockDirections({}, {});
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const points = this.decodePolyline(route.overview_polyline.points);
    
    const distance = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
    const duration = route.legs.reduce((total, leg) => total + leg.duration.value, 0);
    const durationInTraffic = route.legs.reduce((total, leg) => {
      return total + (leg.duration_in_traffic?.value || leg.duration.value);
    }, 0);

    return {
      distance: {
        value: distance,
        text: this.formatDistance(distance)
      },
      duration: {
        value: duration,
        text: this.formatDuration(duration)
      },
      durationInTraffic: {
        value: durationInTraffic,
        text: this.formatDuration(durationInTraffic)
      },
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      waypoints: route.legs.flatMap(l => l.via_waypoint?.map(w => ({
        location: w.location,
        stepIndex: w.step_index
      })) || []),
      overviewPath: points,
      bounds: route.bounds
    };
  }

  decodePolyline(encoded) {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return points;
  }

  getMockDirections(origin, destination, waypoints = []) {
    const directDistance = DistanceCalculator.haversine(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );
    
    let totalDistance = directDistance * 1.3;
    
    if (waypoints.length > 0) {
      let prev = origin;
      for (const wp of waypoints) {
        totalDistance += DistanceCalculator.haversine(
          prev.lat, prev.lng,
          wp.lat, wp.lng
        ) * 1.3;
        prev = wp;
      }
      totalDistance += DistanceCalculator.haversine(
        prev.lat, prev.lng,
        destination.lat, destination.lng
      ) * 1.3;
    }

    const durationSeconds = ETACalculator.calculate(totalDistance, 'moderate') * 60;

    return {
      distance: {
        value: Math.round(totalDistance * 1000),
        text: `${totalDistance.toFixed(1)} km`
      },
      duration: {
        value: durationSeconds,
        text: ETACalculator.format(durationSeconds / 60)
      },
      durationInTraffic: null,
      startAddress: 'Origin',
      endAddress: 'Destination',
      waypoints: [],
      overviewPath: [
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng }
      ],
      bounds: null
    };
  }

  formatDistance(meters) {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    return ETACalculator.format(minutes);
  }

  async calculateFare(distanceKm, vehicleType = 'standard') {
    const rates = {
      standard: { base: 20, perKm: 8, perMin: 1 },
      premium: { base: 40, perKm: 15, perMin: 2 },
      suv: { base: 30, perKm: 12, perMin: 1.5 }
    };

    const rate = rates[vehicleType] || rates.standard;
    const distanceFare = distanceKm * rate.perKm;
    const minimumFare = rate.base;

    return Math.max(distanceFare, minimumFare);
  }

  async getPlaceDetails(placeId) {
    if (!GoogleMapsConfig.isEnabled()) {
      throw new Error('Place details require Google Maps API');
    }

    const url = `${GoogleMapsConfig.placesUrl}?place_id=${placeId}&key=${GoogleMapsConfig.apiKey}`;

    try {
      const data = await this.makeRequest(url);
      if (!data.result) return null;

      return {
        name: data.result.name,
        address: data.result.formatted_address,
        location: data.result.geometry?.location,
        rating: data.result.rating,
        types: data.result.types,
        openingHours: data.result.opening_hours?.weekday_text,
        photos: data.result.photos?.map(p => ({
          photoReference: p.photo_reference,
          height: p.height,
          width: p.width
        }))
      };
    } catch (error) {
      logger.error('Place details failed', { placeId, error: error.message });
      throw error;
    }
  }

  async searchNearby(lat, lng, type = 'point_of_interest', radius = 1000) {
    if (!GoogleMapsConfig.isEnabled()) {
      throw new Error('Nearby search requires Google Maps API');
    }

    const url = `${GoogleMapsConfig.placesUrl}?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GoogleMapsConfig.apiKey}`;

    try {
      const data = await this.makeRequest(url);
      return (data.results || []).map(place => ({
        name: place.name,
        address: place.vicinity,
        location: place.geometry?.location,
        placeId: place.place_id,
        types: place.types,
        rating: place.rating,
        openNow: place.opening_hours?.open_now
      }));
    } catch (error) {
      logger.error('Nearby search failed', { lat, lng, error: error.message });
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
    logger.info('Google Maps cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

module.exports = new GoogleMapsService();
