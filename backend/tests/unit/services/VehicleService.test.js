const VehicleService = require('../../../src/services/VehicleService');
const { mockVehicle, mockDriver, mockPaginatedResponse } = require('../../fixtures/mockData');
const { NotFoundException, ForbiddenException, ConflictException } = require('../../../src/exceptions');

jest.mock('../../../src/services/base/BaseService');
jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('VehicleService', () => {
  let vehicleService;
  let mockVehicleRepository;
  let mockCacheService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVehicleRepository = {
      findById: jest.fn(),
      findByDriverId: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      count: jest.fn(),
      paginate: jest.fn()
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    };

    vehicleService = new VehicleService(mockVehicleRepository, mockCacheService);
  });

  describe('createVehicle', () => {
    it('should create vehicle successfully', async () => {
      const vehicleData = {
        model: 'Toyota Camry',
        licensePlate: 'XYZ-9999',
        color: 'Blue',
        capacity: 4,
        driverId: mockDriver.id
      };

      mockVehicleRepository.create.mockResolvedValue({
        ...mockVehicle,
        ...vehicleData
      });

      const result = await vehicleService.createVehicle(vehicleData);

      expect(mockVehicleRepository.create).toHaveBeenCalled();
      expect(result.model).toBe('Toyota Camry');
    });

    it('should check for duplicate license plate', async () => {
      mockVehicleRepository.create.mockRejectedValue(
        new Error('Unique constraint failed')
      );

      await expect(vehicleService.createVehicle({
        licensePlate: 'EXISTING-123'
      })).rejects.toThrow();
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle', async () => {
      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);

      const result = await vehicleService.getVehicleById(mockVehicle.id);

      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException for non-existent vehicle', async () => {
      mockVehicleRepository.findById.mockResolvedValue(null);

      await expect(vehicleService.getVehicleById(999))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('getVehiclesByDriver', () => {
    it('should return driver vehicles', async () => {
      const vehicles = [mockVehicle];
      mockVehicleRepository.findByDriverId.mockResolvedValue(vehicles);

      const result = await vehicleService.getVehiclesByDriver(mockDriver.id);

      expect(result).toHaveLength(1);
      expect(mockVehicleRepository.findByDriverId).toHaveBeenCalledWith(mockDriver.id);
    });

    it('should return empty array for driver with no vehicles', async () => {
      mockVehicleRepository.findByDriverId.mockResolvedValue([]);

      const result = await vehicleService.getVehiclesByDriver(999);

      expect(result).toEqual([]);
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle successfully', async () => {
      const updateData = { color: 'Red' };
      const updatedVehicle = { ...mockVehicle, ...updateData };

      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepository.updateById.mockResolvedValue(updatedVehicle);

      const result = await vehicleService.updateVehicle(
        mockVehicle.id,
        mockDriver.id,
        updateData
      );

      expect(result.color).toBe('Red');
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);

      await expect(vehicleService.updateVehicle(
        mockVehicle.id,
        999,
        { color: 'Red' }
      )).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent vehicle', async () => {
      mockVehicleRepository.findById.mockResolvedValue(null);

      await expect(vehicleService.updateVehicle(999, mockDriver.id, {}))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleVehicleStatus', () => {
    it('should toggle vehicle status', async () => {
      const activeVehicle = { ...mockVehicle, isActive: true };
      const inactiveVehicle = { ...mockVehicle, isActive: false };

      mockVehicleRepository.findById.mockResolvedValue(activeVehicle);
      mockVehicleRepository.updateById.mockResolvedValue(inactiveVehicle);

      const result = await vehicleService.toggleVehicleStatus(mockVehicle.id);

      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle successfully', async () => {
      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepository.deleteById.mockResolvedValue(mockVehicle);

      await vehicleService.deleteVehicle(mockVehicle.id, mockDriver.id);

      expect(mockVehicleRepository.deleteById).toHaveBeenCalledWith(mockVehicle.id);
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);

      await expect(vehicleService.deleteVehicle(mockVehicle.id, 999))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getActiveVehicles', () => {
    it('should return only active vehicles', async () => {
      const vehicles = [mockVehicle];
      const paginatedResult = mockPaginatedResponse(vehicles, 1, 10, 1);

      mockVehicleRepository.paginate.mockResolvedValue(paginatedResult);

      const result = await vehicleService.getActiveVehicles({ page: 1, limit: 10 });

      expect(result.data[0].isActive).toBe(true);
    });
  });
});
