const bcrypt = require('bcryptjs');

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYL0Q3Z1XWG',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'RIDER',
  profilePicture: null,
  isProfileBlurred: true,
  isActive: true,
  rating: 4.5,
  totalReviews: 10,
  googleId: null,
  isGoogleUser: false,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockDriver = {
  ...mockUser,
  id: 2,
  email: 'driver@example.com',
  role: 'DRIVER',
  rating: 4.8,
  totalReviews: 25
};

const mockAdmin = {
  ...mockUser,
  id: 3,
  email: 'admin@example.com',
  role: 'ADMIN'
};

const mockVehicle = {
  id: 1,
  driverId: 2,
  model: 'Toyota Camry',
  licensePlate: 'ABC-1234',
  color: 'Silver',
  capacity: 4,
  preferences: {
    smoking: false,
    pets: false,
    music: true
  },
  isActive: true,
  registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockRidePool = {
  id: 1,
  driverId: 2,
  vehicleId: 1,
  pickupLocation: {
    coordinates: [-122.4194, 37.7749],
    address: 'San Francisco, CA'
  },
  dropLocation: {
    coordinates: [-122.2711, 37.8044],
    address: 'Oakland, CA'
  },
  departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  availableSeats: 3,
  pricePerSeat: 15.00,
  status: 'ACTIVE',
  preferences: {
    smoking: false,
    pets: false,
    femaleOnly: false,
    music: true
  },
  routeData: null,
  bookedSeats: 0,
  passengers: '[]',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockTrip = {
  id: 1,
  ridePoolId: 1,
  driverId: 2,
  riderIds: [1],
  startTime: null,
  endTime: null,
  status: 'SCHEDULED',
  totalFare: 0,
  actualDistance: null,
  actualDuration: null,
  startLocation: null,
  endLocation: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockMessage = {
  id: 1,
  senderId: 1,
  receiverId: 2,
  ridePoolId: 1,
  content: 'Hello, is the ride still available?',
  isRead: false,
  isSystemMessage: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockReview = {
  id: 1,
  tripId: 1,
  reviewerId: 1,
  revieweeId: 2,
  type: 'RIDER_TO_DRIVER',
  rating: 5,
  comment: 'Great driver!',
  isVisible: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockRideRequest = {
  id: 1,
  ridePoolId: 1,
  riderId: 1,
  status: 'PENDING',
  pickupLocation: {
    coordinates: [-122.4194, 37.7749],
    address: 'San Francisco, CA'
  },
  dropLocation: {
    coordinates: [-122.2711, 37.8044],
    address: 'Oakland, CA'
  },
  requestedAt: new Date(),
  approvedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockSOSAlert = {
  id: 1,
  userId: 1,
  ridePoolId: 1,
  message: 'Emergency',
  location: {
    coordinates: [-122.4194, 37.7749],
    address: 'San Francisco, CA'
  },
  status: 'ACTIVE',
  acknowledgedBy: null,
  acknowledgedAt: null,
  resolvedAt: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockPaginatedResponse = (data, page = 1, limit = 10, total = 100) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  }
});

const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides
});

const hashPassword = async (password = 'password123') => {
  return bcrypt.hash(password, 12);
};

const createMockToken = (userId = 1, role = 'RIDER') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

module.exports = {
  mockUser,
  mockDriver,
  mockAdmin,
  mockVehicle,
  mockRidePool,
  mockTrip,
  mockMessage,
  mockReview,
  mockRideRequest,
  mockSOSAlert,
  mockPaginatedResponse,
  createMockUser,
  hashPassword,
  createMockToken
};
