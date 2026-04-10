# Carpooling System - Unit Tests

> Jest test suite for backend services, repositories, and utilities

## Setup

```bash
cd backend
npm install --save-dev jest @types/jest
npx jest --init
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js

# Run in watch mode
npm test -- --watch
```

---

## Test Structure

```
backend/tests/
├── unit/
│   ├── services/
│   │   ├── authService.test.js
│   │   ├── rideService.test.js
│   │   └── tripService.test.js
│   ├── repositories/
│   │   └── userRepository.test.js
│   └── utils/
│       ├── distance.test.js
│       ├── routeMatcher.test.js
│       └── validators.test.js
├── integration/
│   └── api/
│       ├── auth.test.js
│       ├── rides.test.js
│       └── trips.test.js
└── setup.js
```

---

## Unit Tests

### 1. Authentication Service Tests

```javascript
// tests/unit/services/authService.test.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      // Act
      const result = await authService.register(userData);
      
      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      // Mock repository to return existing user
      userRepository.findByEmail = jest.fn().mockResolvedValue({ id: 1, email: userData.email });
      
      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(ConflictException);
    });

    it('should hash password before saving', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      // Act
      await authService.register(userData);
      
      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true
      };
      
      userRepository.findByEmailWithPassword = jest.fn().mockResolvedValue(user);
      
      // Act
      const result = await authService.login('test@example.com', 'password123');
      
      // Assert
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(user.email);
    });

    it('should throw AuthException for invalid email', async () => {
      // Arrange
      userRepository.findByEmailWithPassword = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.login('invalid@example.com', 'password123'))
        .rejects.toThrow(AuthException);
    });

    it('should throw AuthException for invalid password', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 12),
        isActive: true
      };
      
      userRepository.findByEmailWithPassword = jest.fn().mockResolvedValue(user);
      
      // Act & Assert
      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow(AuthException);
    });

    it('should throw AuthException for inactive account', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        isActive: false
      };
      
      userRepository.findByEmailWithPassword = jest.fn().mockResolvedValue(user);
      
      // Act & Assert
      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow(AuthException);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      // Act
      const token = authService.generateToken(1);
      
      // Assert
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should include userId in token payload', () => {
      // Act
      const token = authService.generateToken(123);
      const decoded = jwt.decode(token);
      
      // Assert
      expect(decoded.userId).toBe(123);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      // Arrange
      const token = authService.generateToken(1);
      
      // Act
      const decoded = authService.verifyToken(token);
      
      // Assert
      expect(decoded.userId).toBe(1);
    });

    it('should throw AuthException for expired token', () => {
      // Arrange
      const expiredToken = jwt.sign({ userId: 1 }, 'secret', { expiresIn: '-1h' });
      
      // Act & Assert
      expect(() => authService.verifyToken(expiredToken)).toThrow(AuthException);
    });

    it('should throw AuthException for invalid token', () => {
      // Act & Assert
      expect(() => authService.verifyToken('invalid.token.here')).toThrow(AuthException);
    });
  });

  describe('googleAuth', () => {
    it('should create new user for first-time Google login', async () => {
      // Arrange
      const googlePayload = {
        email: 'google@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
        sub: 'google_12345'
      };
      
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);
      userRepository.create = jest.fn().mockResolvedValue({
        id: 1,
        ...googlePayload,
        isGoogleUser: true
      });
      
      // Mock Google token verification
      googleClient.verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => googlePayload
      });
      
      // Act
      const result = await authService.googleAuth('google_id_token');
      
      // Assert
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('isNewUser', true);
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should link Google account for existing user', async () => {
      // Arrange
      const existingUser = {
        id: 1,
        email: 'existing@example.com',
        password: 'hashed_password',
        isGoogleUser: false
      };
      
      const googlePayload = {
        email: 'existing@example.com',
        sub: 'google_12345'
      };
      
      userRepository.findByEmail = jest.fn().mockResolvedValue(existingUser);
      userRepository.updateById = jest.fn().mockResolvedValue(true);
      userRepository.findById = jest.fn().mockResolvedValue({
        ...existingUser,
        googleId: 'google_12345',
        isGoogleUser: true
      });
      
      // Mock Google token verification
      googleClient.verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => googlePayload
      });
      
      // Act
      const result = await authService.googleAuth('google_id_token');
      
      // Assert
      expect(result).toHaveProperty('isNewUser', false);
      expect(result).toHaveProperty('token');
    });
  });
});
```

