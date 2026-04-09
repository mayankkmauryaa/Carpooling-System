const DistanceCalculator = require('./distance');
const S2CellManager = require('./s2Cell');

const calculateDistance = (coord1, coord2) => {
  return DistanceCalculator.haversine(coord1[1], coord1[0], coord2[1], coord2[0]);
};

const calculateRouteMatchPercentage = (driverPickup, driverDrop, riderPickup, riderDrop) => {
  const pickupDistance = calculateDistance(driverPickup, riderPickup);
  const dropDistance = calculateDistance(driverDrop, riderDrop);
  
  const totalRouteDistance = calculateDistance(driverPickup, driverDrop);
  
  if (totalRouteDistance === 0) return 0;
  
  const pickupScore = Math.max(0, 100 - (pickupDistance * 10));
  const dropScore = Math.max(0, 100 - (dropDistance * 10));
  
  const routeAlignment = calculateRouteAlignment(driverPickup, driverDrop, riderPickup, riderDrop);
  
  return Math.round((pickupScore * 0.3 + dropScore * 0.3 + routeAlignment * 0.4));
};

const calculateRouteAlignment = (driverPickup, driverDrop, riderPickup, riderDrop) => {
  const driverRoute = calculateDistance(driverPickup, driverDrop);
  const riderOnDriverRoute = calculateDistance(driverPickup, riderPickup) + calculateDistance(riderPickup, riderDrop) + calculateDistance(riderDrop, driverDrop);
  
  if (driverRoute === 0) return 0;
  
  const alignment = Math.max(0, 100 - ((riderOnDriverRoute - driverRoute) / driverRoute * 100));
  return alignment;
};

const filterByPreferences = (ridePreferences, riderPreferences) => {
  if (!ridePreferences || !riderPreferences) return true;
  
  if (ridePreferences.femaleOnly && riderPreferences.gender !== 'female') {
    return false;
  }
  
  if (riderPreferences.smoking !== undefined && ridePreferences.smoking !== riderPreferences.smoking) {
    return false;
  }
  
  if (riderPreferences.pets !== undefined && ridePreferences.pets !== riderPreferences.pets) {
    return false;
  }
  
  return true;
};

const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

const generateS2CellId = (coordinates) => {
  return S2CellManager.latLngToCellId(coordinates[1], coordinates[0]);
};

const generateMaskedPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'XXX-XXX-XXXX';
  return `+${digits.slice(0, 2)}-555-${digits.slice(-4)}`;
};

module.exports = {
  calculateDistance,
  calculateRouteMatchPercentage,
  calculateRouteAlignment,
  filterByPreferences,
  paginate,
  generateS2CellId,
  generateMaskedPhone
};
