const tripConsumer = require('./tripConsumer');
const paymentConsumer = require('./paymentConsumer');
const notificationConsumer = require('./notificationConsumer');
const userEventConsumer = require('./userEventConsumer');

const initializeConsumers = () => {
  console.log('Initializing event consumers...');
  
  // Consumers auto-initialize on require via constructor
  // Just reference them to ensure they're loaded
  console.log('- TripConsumer:', tripConsumer ? 'loaded' : 'FAILED');
  console.log('- PaymentConsumer:', paymentConsumer ? 'loaded' : 'FAILED');
  console.log('- NotificationConsumer:', notificationConsumer ? 'loaded' : 'FAILED');
  console.log('- UserEventConsumer:', userEventConsumer ? 'loaded' : 'FAILED');
  
  console.log('All event consumers initialized');
};

module.exports = {
  initializeConsumers,
  tripConsumer,
  paymentConsumer,
  notificationConsumer,
  userEventConsumer
};
