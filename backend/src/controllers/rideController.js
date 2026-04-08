const RidePool = require('../models/RidePool');
const RideRequest = require('../models/RideRequest');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { calculateDistance, calculateRouteMatchPercentage, filterByPreferences, generateS2CellId, paginate } = require('../utils/helpers');
const logger = require('../middleware/logger');

exports.createRide = async (req, res, next) => {
  try {
    const driver = await User.findById(req.user._id);
    
    if (driver.role !== 'driver') {
      return res.status(403).json({
        status: 'error',
        message: 'Only drivers can create rides'
      });
    }

    const vehicle = await Vehicle.findById(req.body.vehicleId);
    if (!vehicle || vehicle.driverId.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid vehicle'
      });
    }

    const rideData = {
      ...req.body,
      driverId: req.user._id,
      pickupLocation: {
        ...req.body.pickupLocation,
        s2CellId: generateS2CellId(req.body.pickupLocation.coordinates)
      },
      dropLocation: {
        ...req.body.dropLocation,
        s2CellId: generateS2CellId(req.body.dropLocation.coordinates)
      }
    };

    const ride = await RidePool.create(rideData);

    logger.info('Ride created', { rideId: ride._id, driverId: req.user._id });

    res.status(201).json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyRides = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { driverId: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const rides = await paginate(RidePool.find(query).populate('vehicleId'), page, limit);
    const total = await RidePool.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        rides,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRideById = async (req, res, next) => {
  try {
    const ride = await RidePool.findById(req.params.id)
      .populate('driverId', 'firstName lastName rating totalReviews')
      .populate('vehicleId');

    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'Ride not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRide = async (req, res, next) => {
  try {
    let ride = await RidePool.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'Ride not found'
      });
    }

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this ride'
      });
    }

    ride = await RidePool.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelRide = async (req, res, next) => {
  try {
    const ride = await RidePool.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'Ride not found'
      });
    }

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to cancel this ride'
      });
    }

    ride.status = 'cancelled';
    await ride.save();

    await RideRequest.updateMany(
      { ridePoolId: ride._id, status: 'pending' },
      { status: 'cancelled' }
    );

    logger.info('Ride cancelled', { rideId: ride._id });

    res.json({
      status: 'success',
      message: 'Ride cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getRideRequests = async (req, res, next) => {
  try {
    const requests = await RideRequest.find({ ridePoolId: req.params.id })
      .populate('riderId', 'firstName lastName rating');

    res.json({
      status: 'success',
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.respondToRequest = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const { riderId } = req.params;

    const ride = await RidePool.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'Ride not found'
      });
    }

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    const request = await RideRequest.findOne({
      ridePoolId: req.params.id,
      riderId
    });

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    if (action === 'approve') {
      if (ride.availableSeats < 1) {
        return res.status(400).json({
          status: 'error',
          message: 'No available seats'
        });
      }

      request.status = 'approved';
      request.approvedAt = new Date();
      await request.save();

      ride.availableSeats -= 1;
      ride.bookedSeats += 1;
      ride.passengers.push({
        userId: riderId,
        status: 'confirmed'
      });
      await ride.save();
    } else if (action === 'reject') {
      request.status = 'rejected';
      request.rejectedAt = new Date();
      request.rejectionReason = reason || 'Driver rejected your request';
      await request.save();
    }

    logger.info(`Request ${action}ed`, { requestId: request._id });

    res.json({
      status: 'success',
      message: `Request ${action === 'approve' ? 'approved' : 'rejected'}`
    });
  } catch (error) {
    next(error);
  }
};