---

### 2. Distance Utility Tests

```javascript
// tests/unit/utils/distance.test.js

const { calculateDistance, isWithinRadius, haversineDistance } = require('../../src/utils/distance');

describe('Distance Utilities', () => {
  describe('haversineDistance', () => {
    it('should return 0 for same coordinates', () => {
      const result = haversineDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(result).toBe(0);
    });

    it('should calculate distance between SF and Palo Alto correctly', () => {
      // SF: 37.7749, -122.4194
      // Palo Alto: 37.4028, -122.0869
      const result = haversineDistance(37.7749, -122.4194, 37.4028, -122.0869);
      
      // Should be approximately 46 km
      expect(result).toBeGreaterThan(45);
      expect(result).toBeLessThan(47);
    });

    it('should calculate distance between NYC and LA correctly', () => {
      // NYC: 40.7128, -74.0060
      // LA: 34.0522, -118.2437
      const result = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
      
      // Should be approximately 3940 km
      expect(result).toBeGreaterThan(3900);
      expect(result).toBeLessThan(4000);
    });

    it('should handle negative coordinates', () => {
      const result = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631);
      expect(result).toBeGreaterThan(700);
      expect(result).toBeLessThan(750);
    });
  });

  describe('calculateDistance', () => {
    it('should accept objects with lat/lng properties', () => {
      const pickup = { lat: 37.7749, lng: -122.4194 };
      const drop = { lat: 37.4028, lng: -122.0869 };
      
      const result = calculateDistance(pickup, drop);
      expect(result).toBeGreaterThan(45);
    });

    it('should accept objects with coordinates array', () => {
      const pickup = { coordinates: [-122.4194, 37.7749] }; // [lng, lat]
      const drop = { coordinates: [-122.0869, 37.4028] };
      
      const result = calculateDistance(pickup, drop);
      expect(result).toBeGreaterThan(45);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for point within radius', () => {
      const center = { lat: 37.7749, lng: -122.4194 };
      const point = { lat: 37.7849, lng: -122.4094 }; // ~1.5km away
      
      expect(isWithinRadius(center, point, 5)).toBe(true);
    });

    it('should return false for point outside radius', () => {
      const center = { lat: 37.7749, lng: -122.4194 };
      const point = { lat: 37.4028, lng: -122.0869 }; // ~46km away
      
      expect(isWithinRadius(center, point, 5)).toBe(false);
    });

    it('should return true for point exactly on radius boundary', () => {
      const center = { lat: 37.7749, lng: -122.4194 };
      const point = { lat: 37.7849, lng: -122.4194 }; // ~1.1km away
      
      expect(isWithinRadius(center, point, 1.1)).toBe(true);
    });
  });
});
```

---

### 3. Route Matcher Tests

