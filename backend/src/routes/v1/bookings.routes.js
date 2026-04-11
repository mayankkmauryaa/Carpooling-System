const express = require('express');
const router = express.Router();
const validate = require('../../middleware/common/validate');
const { bookingValidator } = require('../../validators');
const { auth, requireRole } = require('../../middleware/auth');
const bookingController = require('../../controllers/bookingController');

router.post('/', auth, validate(bookingValidator.createBooking), bookingController.createBooking);

router.get('/my-bookings', auth, bookingController.getMyBookings);

router.get('/calculate-price', bookingController.calculatePrice);

router.get('/:id', auth, validate(bookingValidator.bookingIdParam), bookingController.getBookingById);

router.get('/:id/cancellation', auth, bookingController.getCancellationDetails);

router.get('/:id/refund-status', auth, bookingController.getRefundStatus);

router.put('/:id/cancel', auth, validate(bookingValidator.bookingIdParam), bookingController.cancelBooking);

router.put('/:id/status', auth, requireRole('ADMIN'), validate(bookingValidator.updateStatus), bookingController.updateBookingStatus);

router.get('/', auth, requireRole('ADMIN'), bookingController.getAllBookings);

router.put('/:id/approve', auth, requireRole('ADMIN'), validate(bookingValidator.bookingIdParam), bookingController.approveBooking);

router.put('/:id/reject', auth, requireRole('ADMIN'), validate(bookingValidator.bookingIdParam), bookingController.rejectBooking);

router.get('/stats/admin', auth, requireRole('ADMIN'), bookingController.getBookingStats);

module.exports = router;
