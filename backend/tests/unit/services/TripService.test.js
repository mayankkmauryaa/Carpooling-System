const TripService = require('../../../src/services/TripService');
const { mockTrip, mockRidePool, mockDriver, mockUser, mockPaginatedResponse } = require('../../fixtures/mockData');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../../../src/exceptions');

jest.mock('../../../src/services/base/BaseService');
jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('TripService', () => {
  let tripService;
  let mockTripRepository;
  let mockRideRepository;
  let mockCacheService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTripRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByDriverId: jest.fn(),
      findByRiderId: jest.fn(),
      findByRidePoolId: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      count: jest.fn(),
      paginate: jest.fn()
    };

    mockRideRepository = {
      findById: jest.fn()
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    };

    tripService = new TripService(
      mockTripRepository,
      mockRideRepository,
      mockCacheService
    );
  });

  describe('createTrip', () => {
    it('should create trip successfully', async () => {
      const tripData = {
        ridePoolId: mockRidePool.id,
        driverId: mockDriver.id,
        riderIds: [mockUser.id]
      };

      mockTripRepository.create.mockResolvedValue({
        ...mockTrip,
        ...tripData,
        status: 'SCHEDULED'
      });

      const result = await tripService.createTrip(tripData);

      expect(mockTripRepository.create).toHaveBeenCalled();
      expect(result.status).toBe('SCHEDULED');
    });
  });

  describe('startTrip', () => {
    it('should start scheduled trip', async () => {
      const scheduledTrip = { ...mockTrip, status: 'SCHEDULED' };
      const inProgressTrip = { ...mockTrip, status: 'IN_PROGRESS', startTime: new Date() };

      mockTripRepository.findById.mockResolvedValue(scheduledTrip);
      mockTripRepository.updateById.mockResolvedValue(inProgressTrip);

      const result = await tripService.startTrip(mockTrip.id, mockDriver.id);

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should throw ForbiddenException if not driver', async () => {
      mockTripRepository.findById.mockResolvedValue(mockTrip);

      await expect(tripService.startTrip(mockTrip.id, 999))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if trip already started', async () => {
      const inProgressTrip = { ...mockTrip, status: 'IN_PROGRESS' };
      mockTripRepository.findById.mockResolvedValue(inProgressTrip);

      await expect(tripService.startTrip(mockTrip.id, mockDriver.id))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent trip', async () => {
      mockTripRepository.findById.mockResolvedValue(null);

      await expect(tripService.startTrip(999, mockDriver.id))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('completeTrip', () => {
    it('should complete trip and calculate fare', async () => {
      const inProgressTrip = { 
        ...mockTrip, 
        status: 'IN_PROGRESS',
        riderIds: [mockUser.id, mockUser.id + 1]
      };
      const completedTrip = {
        ...mockTrip,
        status: 'COMPLETED',
        totalFare: 30.00
      };

      mockTripRepository.findById.mockResolvedValue(inProgressTrip);
      mockRideRepository.findById.mockResolvedValue(mockRidePool);
      mockTripRepository.updateById.mockResolvedValue(completedTrip);

      const result = await tripService.completeTrip(
        mockTrip.id,
        mockDriver.id,
        { actualDistance: 10, actualDuration: 30 }
      );

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw BadRequestException if trip not in progress', async () => {
      mockTripRepository.findById.mockResolvedValue(mockTrip);

      await expect(tripService.completeTrip(mockTrip.id, mockDriver.id, {}))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelTrip', () => {
    it('should cancel trip', async () => {
      const scheduledTrip = { ...mockTrip, status: 'SCHEDULED' };
      const cancelledTrip = { ...mockTrip, status: 'CANCELLED' };

      mockTripRepository.findById.mockResolvedValue(scheduledTrip);
      mockTripRepository.updateById.mockResolvedValue(cancelledTrip);

      const result = await tripService.cancelTrip(mockTrip.id, mockDriver.id);

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw ForbiddenException if not participant', async () => {
      mockTripRepository.findById.mockResolvedValue(mockTrip);

      await expect(tripService.cancelTrip(mockTrip.id, 999))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyTrips', () => {
    it('should return user trips', async () => {
      const trips = [mockTrip];
      const paginatedResult = mockPaginatedResponse(trips, 1, 10, 1);

      mockTripRepository.paginate.mockResolvedValue(paginatedResult);

      const result = await tripService.getMyTrips(mockUser.id, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getAllTrips', () => {
    it('should return all trips for admin', async () => {
      const trips = [mockTrip];
      const paginatedResult = mockPaginatedResponse(trips, 1, 10, 1);

      mockTripRepository.paginate.mockResolvedValue(paginatedResult);

      const result = await tripService.getAllTrips({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by status', async () => {
      const completedTrips = [{ ...mockTrip, status: 'COMPLETED' }];
      mockTripRepository.paginate.mockResolvedValue(mockPaginatedResponse(completedTrips, 1, 10, 1));

      const result = await tripService.getAllTrips({ status: 'COMPLETED', page: 1, limit: 10 });

      expect(mockTripRepository.paginate).toHaveBeenCalled();
    });
  });

  describe('getTripsByDriver', () => {
    it('should return driver trips', async () => {
      const trips = [mockTrip];
      mockTripRepository.paginate.mockResolvedValue(mockPaginatedResponse(trips, 1, 10, 1));

      const result = await tripService.getTripsByDriver(mockDriver.id, { page: 1, limit: 10 });

      expect(result.data[0].driverId).toBe(mockDriver.id);
    });
  });

  describe('getTripStats', () => {
    it('should return trip statistics', async () => {
      mockTripRepository.count.mockResolvedValue(10);

      const result = await tripService.getTripStats();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('completed');
      expect(result).toHaveProperty('cancelled');
    });
  });
});
