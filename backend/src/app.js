const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const path = require('path');
const appConfig = require('./config/app');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const { globalLimiter } = require('./middleware/rateLimiter');
const v1Routes = require('./routes/v1');
const { prisma } = require('./database/connection');

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
    database: 'PostgreSQL (Neon)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalDrivers, totalRiders, activeDrivers, totalRides, activeRides, completedTrips, totalVehicles] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.user.count({ where: { role: 'RIDER' } }),
      prisma.user.count({ where: { role: 'DRIVER', isActive: true } }),
      prisma.ridePool.count(),
      prisma.ridePool.count({ where: { status: 'ACTIVE' } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.vehicle.count()
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

app.use(`${appConfig.API_PREFIX}/${appConfig.API_VERSION}`, v1Routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
