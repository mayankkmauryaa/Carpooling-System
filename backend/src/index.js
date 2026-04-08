const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const rideRoutes = require('./routes/rides');
const tripRoutes = require('./routes/trips');
const privacyRoutes = require('./routes/privacy');
const reviewRoutes = require('./routes/reviews');
const messageRoutes = require('./routes/messages');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(globalLimiter.middleware());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'routes.html'));
});

app.get('/api/health', (req, res) => {
    res.json({
        status:'success',
        message:'API is running successfully',
        timestamp: new Date().toISOString()
    })
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const User = require('./models/User');
    const RidePool = require('./models/RidePool');
    const Trip = require('./models/Trip');
    const Vehicle = require('./models/Vehicle');

    const totalUsers = await User.countDocuments();
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalRiders = await User.countDocuments({ role: 'rider' });
    const activeDrivers = await User.countDocuments({ role: 'driver', isActive: true });
    const totalRides = await RidePool.countDocuments();
    const activeRides = await RidePool.countDocuments({ status: 'active' });
    const completedTrips = await Trip.countDocuments({ status: 'completed' });
    const totalVehicles = await Vehicle.countDocuments();

    res.json({
      status: 'success',
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

app.use('/api/auth', authLimiter.middleware(), authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();
        logger.info('Database connected successfully');
        
        app.listen(config.PORT, () => {
            logger.info(`Server is Running on port ${config.PORT}`);
            logger.info(`Test Health : http://localhost:${config.PORT}/api/health`);
            logger.info(`Stats : http://localhost:${config.PORT}/api/stats`);
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error}`);
        process.exit(1);
    }
};

startServer();
