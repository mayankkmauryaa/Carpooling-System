const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const path = require('path');
const { config } = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');
const v1Routes = require('./routes/v1');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());

app.use(globalLimiter.middleware());

app.get('/', (req, res) => {
  res.json({
    name: 'Carpooling System API',
    version: '1.0.0',
    documentation: '/api/v1'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const User = require('./models/User');
    const RidePool = require('./models/RidePool');
    const Trip = require('./models/Trip');
    const Vehicle = require('./models/Vehicle');

    const [totalUsers, totalDrivers, totalRiders, activeDrivers, totalRides, activeRides, completedTrips, totalVehicles] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'rider' }),
      User.countDocuments({ role: 'driver', isActive: true }),
      RidePool.countDocuments(),
      RidePool.countDocuments({ status: 'active' }),
      Trip.countDocuments({ status: 'completed' }),
      Vehicle.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        totalRiders,
        activeDrivers,
        totalRides,
        activeRides,
        completedTrips,
        totalVehicles
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use(`${config.API_PREFIX}/${config.API_VERSION}`, v1Routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
