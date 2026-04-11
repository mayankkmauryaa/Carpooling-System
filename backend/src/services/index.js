const authService = require('./AuthService');
const userService = require('./UserService');
const vehicleService = require('./VehicleService');
const rideService = require('./RideService');
const tripService = require('./TripService');
const messageService = require('./MessageService');
const reviewService = require('./ReviewService');
const cacheService = require('./CacheService');
const sosService = require('./SOSService');
const bookingService = require('./bookingService');
const paymentService = require('./paymentService');
const adminService = require('./adminService');
const emailService = require('./emailService');
const refundService = require('./refundService');
const mapsService = require('./mapsService');
const locationService = require('./locationService');
const uploadService = require('./uploadService');
const priceCalculationService = require('./priceCalculationService');
const driverDocumentService = require('./DriverDocumentService');
const vehicleDocumentService = require('./VehicleDocumentService');
const ownerService = require('./OwnerService');
const fleetService = require('./FleetService');
const documentExpiryService = require('./DocumentExpiryService');
const { ownerDocumentService } = require('./OwnerDocumentService');
const { paymentMethodService } = require('./PaymentMethodService');
const payoutService = require('./PayoutService');
const pushNotificationService = require('./PushNotificationService');
const deviceService = require('./DeviceService');

module.exports = {
  authService,
  userService,
  vehicleService,
  rideService,
  tripService,
  messageService,
  reviewService,
  cacheService,
  sosService,
  bookingService,
  paymentService,
  adminService,
  emailService,
  refundService,
  mapsService,
  locationService,
  uploadService,
  priceCalculationService,
  driverDocumentService,
  vehicleDocumentService,
  ownerService,
  fleetService,
  documentExpiryService,
  ownerDocumentService,
  paymentMethodService,
  payoutService,
  pushNotificationService,
  deviceService
};
