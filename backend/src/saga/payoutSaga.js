const { SagaStep, sagaOrchestrator } = require('./sagaOrchestrator');
const { prisma } = require('../database/connection');
const paymentService = require('../services/paymentService');
const logger = require('../middleware/logger');

async function validateTripStep(context) {
  logger.info('Payout Saga: Step 1 - Validating trip', { tripId: context.tripId });

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: context.tripId },
      include: {
        ridePool: true,
        driver: true
      }
    });

    if (!trip) {
      return { success: false, error: 'Trip not found' };
    }

    if (trip.status !== 'COMPLETED') {
      return { success: false, error: 'Trip not completed' };
    }

    const existingPayout = await prisma.payout.findFirst({
      where: { tripId: context.tripId }
    });

    if (existingPayout) {
      return { success: false, error: 'Payout already processed' };
    }

    return {
      success: true,
      tripId: trip.id,
      driverId: trip.driverId,
      totalFare: trip.totalFare,
      driverEarnings: trip.totalFare * 0.8
    };
  } catch (error) {
    logger.error('Payout Saga: Trip validation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function validateTripCompensation(context) {
  logger.info('Payout Saga: Trip validation compensation - no action needed');
  return { success: true };
}

async function calculatePayoutStep(context) {
  logger.info('Payout Saga: Step 2 - Calculating payout', {
    tripId: context.tripId,
    totalFare: context.validateTrip.totalFare
  });

  const platformFee = context.validateTrip.totalFare * 0.2;
  const driverEarnings = context.validateTrip.totalFare * 0.8;

  return {
    success: true,
    platformFee,
    driverEarnings,
    totalFare: context.validateTrip.totalFare
  };
}

async function calculatePayoutCompensation(context) {
  logger.info('Payout Saga: Payout calculation compensation - no action needed');
  return { success: true };
}

async function processPayoutStep(context) {
  logger.info('Payout Saga: Step 3 - Processing payout', {
    driverId: context.validateTrip.driverId,
    amount: context.calculatePayout.driverEarnings
  });

  try {
    const driver = await prisma.user.findUnique({
      where: { id: context.validateTrip.driverId }
    });

    if (!driver) {
      return { success: false, error: 'Driver not found' };
    }

    let razorpayAccountId = driver.razorpayAccountId;

    if (!razorpayAccountId && driver.email) {
      const customer = await paymentService.createCustomer(
        driver.email,
        `${driver.firstName} ${driver.lastName}`,
        { userId: driver.id }
      );
      razorpayAccountId = customer.customerId;
    }

    const payout = await paymentService.createPayout(razorpayAccountId, {
      amount: context.calculatePayout.driverEarnings,
      notes: {
        tripId: context.tripId.toString(),
        driverId: context.validateTrip.driverId.toString(),
        totalFare: context.calculatePayout.totalFare.toString(),
        platformFee: context.calculatePayout.platformFee.toString()
      }
    });

    const payoutRecord = await prisma.payout.create({
      data: {
        driverId: context.validateTrip.driverId,
        tripId: context.tripId,
        amount: context.calculatePayout.driverEarnings,
        platformFee: context.calculatePayout.platformFee,
        razorpayPayoutId: payout.payoutId,
        status: 'PROCESSING'
      }
    });

    logger.info('Payout Saga: Payout initiated', {
      payoutId: payoutRecord.id,
      razorpayPayoutId: payout.payoutId
    });

    return {
      success: true,
      payoutId: payoutRecord.id,
      razorpayPayoutId: payout.payoutId,
      status: payout.status
    };
  } catch (error) {
    logger.error('Payout Saga: Payout processing failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function cancelPayoutCompensation(context) {
  logger.info('Payout Saga: Compensating - Cancelling payout', {
    payoutId: context.processPayout?.payoutId
  });

  try {
    if (context.processPayout?.payoutId) {
      await prisma.payout.update({
        where: { id: context.processPayout.payoutId },
        data: { status: 'CANCELLED' }
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Payout Saga: Payout cancellation compensation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function updateDriverEarningsStep(context) {
  logger.info('Payout Saga: Step 4 - Updating driver earnings', {
    driverId: context.validateTrip.driverId,
    amount: context.calculatePayout.driverEarnings
  });

  try {
    const wallet = await prisma.wallet.upsert({
      where: { userId: context.validateTrip.driverId },
      create: {
        userId: context.validateTrip.driverId,
        balance: 0
      },
      update: {}
    });

    const newBalance = wallet.balance + context.calculatePayout.driverEarnings;

    await prisma.wallet.update({
      where: { userId: context.validateTrip.driverId },
      data: { balance: newBalance }
    });

    await prisma.walletTransaction.create({
      data: {
        userId: context.validateTrip.driverId,
        type: 'CREDIT',
        amount: context.calculatePayout.driverEarnings,
        balance: newBalance,
        reference: `PAYOUT_${context.processPayout?.payoutId || context.tripId}`,
        description: `Payout for trip #${context.tripId}`
      }
    });

    logger.info('Payout Saga: Driver earnings updated', {
      driverId: context.validateTrip.driverId,
      newBalance
    });

    return {
      success: true,
      newBalance
    };
  } catch (error) {
    logger.error('Payout Saga: Driver earnings update failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function reverseEarningsCompensation(context) {
  logger.info('Payout Saga: Compensating - Reversing driver earnings', {
    driverId: context.validateTrip.driverId,
    amount: context.calculatePayout?.driverEarnings
  });

  try {
    if (context.updateDriverEarnings?.newBalance) {
      await prisma.wallet.update({
        where: { userId: context.validateTrip.driverId },
        data: {
          balance: {
            decrement: context.calculatePayout.driverEarnings
          }
        }
      });

      await prisma.walletTransaction.create({
        data: {
          userId: context.validateTrip.driverId,
          type: 'DEBIT',
          amount: context.calculatePayout.driverEarnings,
          balance: context.updateDriverEarnings.newBalance - context.calculatePayout.driverEarnings,
          reference: `PAYOUT_REVERSAL_${context.processPayout?.payoutId || context.tripId}`,
          description: `Payout reversal for trip #${context.tripId}`
        }
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Payout Saga: Earnings reversal compensation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function notifyDriverStep(context) {
  logger.info('Payout Saga: Step 5 - Notifying driver', {
    driverId: context.validateTrip.driverId
  });

  return {
    success: true,
    notified: true
  };
}

async function notifyDriverCompensation(context) {
  logger.info('Payout Saga: Driver notification compensation - no action needed');
  return { success: true };
}

const payoutSagaSteps = [
  new SagaStep('validateTrip', validateTripStep, validateTripCompensation),
  new SagaStep('calculatePayout', calculatePayoutStep, calculatePayoutCompensation),
  new SagaStep('processPayout', processPayoutStep, cancelPayoutCompensation),
  new SagaStep('updateDriverEarnings', updateDriverEarningsStep, reverseEarningsCompensation),
  new SagaStep('notifyDriver', notifyDriverStep, notifyDriverCompensation)
];

sagaOrchestrator.register('PAYOUT', payoutSagaSteps);

async function executePayoutSaga(context) {
  return await sagaOrchestrator.execute('PAYOUT', context);
}

module.exports = {
  executePayoutSaga,
  payoutSagaSteps,
  validateTripStep,
  calculatePayoutStep,
  processPayoutStep,
  updateDriverEarningsStep,
  notifyDriverStep
};