exports.searchRides = async (req, res, next) => {
  try {
    const {
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      radius = 10,
      departureDate,
      availableSeats = 1,
      preferences,
      page = 1,
      limit = 10
    } = req.query;

    const query = {
      status: 'active',
      departureTime: { $gte: new Date() },
      availableSeats: { $gte: parseInt(availableSeats) }
    };

    if (departureDate) {
      const date = new Date(departureDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.departureTime = {
        $gte: date,
        $lt: nextDay
      };
    }

    if (pickupLat && pickupLng) {
      query.pickupLocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(pickupLng), parseFloat(pickupLat)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      };
    }

    let rides = await RidePool.find(query)
      .populate('driverId', 'firstName lastName rating totalReviews profilePicture isProfileBlurred')
      .populate('vehicleId', 'model color licensePlate');

    if (pickupLat && pickupLng && dropLat && dropLng) {
      const riderPickup = [parseFloat(pickupLng), parseFloat(pickupLat)];
      const riderDrop = [parseFloat(dropLng), parseFloat(dropLat)];

      rides = rides.map(ride => {
        const driverPickup = ride.pickupLocation.coordinates;
        const driverDrop = ride.dropLocation.coordinates;
        
        const matchPercentage = calculateRouteMatchPercentage(
          driverPickup,
          driverDrop,
          riderPickup,
          riderDrop
        );

        return {
          ...ride.toObject(),
          matchPercentage
        };
      });

      rides = rides.filter(ride => ride.matchPercentage >= 30);

      if (preferences) {
        const pref = JSON.parse(preferences);
        rides = rides.filter(ride => filterByPreferences(ride.preferences, pref));
      }

      rides.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    const total = rides.length;
    const startIndex = (page - 1) * limit;
    const paginatedRides = rides.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      status: 'success',
      data: {
        rides: paginatedRides,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const rides = await RidePool.find({
      status: 'active',
      departureTime: { $gte: new Date() },
      availableSeats: { $gte: 1 }
    })
      .populate('driverId', 'firstName rating')
      .populate('vehicleId', 'model color')
      .sort('-departureTime')
      .limit(10);

    res.json({
      status: 'success',
      data: {
        recommendations: rides
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.requestToJoin = async (req, res, next) => {
  try {
    const ride = await RidePool.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'Ride not found'
      });
    }

    if (ride.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Ride is not available'
      });
    }

    const existingRequest = await RideRequest.findOne({
      ridePoolId: req.params.id,
      riderId: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a request for this ride'
      });
    }

    const request = await RideRequest.create({
      ridePoolId: req.params.id,
      riderId: req.user._id,
      pickupLocation: req.body.pickupLocation,
      dropLocation: req.body.dropLocation
    });

    logger.info('Join request created', { requestId: request._id });

    res.status(201).json({
      status: 'success',
      message: 'Join request sent',
      data: {
        requestId: request._id,
        status: request.status
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await RideRequest.find({ riderId: req.user._id })
      .populate({
        path: 'ridePoolId',
        populate: [
          { path: 'driverId', select: 'firstName lastName rating' },
          { path: 'vehicleId', select: 'model color' }
        ]
      })
      .sort('-requestedAt');

    res.json({
      status: 'success',
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelJoinRequest = async (req, res, next) => {
  try {
    const request = await RideRequest.findOne({
      ridePoolId: req.params.id,
      riderId: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({
      status: 'success',
      message: 'Join request cancelled'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllRides = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, minSeats, maxPrice } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (minSeats) query.availableSeats = { $gte: parseInt(minSeats) };
    if (maxPrice) query.pricePerSeat = { $lte: parseFloat(maxPrice) };
    if (search) {
      query.$or = [
        { 'pickupLocation.address': { $regex: search, $options: 'i' } },
        { 'dropLocation.address': { $regex: search, $options: 'i' } }
      ];
    }

    const rides = await RidePool.find(query)
      .populate('driverId', 'firstName lastName rating')
      .populate('vehicleId', 'model color licensePlate')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await RidePool.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        rides,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRideStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const ride = await RidePool.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'Ride not found'
      });
    }

    ride.status = status;
    await ride.save();

    res.json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRidesByDriver = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const query = { driverId };
    
    if (status) query.status = status;

    const rides = await RidePool.find(query)
      .populate('vehicleId', 'model color')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await RidePool.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        rides,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRidesByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const rides = await RidePool.find({
      departureTime: {
        $gte: targetDate,
        $lt: nextDay
      }
    })
      .populate('driverId', 'firstName lastName rating')
      .populate('vehicleId', 'model color')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('departureTime');

    const total = await RidePool.countDocuments({
      departureTime: { $gte: targetDate, $lt: nextDay }
    });

    res.json({
      status: 'success',
      data: {
        rides,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingRides = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const rides = await RidePool.find({
      status: 'active',
      departureTime: { $gte: new Date() }
    })
      .populate('driverId', 'firstName lastName rating')
      .populate('vehicleId', 'model color')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('departureTime');

    const total = await RidePool.countDocuments({
      status: 'active',
      departureTime: { $gte: new Date() }
    });

    res.json({
      status: 'success',
      data: {
        rides,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getNearbyRides = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const rides = await RidePool.find({
      status: 'active',
      departureTime: { $gte: new Date() },
      pickupLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    })
      .populate('driverId', 'firstName lastName rating')
      .populate('vehicleId', 'model color')
      .limit(20);

    res.json({
      status: 'success',
      data: {
        rides
      }
    });
  } catch (error) {
    next(error);
  }
};
