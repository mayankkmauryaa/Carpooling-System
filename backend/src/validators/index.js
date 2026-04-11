const authValidators = require('./auth.validator');
const userValidators = require('./user.validator');
const vehicleValidators = require('./vehicle.validator');
const rideValidators = require('./ride.validator');
const tripValidators = require('./trip.validator');
const messageValidators = require('./message.validator');
const reviewValidators = require('./review.validator');
const bookingValidators = require('./booking.validator');
const paymentValidators = require('./payment.validator');
const common = require('./common.schemas');
const driverValidators = require('./driver.validator');
const paymentMethodValidators = require('./paymentMethod.validator');
const ownerValidators = require('./owner.validator');
const fleetValidators = require('./fleet.validator');

module.exports = {
  ...common,
  ...authValidators,
  ...userValidators,
  ...vehicleValidators,
  ...rideValidators,
  ...tripValidators,
  ...messageValidators,
  ...reviewValidators,
  ...bookingValidators,
  ...paymentValidators,
  ...driverValidators,
  ...paymentMethodValidators,
  ...ownerValidators,
  ...fleetValidators
};
