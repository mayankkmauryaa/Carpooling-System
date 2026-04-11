const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const appConfig = require('./config/app');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const { globalLimiter } = require('./middleware/rateLimiter');
const { sanitizeRequest, httpParameterPollution } = require('./middleware/security');
const v1Routes = require('./routes/v1');
const { prisma } = require('./database/connection');
const eventBus = require('./events/eventBus');
const { httpMetricsMiddleware, metricsEndpoint } = require('./metrics/httpMetrics');

const METRICS_ENABLED = process.env.METRICS_ENABLED !== 'false';

const app = express();
let server = null;

app.setSocketServer = (s) => { server = s; };
app.getServer = () => server;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(httpParameterPollution);
app.use(sanitizeRequest);

app.use(globalLimiter.middleware());

if (METRICS_ENABLED) {
  app.use(httpMetricsMiddleware);
}

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

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running successfully',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    kafka: false,
    eventBus: false
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    logger.error('Health check: Database failed', { error: error.message });
  }

  try {
    const { getRedisClient } = require('./database/redis');
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      checks.redis = true;
    }
  } catch (error) {
    logger.error('Health check: Redis failed', { error: error.message });
  }

  checks.eventBus = eventBus.isConnected;
  checks.kafka = eventBus.isConnected;

  const allHealthy = Object.values(checks).every(v => v === true);

  if (allHealthy) {
    res.status(200).json({
      status: 'ok',
      checks,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      checks,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    kafka: false,
    eventBus: false
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    logger.error('Health check: Database failed', { error: error.message });
  }

  try {
    const { getRedisClient } = require('./database/redis');
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      checks.redis = true;
    }
  } catch (error) {
    logger.error('Health check: Redis failed', { error: error.message });
  }

  checks.eventBus = eventBus.isConnected;
  checks.kafka = eventBus.isConnected;

  const allHealthy = Object.values(checks).every(v => v === true);
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

if (METRICS_ENABLED) {
  app.get('/metrics', metricsEndpoint);
  app.get('/api/v1/metrics', metricsEndpoint);
}

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