```javascript
// tests/unit/utils/routeMatcher.test.js

const { matchRoutes, calculateMatchScore, findNearbyRides } = require('../../src/utils/routeMatcher');

describe('Route Matcher', () => {
  const mockRides = [
    {
      id: 1,
      pickupLocation: { coordinates: [-122.4194, 37.7749], address: 'SF' },
      dropLocation: { coordinates: [-122.0869, 37.4028], address: 'PA' },
      availableSeats: 3,
      pricePerSeat: 25
    },
    {
      id: 2,
      pickupLocation: { coordinates: [-122.2711, 37.8716], address: 'Berkeley' },
      dropLocation: { coordinates: [-122.2711, 37.8044], address: 'Oakland' },
      availableSeats: 2,
      pricePerSeat: 20
    },
    {
      id: 3,
      pickupLocation: { coordinates: [-118.2437, 34.0522], address: 'LA' },
      dropLocation: { coordinates: [-117.1611, 32.7157], address: 'San Diego' },
      availableSeats: 4,
      pricePerSeat: 30
    }
  ];

  describe('matchRoutes', () => {
    it('should return rides sorted by match score', () => {
      const searchPickup = { lat: 37.77, lng: -122.42 };
      const searchDrop = { lat: 37.40, lng: -122.09 };
      
      const result = matchRoutes(searchPickup, searchDrop, mockRides);
      
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1); // SF to PA should be best match
    });

    it('should filter rides outside maximum radius', () => {
      const searchPickup = { lat: 37.77, lng: -122.42 };
      const searchDrop = { lat: 37.40, lng: -122.09 };
      
      const result = matchRoutes(searchPickup, searchDrop, mockRides, {
        maxPickupDistance: 5,
        maxDropDistance: 5
      });
      
      expect(result).toHaveLength(1); // Only SF to PA
      expect(result[0].id).toBe(1);
    });

    it('should return empty array for no matches', () => {
      const searchPickup = { lat: 40.71, lng: -74.01 }; // NYC
      const searchDrop = { lat: 34.05, lng: -118.24 }; // LA
      
      const result = matchRoutes(searchPickup, searchDrop, mockRides);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateMatchScore', () => {
    it('should return high score for close pickup and drop', () => {
      const pickup = { lat: 37.7749, lng: -122.4194 };
      const drop = { lat: 37.4028, lng: -122.0869 };
      const ridePickup = { lat: 37.7749, lng: -122.4194 };
      const rideDrop = { lat: 37.4028, lng: -122.0869 };
      
      const score = calculateMatchScore(pickup, drop, ridePickup, rideDrop);
      
      expect(score).toBeGreaterThan(90);
    });

    it('should return low score for far pickup and drop', () => {
      const pickup = { lat: 37.7749, lng: -122.4194 };
      const drop = { lat: 37.4028, lng: -122.0869 };
      const ridePickup = { lat: 34.0522, lng: -118.2437 }; // LA
      const rideDrop = { lat: 32.7157, lng: -117.1611 }; // San Diego
      
      const score = calculateMatchScore(pickup, drop, ridePickup, rideDrop);
      
      expect(score).toBeLessThan(20);
    });
  });

  describe('findNearbyRides', () => {
    it('should find rides within pickup radius', () => {
      const center = { lat: 37.77, lng: -122.42 };
      const radius = 10; // km
      
      const result = findNearbyRides(center, mockRides, radius);
      
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].pickupDistance).toBeLessThanOrEqual(radius);
    });

    it('should sort by distance', () => {
      const center = { lat: 37.77, lng: -122.42 };
      const radius = 50;
      
      const result = findNearbyRides(center, mockRides, radius);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].pickupDistance).toBeLessThanOrEqual(result[i].pickupDistance);
      }
    });
  });
});
```

---

### 4. Validation Tests

```javascript
// tests/unit/utils/validators.test.js

describe('Joi Validation Schemas', () => {
  describe('Auth Validators', () => {
    const { registerSchema, loginSchema } = require('../../src/validators/auth.validator');

    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com'
      };
      
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThan(1);
    });
  });

  describe('Ride Validators', () => {
    const { createRideSchema } = require('../../src/validators/ride.validator');

    it('should validate correct ride data', () => {
      const validData = {
        vehicleId: 1,
        pickupLocation: {
          coordinates: [-122.4194, 37.7749],
          address: 'San Francisco, CA'
        },
        dropLocation: {
          coordinates: [-122.0869, 37.4028],
          address: 'Palo Alto, CA'
        },
        departureTime: '2026-04-15T09:00:00Z',
        availableSeats: 3,
        pricePerSeat: 25.00
      };
      
      const { error } = createRideSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid coordinates', () => {
      const invalidData = {
        vehicleId: 1,
        pickupLocation: {
          coordinates: [200, 100], // Invalid lat/lng
          address: 'SF'
        },
        dropLocation: {
          coordinates: [-122.0869, 37.4028],
          address: 'PA'
        },
        departureTime: '2026-04-15T09:00:00Z',
        availableSeats: 3,
        pricePerSeat: 25.00
      };
      
      const { error } = createRideSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject negative seats', () => {
      const invalidData = {
        vehicleId: 1,
        pickupLocation: { coordinates: [-122.4194, 37.7749], address: 'SF' },
        dropLocation: { coordinates: [-122.0869, 37.4028], address: 'PA' },
        departureTime: '2026-04-15T09:00:00Z',
        availableSeats: -1,
        pricePerSeat: 25.00
      };
      
      const { error } = createRideSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
```

