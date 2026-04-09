const authValidators = require('./auth.validator');
const userValidators = require('./user.validator');
const vehicleValidators = require('./vehicle.validator');
const rideValidators = require('./ride.validator');
const tripValidators = require('./trip.validator');
const messageValidators = require('./message.validator');
const reviewValidators = require('./review.validator');
const common = require('./common.schemas');

module.exports = {
  ...common,
  ...authValidators,
  ...userValidators,
  ...vehicleValidators,
  ...rideValidators,
  ...tripValidators,
  ...messageValidators,
  ...reviewValidators
};
