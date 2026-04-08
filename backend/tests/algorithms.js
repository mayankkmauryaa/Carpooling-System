const DistanceCalculator = require('../src/utils/distance');
const RouteMatcher = require('../src/utils/routeMatcher');
const ETACalculator = require('../src/utils/eta');
const S2CellManager = require('../src/utils/s2Cell');
const DispatchEngine = require('../src/utils/dispatch');
const PrivacyService = require('../src/utils/privacy');

console.log('=== Running Algorithm Tests ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(actual, message = '') {
  if (!actual) {
    throw new Error(`${message || 'Assertion failed'}: expected true, got ${actual}`);
  }
}

console.log('--- Distance Calculator Tests ---');

test('Haversine: Calculate distance between SF and Palo Alto', () => {
  const distance = DistanceCalculator.haversine(37.7749, -122.4194, 37.4028, -122.0869);
  assertTrue(distance > 40 && distance < 55, 'Distance should be between 40-55 km');
});

test('Haversine: Same location returns 0', () => {
  const distance = DistanceCalculator.haversine(37.7749, -122.4194, 37.7749, -122.4194);
  assertEqual(distance, 0, 'Same location distance should be 0');
});

test('isWithinRadius: Check if within radius', () => {
  const within = DistanceCalculator.isWithinRadius(37.7749, -122.4194, 37.7750, -122.4195, 1);
  assertTrue(within, 'Points ~155m apart should be within 1km');
});

test('Calculate bearing between two points', () => {
  const bearing = DistanceCalculator.calculateBearing(37.7749, -122.4194, 37.4028, -122.0869);
  console.log(`  Bearing: ${bearing}°`);
});

console.log('\n--- ETA Calculator Tests ---');

test('ETA: Calculate for 45km with moderate traffic', () => {
  const eta = ETACalculator.calculate(45, 'moderate');
  console.log(`  ETA: ${eta} minutes`);
});

test('ETA: Format minutes to hours', () => {
  const formatted = ETACalculator.format(87);
  assertEqual(formatted, '1 hr 27 min', '87 minutes should be 1 hr 27 min');
});

test('ETA: Format under 60 minutes', () => {
  const formatted = ETACalculator.format(45);
  assertEqual(formatted, '45 min', '45 minutes should be 45 min');
});

test('ETA: With stops', () => {
  const eta = ETACalculator.withStops(30, 3);
  console.log(`  ETA with 3 stops: ${eta} minutes`);
});

console.log('\n--- S2 Cell Tests ---');

test('S2: Generate cell ID from coordinates', () => {
  const cellId = S2CellManager.latLngToCellId(37.7749, -122.4194);
  console.log(`  Cell ID: ${cellId}`);
});

test('S2: Get neighbor cells', () => {
  const cellId = S2CellManager.latLngToCellId(37.7749, -122.4194);
  const neighbors = S2CellManager.getNeighborCells(cellId, 1);
  console.log(`  Neighbor cells: ${neighbors.length}`);
});

test('S2: Cell ID to lat/lng and back', () => {
  const originalLat = 37.7749;
  const originalLng = -122.4194;
  const cellId = S2CellManager.latLngToCellId(originalLat, originalLng);
  const coords = S2CellManager.cellIdToLatLng(cellId);
  console.log(`  Original: (${originalLat}, ${originalLng})`);
  console.log(`  Recovered: (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
});

console.log('\n--- Route Matcher Tests ---');

test('Route Matcher: Calculate match percentage (100% match)', () => {
  const matcher = new RouteMatcher();
  const match = matcher.calculateMatchPercentage(
    {
      pickupLocation: { lat: 37.7749, lng: -122.4194 },
      dropLocation: { lat: 37.4028, lng: -122.0869 },
      routeData: { waypoints: [] }
    },
    {
      pickupLocation: { lat: 37.7749, lng: -122.4194 },
      dropLocation: { lat: 37.4028, lng: -122.0869 }
    }
  );
  console.log(`  Match percentage: ${match}%`);
});

test('Route Matcher: Calculate match percentage (partial match)', () => {
  const matcher = new RouteMatcher();
  const match = matcher.calculateMatchPercentage(
    {
      pickupLocation: { lat: 37.7749, lng: -122.4194 },
      dropLocation: { lat: 37.4028, lng: -122.0869 },
      routeData: { waypoints: [] }
    },
    {
      pickupLocation: { lat: 37.7750, lng: -122.4190 },
      dropLocation: { lat: 37.4030, lng: -122.0870 }
    }
  );
  console.log(`  Match percentage: ${match}%`);
  assertTrue(match > 50, 'Partial match should have >50%');
});

test('Route Matcher: Get match quality label', () => {
  const matcher = new RouteMatcher();
  const label = matcher.getMatchQuality(85);
  assertEqual(label, 'Excellent', '85% should be Excellent');
});

console.log('\n--- Privacy Service Tests ---');

test('Privacy: Mask phone number', () => {
  const masked = PrivacyService.maskPhoneNumber('+1-555-123-4567');
  console.log(`  Masked: ${masked}`);
});

test('Privacy: Generate virtual number', () => {
  const virtual = PrivacyService.generateVirtualNumber();
  console.log(`  Virtual: ${virtual}`);
});

test('Privacy: Blurred profile', () => {
  const user = { firstName: 'John', lastName: 'Doe', profilePicture: 'url' };
  const blurred = PrivacyService.blurProfile(user, false);
  assertEqual(blurred.lastName, null, 'Last name should be null when not confirmed');
  
  const visible = PrivacyService.blurProfile(user, true);
  assertEqual(visible.lastName, 'Doe', 'Last name should be visible when confirmed');
});

test('Privacy: Generate temporary code', () => {
  const code = PrivacyService.generateTemporaryCode(6);
  assertEqual(code.length, 6, 'Code should be 6 characters');
});

console.log('\n--- Dispatch Engine Tests ---');

test('Dispatch: Score rides', () => {
  const dispatch = new DispatchEngine();
  
  const availableRides = [
    {
      pickupLocation: { coordinates: [-122.4194, 37.7749] },
      dropLocation: { coordinates: [-122.0869, 37.4028] },
      pricePerSeat: 25,
      preferences: { smoking: false, pets: false, femaleOnly: false, music: true },
      driverId: { rating: 4.5 },
      routeData: {}
    }
  ];
  
  const riderRequest = {
    pickupLocation: { coordinates: [-122.4194, 37.7749] },
    dropLocation: { coordinates: [-122.0869, 37.4028] },
    preferences: {}
  };
  
  const matches = dispatch.findMatches(availableRides, riderRequest);
  console.log(`  Best score: ${matches[0]?.score}`);
  console.log(`  Match %: ${matches[0]?.matchPercentage}`);
});

test('Dispatch: Filter by radius', () => {
  const dispatch = new DispatchEngine();
  
  const availableRides = [
    { pickupLocation: { coordinates: [-122.4194, 37.7749] } },
    { pickupLocation: { coordinates: [-122.0000, 37.0000] } }
  ];
  
  const riderLocation = { coordinates: [-122.4194, 37.7749] };
  
  const filtered = dispatch.filterByRadius(availableRides, riderLocation, 5);
  console.log(`  Rides within 5km: ${filtered.length}`);
});

console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
