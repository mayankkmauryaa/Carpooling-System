const RideService = require('../../../src/services/RideService');
const { mockRidePool, mockVehicle, mockDriver, mockUser, mockPaginatedResponse } = require('../../fixtures/mockData');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../../../src/exceptions');

jest.mock('../../../src/services/base/BaseService');
jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe.skip('RideService', () => {
  let rideService;
  let mockRideRepository;
  let mockVehicleRepository;
  let mockCacheService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRideRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByDriverId: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      count: jest.fn(),
      paginate: jest.fn(),
      searchNearbyRides: jest.fn()
    };

    mockVehicleRepository = {
      findById: jest.fn()
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    };

    rideService = new RideService(
      mockRideRepository,
      mockVehicleRepository,
      mockCacheService
    );
  });

  describe('createRide', () => {
    it('should create ride successfully', async () => {
      const rideData = {
        driverId: mockDriver.id,
        vehicleId: mockVehicle.id,
        pickupLocation: mockRidePool.pickupLocation,
        dropLocation: mockRidePool.dropLocation,
        departureTime: mockRidePool.departureTime,
        availableSeats: 3,
        pricePerSeat: 15.00
      };

      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepository.findByDriverId = jest.fn().mockResolvedValue([mockVehicle]);
      mockRideRepository.create.mockResolvedValue({
        ...mockRidePool,
        ...rideData
      });

      const result = await rideService.createRide(rideData);

      expect(mockRideRepository.create).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalledWith('rides:*');
      expect(result.availableSeats).toBe(3);
    });

    it('should throw NotFoundException for non-existent vehicle', async () => {
      mockVehicleRepository.findById.mockResolvedValue(null);

      await expect(rideService.createRide({
        driverId: mockDriver.id,
        vehicleId: 999
      })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if vehicle belongs to different driver', async () => {
      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);

      await expect(rideService.createRide({
        driverId: 999,
        vehicleId: mockVehicle.id
      })).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if seats exceed capacity', async () => {
      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepository.findByDriverId = jest.fn().mockResolvedValue([mockVehicle]);

      await expect(rideService.createRide({
        driverId: mockDriver.id,
        vehicleId: mockVehicle.id,
        availableSeats: 10
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRideById', () => {
    it('should return ride from cache if available', async () => {
      mockCacheService.get.mockResolvedValue(mockRidePool);

      const result = await rideService.getRideById(mockRidePool.id);

      expect(result).toEqual(mockRidePool);
      expect(mockRideRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRideRepository.findById.mockResolvedValue(mockRidePool);

      const result = await rideService.getRideById(mockRidePool.id);

      expect(mockRideRepository.findById).toHaveBeenCalledWith(mockRidePool.id);
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('searchRides', () => {
    it('should return cached results if available', async () => {
      const cachedRides = [mockRidePool];
      mockCacheService.get.mockResolvedValue(cachedRides);

      const result = await rideService.searchRides({
        pickupLat: 37.77,
        pickupLng: -122.42,
        dropLat: 37.80,
        dropLng: -122.27
      });

      expect(result).toEqual(cachedRides);
      expect(mockRideRepository.searchNearbyRides).not.toHaveBeenCalled();
    });

    it('should search and cache results if not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRideRepository.searchNearbyRides.mockResolvedValue([mockRidePool]);

      const result = await rideService.searchRides({
        pickupLat: 37.77,
        pickupLng: -122.42,
        dropLat: 37.80,
        dropLng: -122.27
      });

      expect(mockRideRepository.searchNearbyRides).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('updateRideStatus', () => {
    it('should update ride status', async () => {
      const activeRide = { ...mockRidePool, status: 'ACTIVE' };
      const completedRide = { ...mockRidePool, status: 'COMPLETED' };

      mockRideRepository.findById.mockResolvedValue(activeRide);
      mockRideRepository.updateById.mockResolvedValue(completedRide);

      const result = await rideService.updateRideStatus(mockRidePool.id, 'COMPLETED');

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('cancelRide', () => {
    it('should cancel ride successfully', async () => {
      const activeRide = { ...mockRidePool, status: 'ACTIVE' };
      const cancelledRide = { ...mockRidePool, status: 'CANCELLED' };

      mockRideRepository.findById.mockResolvedValue(activeRide);
      mockRideRepository.updateById.mockResolvedValue(cancelledRide);

      const result = await rideService.cancelRide(mockRidePool.id, mockDriver.id);

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRidePool);

      await expect(rideService.cancelRide(mockRidePool.id, 999))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyRides', () => {
    it('should return paginated driver rides', async () => {
      const rides = [mockRidePool];
      const paginatedResult = mockPaginatedResponse(rides, 1, 10, 1);

      mockRideRepository.paginate.mockResolvedValue(paginatedResult);

      const result = await rideService.getMyRides(mockDriver.id, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].driverId).toBe(mockDriver.id);
    });
  });
});
