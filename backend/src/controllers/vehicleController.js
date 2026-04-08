const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

exports.createVehicle = async (req, res, next) => {
  try {
    const driver = await User.findById(req.user._id);
    
    if (driver.role !== 'driver') {
      return res.status(403).json({
        status: 'error',
        message: 'Only drivers can add vehicles'
      });
    }

    const vehicle = await Vehicle.create({
      ...req.body,
      driverId: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        vehicle
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ driverId: req.user._id });

    res.json({
      status: 'success',
      data: {
        vehicles
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        vehicle
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }

    if (vehicle.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this vehicle'
      });
    }

    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: {
        vehicle
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }

    if (vehicle.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this vehicle'
      });
    }

    await vehicle.deleteOne();

    res.json({
      status: 'success',
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllVehicles = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive, search, model, color } = req.query;
    const query = {};
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (model) query.model = { $regex: model, $options: 'i' };
    if (color) query.color = { $regex: color, $options: 'i' };
    if (search) {
      query.$or = [
        { model: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate('driverId', 'firstName lastName email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Vehicle.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        vehicles,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleVehicleStatus = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }

    if (vehicle.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();

    res.json({
      status: 'success',
      data: {
        vehicle
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getVehiclesByDriver = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const vehicles = await Vehicle.find({ driverId })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Vehicle.countDocuments({ driverId });

    res.json({
      status: 'success',
      data: {
        vehicles,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
