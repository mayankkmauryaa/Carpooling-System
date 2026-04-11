const bookingService = require('../services/bookingService');
const refundService = require('../services/refundService');
const priceCalculationService = require('../services/priceCalculationService');
const { executeCancellationSaga } = require('../saga/cancellationSaga');
const { executeBookingSaga } = require('../saga/bookingSaga');
const { ApiResponse, PaginatedResponse } = require('../dto');

exports.createBooking = async (req, res, next) => {
  try {
    const { ridePoolId, seatsBooked, pickupLocation, dropLocation } = req.body;
    
    const sagaContext = {
      ridePoolId,
      riderId: req.user.id,
      seatsBooked: seatsBooked || 1,
      pickupLocation,
      dropLocation,
      amount: req.body.totalAmount || 0
    };

    const result = await executeBookingSaga(sagaContext);

    if (result.success) {
      res.status(201).json(ApiResponse.created({
        bookingId: result.context.createBooking?.bookingId,
        rideRequestId: result.context.reserveSeat?.rideRequestId,
        orderId: result.context.processPayment?.orderId
      }, 'Booking created successfully via saga'));
    } else {
      res.status(400).json(ApiResponse.error(result.error || 'Booking failed'));
    }
  } catch (error) {
    next(error);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(parseInt(req.params.id));
    res.json(ApiResponse.success({ booking }));
  } catch (error) {
    next(error);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await bookingService.getBookingsByUser(req.user.id, { status, page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await executeCancellationSaga(parseInt(req.params.id), req.user.id, reason);
    
    if (result.success) {
      res.json(ApiResponse.success({
        bookingId: result.context.bookingId,
        cancelled: true,
        refundEligible: result.context.refundInfo.isEligibleForRefund,
        refundAmount: result.context.refundInfo.actualRefundToUser,
        refundPolicy: result.context.refundInfo.refundPolicy
      }, 'Booking cancelled successfully'));
    } else {
      res.status(400).json(ApiResponse.error(result.error));
    }
  } catch (error) {
    next(error);
  }
};

exports.getCancellationDetails = async (req, res, next) => {
  try {
    const details = await refundService.getCancellationDetails(parseInt(req.params.id));
    res.json(ApiResponse.success(details));
  } catch (error) {
    next(error);
  }
};

exports.getRefundStatus = async (req, res, next) => {
  try {
    const status = await refundService.getRefundStatus(parseInt(req.params.id));
    res.json(ApiResponse.success(status));
  } catch (error) {
    next(error);
  }
};

exports.calculatePrice = async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate, ridePoolId, seats } = req.query;

    if (vehicleId && startDate && endDate) {
      const price = await priceCalculationService.calculateRentalPrice(
        parseInt(vehicleId),
        startDate,
        endDate
      );
      res.json(ApiResponse.success(price));
    } else if (ridePoolId && seats) {
      const price = await priceCalculationService.calculateRidePrice(
        parseInt(ridePoolId),
        parseInt(seats)
      );
      res.json(ApiResponse.success(price));
    } else {
      res.status(400).json(ApiResponse.error('Invalid parameters'));
    }
  } catch (error) {
    next(error);
  }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, userId, ridePoolId } = req.query;
    const result = await bookingService.getAllBookings({ status, page, limit, userId, ridePoolId });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.approveBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.approveBooking(parseInt(req.params.id), req.user.id);
    res.json(ApiResponse.success({ booking }, 'Booking approved successfully'));
  } catch (error) {
    next(error);
  }
};

exports.rejectBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await bookingService.rejectBooking(parseInt(req.params.id), req.user.id, reason);
    res.json(ApiResponse.success({ booking }, 'Booking rejected'));
  } catch (error) {
    next(error);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await bookingService.updateBookingStatus(parseInt(req.params.id), status);
    res.json(ApiResponse.success({ booking }, 'Booking status updated'));
  } catch (error) {
    next(error);
  }
};

exports.getBookingStats = async (req, res, next) => {
  try {
    const stats = await bookingService.getBookingStats();
    res.json(ApiResponse.success({ stats }));
  } catch (error) {
    next(error);
  }
};