---

### 5. Service Tests

```javascript
// tests/unit/services/rideService.test.js

describe('RideService', () => {
  let rideService;
  let mockRideRepository;
  let mockVehicleRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRideRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn()
    };
    
    mockVehicleRepository = {
      findById: jest.fn()
    };
    
    rideService = new RideService(mockRideRepository, mockVehicleRepository);
  });

  describe('createRide', () => {
    it('should create ride when vehicle belongs to driver', async () => {
      // Arrange
      const driverId = 1;
      const vehicleId = 1;
      const rideData = {
        vehicleId,
        pickupLocation: { coordinates: [-122.4194, 37.7749], address: 'SF' },
        dropLocation: { coordinates: [-122.0869, 37.4028], address: 'PA' },
        departureTime: '2026-04-15T09:00:00Z',
        availableSeats: 3,
        pricePerSeat: 25.00
      };
      
      const vehicle = { id: vehicleId, driverId, capacity: 4 };
      const createdRide = { id: 1, ...rideData, driverId, status: 'ACTIVE' };
      
      mockVehicleRepository.findById.mockResolvedValue(vehicle);
      mockRideRepository.create.mockResolvedValue(createdRide);
      
      // Act
      const result = await rideService.createRide(driverId, rideData);
      
      // Assert
      expect(result).toEqual(createdRide);
      expect(mockVehicleRepository.findById).toHaveBeenCalledWith(vehicleId);
      expect(mockRideRepository.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when vehicle belongs to another driver', async () => {
      // Arrange
      const driverId = 1;
      const vehicleId = 1;
      const rideData = { vehicleId, /* ... */ };
      
      const vehicle = { id: vehicleId, driverId: 2 }; // Different driver
      
      mockVehicleRepository.findById.mockResolvedValue(vehicle);
      
      // Act & Assert
      await expect(rideService.createRide(driverId, rideData))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      // Arrange
      mockVehicleRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(rideService.createRide(1, { vehicleId: 999 }))
        .rejects.toThrow(NotFoundException);
    });

    it('should validate seats do not exceed vehicle capacity', async () => {
      // Arrange
      const driverId = 1;
      const vehicleId = 1;
      const rideData = {
        vehicleId,
        availableSeats: 10, // Exceeds capacity
        /* ... */
      };
      
      const vehicle = { id: vehicleId, driverId, capacity: 4 };
      
      mockVehicleRepository.findById.mockResolvedValue(vehicle);
      
      // Act & Assert
      await expect(rideService.createRide(driverId, rideData))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('searchRides', () => {
    it('should return rides matching search criteria', async () => {
      // Arrange
      const searchParams = {
        pickupLat: 37.77,
        pickupLng: -122.42,
        dropLat: 37.40,
        dropLng: -122.09,
        radius: 15,
        departureDate: '2026-04-15',
        availableSeats: 2
      };
      
      const mockRides = [
        { id: 1, availableSeats: 3 },
        { id: 2, availableSeats: 2 }
      ];
      
      mockRideRepository.search.mockResolvedValue(mockRides);
      
      // Act
      const result = await rideService.searchRides(searchParams);
      
      // Assert
      expect(result).toEqual(mockRides);
      expect(mockRideRepository.search).toHaveBeenCalledWith(expect.objectContaining({
        pickupLat: 37.77,
        dropLat: 37.40
      }));
    });
  });
});
```

---

## Integration Tests

### API Integration Tests

```javascript
// tests/integration/api/auth.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test_${Date.now()}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      const email = `duplicate_${Date.now()}@example.com`;
      
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
      
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
      
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register
      const email = `login_${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
      
      // Then login
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'password123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user data for authenticated request', async () => {
      // Register and get token
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `me_${Date.now()}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
      
      const token = registerRes.body.data.token;
      
      // Get current user
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('email');
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');
      
      expect(res.status).toBe(401);
    });
  });
});
```

---

## Test Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 10000,
  verbose: true
};
```

---

## Test Helpers

```javascript
// tests/setup.js

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Helper to generate test JWT
const generateTestToken = (userId, role = 'RIDER') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
};

global.generateTestToken = generateTestToken;
```
