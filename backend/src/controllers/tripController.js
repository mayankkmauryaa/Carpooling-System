const Trip = require('../models/Trip');
const RidePool = require('../models/RidePool');
const User = require('../models/User');
const logger = require('../middleware/logger');

exports.getMyTrips = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {
      $or: [
        { driverId: req.user._id },
        { riderIds: req.user._id }
      ]
    };
    
    if (status) {
      query.status = status;
    }

    const trips = await Trip.find(query)
      .populate('ridePoolId')
      .populate('driverId', 'firstName lastName rating')
      .populate('riderIds', 'firstName lastName rating')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        trips,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('ridePoolId')
      .populate('driverId', 'firstName lastName rating phone')
      .populate('riderIds', 'firstName lastName rating phone');

    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found'
      });
    }

    const isParticipant = 
      trip.driverId._id.toString() === req.user._id.toString() ||
      trip.riderIds.some(r => r._id.toString() === req.user._id.toString());

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this trip'
      });
    }

    res.json({
      status: 'success',
      data: {
        trip
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.startTrip = async (req, res, next) => {
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
        message: 'Only the driver can start the trip'
      });
    }

    if (ride.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Ride is not active'
      });
    }

    const riderIds = ride.passengers
      .filter(p => p.status === 'confirmed')
      .map(p => p.userId);

    const trip = await Trip.create({
      ridePoolId: ride._id,
      driverId: req.user._id,
      riderIds,
      startTime: new Date(),
      status: 'in-progress',
      startLocation: ride.pickupLocation,
      totalFare: ride.pricePerSeat * riderIds.length
    });

    ride.status = 'completed';
    await ride.save();

    logger.info('Trip started', { tripId: trip._id });

    res.json({
      status: 'success',
      message: 'Trip started',
      data: {
        trip
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.completeTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found'
      });
    }

    if (trip.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the driver can complete the trip'
      });
    }

    if (trip.status !== 'in-progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Trip is not in progress'
      });
    }

    const { actualDistance, actualDuration, endLocation } = req.body;

    trip.endTime = new Date();
    trip.status = 'completed';
    if (actualDistance) trip.actualDistance = actualDistance;
    if (actualDuration) trip.actualDuration = actualDuration;
    if (endLocation) trip.endLocation = endLocation;
    
    await trip.save();

    logger.info('Trip completed', { tripId: trip._id });

    res.json({
      status: 'success',
      message: 'Trip completed',
      data: {
        trip
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found'
      });
    }

    const isDriver = trip.driverId.toString() === req.user._id.toString();
    const isRider = trip.riderIds.includes(req.user._id.toString());

    if (!isDriver && !isRider) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    trip.status = 'cancelled';
    await trip.save();

    res.json({
      status: 'success',
      message: 'Trip cancelled'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTrips = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const trips = await Trip.find(query)
      .populate('ridePoolId')
      .populate('driverId', 'firstName lastName email')
      .populate('riderIds', 'firstName lastName email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Trip.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        trips,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripsByDriver = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const query = { driverId };
    
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .populate('ridePoolId')
      .populate('riderIds', 'firstName lastName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Trip.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        trips,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripsByRider = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const query = { riderIds: riderId };
    
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .populate('ridePoolId')
      .populate('driverId', 'firstName lastName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Trip.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        trips,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripByRidePool = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ ridePoolId: req.params.ridePoolId })
      .populate('ridePoolId')
      .populate('driverId', 'firstName lastName rating')
      .populate('riderIds', 'firstName lastName rating');

    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found for this ride pool'
      });
    }

    res.json({
      status: 'success',
      data: {
        trip
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripsByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const trips = await Trip.find({
      createdAt: { $gte: targetDate, $lt: nextDay }
    })
      .populate('ridePoolId')
      .populate('driverId', 'firstName lastName')
      .populate('riderIds', 'firstName lastName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Trip.countDocuments({
      createdAt: { $gte: targetDate, $lt: nextDay }
    });

    res.json({
      status: 'success',
      data: {
        trips,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const trips = await Trip.find({ status })
      .populate('ridePoolId')
      .populate('driverId', 'firstName lastName')
      .populate('riderIds', 'firstName lastName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Trip.countDocuments({ status });

    res.json({
      status: 'success',
      data: {
        trips,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingTrips = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const trips = await Trip.find({
      $or: [
        { driverId: req.user._id },
        { riderIds: req.user._id }
      ],
      status: 'scheduled'
    })
      .populate('ridePoolId')
      .populate('driverId', 'firstName lastName')
      .populate('riderIds', 'firstName lastName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('startTime');

    const total = await Trip.countDocuments({
      $or: [{ driverId: req.user._id }, { riderIds: req.user._id }],
      status: 'scheduled'
    });

    res.json({
      status: 'success',
      data: {
        trips,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripStats = async (req, res, next) => {
  try {
    const totalTrips = await Trip.countDocuments();
    const completedTrips = await Trip.countDocuments({ status: 'completed' });
    const cancelledTrips = await Trip.countDocuments({ status: 'cancelled' });
    const inProgressTrips = await Trip.countDocuments({ status: 'in-progress' });
    const scheduledTrips = await Trip.countDocuments({ status: 'scheduled' });

    const completedTripsData = await Trip.find({ status: 'completed' });
    const totalRevenue = completedTripsData.reduce((sum, t) => sum + (t.totalFare || 0), 0);
    const totalDistance = completedTripsData.reduce((sum, t) => sum + (t.actualDistance || 0), 0);

    res.json({
      status: 'success',
      data: {
        totalTrips,
        completedTrips,
        cancelledTrips,
        inProgressTrips,
        scheduledTrips,
        totalRevenue,
        totalDistance
      }
    });
  } catch (error) {
    next(error);
  }
};
