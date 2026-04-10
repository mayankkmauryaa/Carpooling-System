const express = require('express');
const router = express.Router();
const { authLimiter } = require('../../middleware/rateLimiter');

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const vehiclesRoutes = require('./vehicles.routes');
const ridesRoutes = require('./rides.routes');
const tripsRoutes = require('./trips.routes');
const messagesRoutes = require('./messages.routes');
const reviewsRoutes = require('./reviews.routes');
const privacyRoutes = require('./privacy.routes');
const uploadsRoutes = require('./uploads.routes');

router.use('/auth', authLimiter.middleware(), authRoutes);
router.use('/users', usersRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/rides', ridesRoutes);
router.use('/trips', tripsRoutes);
router.use('/messages', messagesRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/privacy', privacyRoutes);
router.use('/uploads', uploadsRoutes);

module.exports = router;
