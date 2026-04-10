const Razorpay = require('razorpay');
const { prisma } = require('../database/connection');
const crypto = require('crypto');

let razorpay = null;

function getRazorpayInstance() {
  if (razorpay) return razorpay;

  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  return razorpay;
}

function generateReceiptId() {
  return `RCP_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function createOrder(amount, currency = 'INR', options = {}) {
  const razorpayInstance = getRazorpayInstance();

  const receipt = options.receipt || generateReceiptId();

  const orderOptions = {
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes: options.notes || {},
    partial_payment: options.partialPayment || false
  };

  if (options.vehicleId) orderOptions.notes.vehicleId = options.vehicleId.toString();
  if (options.tripId) orderOptions.notes.tripId = options.tripId.toString();
  if (options.userId) orderOptions.notes.userId = options.userId.toString();

  try {
    const order = await razorpayInstance.orders.create(orderOptions);

    await prisma.payment.create({
      data: {
        razorpayOrderId: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        status: 'PENDING',
        receipt: order.receipt,
        userId: options.userId,
        tripId: options.tripId,
        vehicleId: options.vehicleId,
        notes: order.notes
      }
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw error;
  }
}

async function createSubscription(customerId, planId, options = {}) {
  const razorpayInstance = getRazorpayInstance();

  const subscriptionOptions = {
    plan_id: planId,
    customer_id: customerId,
    total_count: options.totalCount || 12,
    quantity: options.quantity || 1,
    start_at: options.startAt || Math.floor(Date.now() / 1000),
    expire_by: options.expireBy,
    notify: { notify_info: options.notifyEmail || '' }
  };

  try {
    const subscription = await razorpayInstance.subscriptions.create(subscriptionOptions);

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      startAt: subscription.start_at,
      endAt: subscription.end_at,
      customerId: subscription.customer_id
    };
  } catch (error) {
    console.error('Razorpay subscription error:', error);
    throw error;
  }
}

async function cancelSubscription(subscriptionId) {
  const razorpayInstance = getRazorpayInstance();

  try {
    const subscription = await razorpayInstance.subscriptions.cancel(subscriptionId);
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelledAt: subscription.cancelled_at
    };
  } catch (error) {
    console.error('Razorpay cancel subscription error:', error);
    throw error;
  }
}

async function createCustomer(email, name, options = {}) {
  const razorpayInstance = getRazorpayInstance();

  const customerOptions = {
    name,
    email,
    contact: options.phone,
    fail_existing: 0,
    gstin: options.gstin,
    notes: options.notes || {}
  };

  try {
    const customer = await razorpayInstance.customers.create(customerOptions);

    await prisma.razorpayCustomer.create({
      data: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.contact,
        userId: options.userId
      }
    });

    return {
      customerId: customer.id,
      email: customer.email,
      name: customer.name
    };
  } catch (error) {
    console.error('Razorpay customer creation error:', error);
    throw error;
  }
}

async function getCustomer(customerId) {
  const razorpayInstance = getRazorpayInstance();

  try {
    const customer = await razorpayInstance.customers.fetch(customerId);
    return {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      gstin: customer.gstin,
      status: customer.status
    };
  } catch (error) {
    console.error('Razorpay get customer error:', error);
    throw error;
  }
}

async function addCustomerAddress(customerId, address) {
  const razorpayInstance = getRazorpayInstance();

  try {
    const customer = await razorpayInstance.customers.fetch(customerId);
    const existingAddresses = customer.notes?.addresses || [];

    const newAddress = {
      type: address.type || 'billing',
      name: address.name,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      country: address.country || 'IN'
    };

    await razorpayInstance.customers.edit(customerId, {
      notes: {
        addresses: [...existingAddresses, newAddress]
      }
    });

    return { success: true, address: newAddress };
  } catch (error) {
    console.error('Razorpay add address error:', error);
    throw error;
  }
}

async function fetchPayment(paymentId) {
  const razorpayInstance = getRazorpayInstance();

  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return {
      paymentId: payment.id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      cardId: payment.card_id,
      bank: payment.bank,
      wallet: payment.wallet,
      vpa: payment.vpa,
      createdAt: payment.created_at
    };
  } catch (error) {
    console.error('Razorpay fetch payment error:', error);
    throw error;
  }
}

async function capturePayment(paymentId, amount, options = {}) {
  const razorpayInstance = getRazorpayInstance();

  try {
    const payment = await razorpayInstance.payments.capture(
      paymentId,
      Math.round(amount * 100),
      options.currency || 'INR',
      { notes: options.notes }
    );

    await prisma.payment.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: {
        status: 'CAPTURED',
        capturedAmount: payment.amount / 100,
        capturedAt: new Date()
      }
    });

    return {
      paymentId: payment.id,
      amount: payment.amount / 100,
      status: payment.status
    };
  } catch (error) {
    console.error('Razorpay capture payment error:', error);
    throw error;
  }
}

async function refundPayment(paymentId, amount, options = {}) {
  const razorpayInstance = getRazorpayInstance();

  try {
    const refundOptions = {
      amount: Math.round((amount || 0) * 100),
      speed: options.speed || 'normal',
      notes: options.notes || {}
    };

    const refund = await razorpayInstance.payments.refund(paymentId, refundOptions);

    await prisma.refund.create({
      data: {
        razorpayRefundId: refund.id,
        razorpayPaymentId: paymentId,
        amount: refund.amount / 100,
        status: 'PROCESSING',
        speed: refund.speed,
        notes: refund.notes
      }
    });

    await prisma.payment.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: {
        status: 'REFUNDED',
        refundedAmount: refund.amount / 100,
        refundedAt: new Date()
      }
    });

    return {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
      status: refund.status,
      speed: refund.speed
    };
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw error;
  }
}

async function getRefund(refundId) {
  const razorpayInstance = getRazorpayInstance();

  try {
    const refund = await razorpayInstance.refunds.fetch(refundId);
    return {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
      status: refund.status,
      speed: refund.speed,
      createdAt: refund.created_at
    };
  } catch (error) {
    console.error('Razorpay fetch refund error:', error);
    throw error;
  }
}

async function verifyPaymentSignature(orderId, paymentId, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
}

async function verifyWebhookSignature(body, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');

  return expectedSignature === signature;
}

async function createTransfer(orderId, transfers) {
  const razorpayInstance = getRazorpayInstance();

  try {
    const transfer = await razorpayInstance.orders.edit(orderId, {
      transfers
    });

    return {
      orderId: transfer.id,
      transfers: transfer.transfers
    };
  } catch (error) {
    console.error('Razorpay transfer error:', error);
    throw error;
  }
}

async function createAccount(accountDetails) {
  const razorpayInstance = getRazorpayInstance();

  const accountData = {
    email: accountDetails.email,
    phone: accountDetails.phone,
    legal_business_name: accountDetails.businessName,
    business_type: accountDetails.businessType || 'proprietorship',
    contact_name: accountDetails.contactName,
    profile: {
      category: accountDetails.category || 'transportation',
      subcategory: accountDetails.subcategory || 'taxi_service',
      description: accountDetails.description,
      addresses: {
        operation: {
          street1: accountDetails.address.line1,
          street2: accountDetails.address.line2,
          city: accountDetails.address.city,
          state: accountDetails.address.state,
          postal_code: accountDetails.address.postalCode,
          country: 'IN'
        }
      }
    },
    legal_info: {
      pan: accountDetails.pan,
      gst: accountDetails.gst
    },
    bank_account: {
      account_number: accountDetails.bankAccountNumber,
      ifsc_code: accountDetails.ifscCode,
      beneficiary_name: accountDetails.beneficiaryName
    },
    settle_auto: accountDetails.settleAuto !== false,
    Activated: accountDetails.activated || false
  };

  try {
    const account = await razorpayInstance.accounts.create(accountData);

    return {
      accountId: account.id,
      email: account.email,
      status: account.status
    };
  } catch (error) {
    console.error('Razorpay create account error:', error);
    throw error;
  }
}

async function createPayout(accountId, options = {}) {
  const razorpayInstance = getRazorpayInstance();

  const payoutOptions = {
    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
    to_account: accountId,
    amount: Math.round(options.amount * 100),
    currency: options.currency || 'INR',
    mode: options.mode || 'IMPS',
    purpose: options.purpose || 'payout',
    queue_if_low_balance: options.queueIfLowBalance || true,
    notes: options.notes || {}
  };

  try {
    const payout = await razorpayInstance.payouts.create(payoutOptions);

    return {
      payoutId: payout.id,
      amount: payout.amount / 100,
      status: payout.status,
      purpose: payout.purpose
    };
  } catch (error) {
    console.error('Razorpay payout error:', error);
    throw error;
  }
}

async function createWalletTransaction(userId, amount, type, options = {}) {
  const razorpayInstance = getRazorpayInstance();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  let razorpayCustomer = await prisma.razorpayCustomer.findUnique({
    where: { userId }
  });

  if (!razorpayCustomer) {
    const customer = await createCustomer(user.email, user.name, { userId });
    razorpayCustomer = await prisma.razorpayCustomer.findUnique({
      where: { userId }
    });
  }

  const walletBalance = await prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {}
  });

  if (type === 'CREDIT') {
    const order = await createOrder(amount, 'INR', {
      userId,
      receipt: `WALLET_${userId}_${Date.now()}`,
      notes: { type: 'WALLET_RECHARGE' }
    });

    const payment = await fetchPayment(order.paymentId || options.paymentId);
    if (payment.status === 'captured') {
      await prisma.wallet.update({
        where: { userId },
        data: { balance: walletBalance.balance + amount }
      });

      await prisma.walletTransaction.create({
        data: {
          userId,
          type: 'CREDIT',
          amount,
          balance: walletBalance.balance + amount,
          reference: order.orderId,
          description: options.description || 'Wallet Recharge'
        }
      });

      return {
        success: true,
        newBalance: walletBalance.balance + amount,
        transactionId: order.orderId
      };
    }
  } else if (type === 'DEBIT') {
    if (walletBalance.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    await prisma.wallet.update({
      where: { userId },
      data: { balance: walletBalance.balance - amount }
    });

    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        type: 'DEBIT',
        amount,
        balance: walletBalance.balance - amount,
        reference: options.reference,
        description: options.description || 'Wallet Debit'
      }
    });

    return {
      success: true,
      newBalance: walletBalance.balance - amount,
      transactionId: transaction.id
    };
  }

  throw new Error('Invalid transaction type');
}

async function getWalletBalance(userId) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    return { balance: 0, userId };
  }

  return {
    balance: wallet.balance,
    userId,
    updatedAt: wallet.updatedAt
  };
}

async function getWalletTransactions(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.walletTransaction.count({ where: { userId } })
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async function processDriverPayout(driverId, amount, rideId) {
  const driver = await prisma.user.findUnique({
    where: { id: driverId }
  });

  if (!driver || driver.role !== 'DRIVER') {
    throw new Error('Invalid driver');
  }

  const trip = await prisma.trip.findFirst({
    where: { id: rideId, driverId }
  });

  if (!trip) {
    throw new Error('Ride not found or not assigned to this driver');
  }

  const driverEarnings = amount * 0.8;

  const payout = await createPayout(driver.razorpayAccountId || driverId, {
    amount: driverEarnings,
    notes: { rideId: rideId.toString(), driverId: driverId.toString() }
  });

  await prisma.payout.create({
    data: {
      driverId,
      tripId: rideId,
      amount: driverEarnings,
      razorpayPayoutId: payout.payoutId,
      status: 'PROCESSING'
    }
  });

  return payout;
}

module.exports = {
  getRazorpayInstance,
  createOrder,
  createSubscription,
  cancelSubscription,
  createCustomer,
  getCustomer,
  addCustomerAddress,
  fetchPayment,
  capturePayment,
  refundPayment,
  getRefund,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createTransfer,
  createAccount,
  createPayout,
  createWalletTransaction,
  getWalletBalance,
  getWalletTransactions,
  processDriverPayout,
  generateReceiptId
};
