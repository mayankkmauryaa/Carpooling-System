const tripConsumer = require('./tripConsumer');
const paymentConsumer = require('./paymentConsumer');
const notificationConsumer = require('./notificationConsumer');
const userEventConsumer = require('./userEventConsumer');

const initializeConsumers = () => {
  console.log('Initializing event consumers...');
  
  tripConsumer;
  paymentConsumer;
  notificationConsumer;
  userEventConsumer;
  
  console.log('All event consumers initialized');
};

module.exports = {
  initializeConsumers,
  tripConsumer,
  paymentConsumer,
  notificationConsumer,
  userEventConsumer
};
