const nodemailer = require('nodemailer');
const path = require('path');
const { circuitBreakerRegistry } = require('../middleware/circuitBreaker');
const CircuitBreakerConfig = require('../config/circuitBreaker');

let transporter = null;

const emailBreaker = circuitBreakerRegistry.register('email', CircuitBreakerConfig.getServiceConfig('email'));

function createTransporter() {
  if (transporter) return transporter;

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  transporter = nodemailer.createTransport(config);
  return transporter;
}

async function sendEmail(options) {
  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Carpooling System'}" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments
  };

  try {
    const result = await emailBreaker.execute(async () => {
      const transport = createTransporter();
      const info = await transport.sendMail(mailOptions);
      return info;
    });
    
    console.log('Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    if (error.message.includes('Circuit breaker')) {
      console.warn('Email circuit breaker open, email queued for retry');
      return { success: false, error: 'Service temporarily unavailable', queued: true };
    }
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

async function verifyConnection() {
  try {
    const transport = createTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    return false;
  }
}

function generateEmailFooter(user) {
  return `
    <br><br>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #666; font-size: 12px;">
      This is an automated message from ${process.env.APP_NAME || 'Carpooling System'}.<br>
      ${user ? `Sent to: ${user}` : ''}<br>
      <a href="${process.env.APP_URL || '#'}">Visit our website</a>
    </p>
  `;
}

async function sendWelcomeEmail(user) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A90E2;">Welcome to Carpooling System!</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Thank you for joining us! We're excited to have you on board.</p>
      <p>With Carpooling System, you can:</p>
      <ul>
        <li>Find and offer rides in your area</li>
        <li>Save money on commuting</li>
        <li>Reduce your carbon footprint</li>
        <li>Connect with fellow travelers</li>
      </ul>
      <p><a href="${process.env.APP_URL || '#'}/dashboard" style="background: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Carpooling System!',
    html
  });
}

async function sendVerificationEmail(user, verificationToken) {
  const verifyUrl = `${process.env.APP_URL || '#'}/verify-email?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A90E2;">Verify Your Email</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
      </p>
      <p style="color: #666;">Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - Carpooling System',
    html
  });
}

async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${process.env.APP_URL || '#'}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #E74C3C;">Password Reset Request</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #E74C3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </p>
      <p style="color: #666;">Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
      <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset - Carpooling System',
    html
  });
}

async function sendRideRequestNotification(driver, rideDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A90E2;">New Ride Request</h1>
      <p>Hi ${driver.name || driver.email},</p>
      <p>You have a new ride request!</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${rideDetails.pickupLocation}</p>
        <p><strong>To:</strong> ${rideDetails.dropLocation}</p>
        <p><strong>Date:</strong> ${rideDetails.date}</p>
        <p><strong>Time:</strong> ${rideDetails.time}</p>
        <p><strong>Rider:</strong> ${rideDetails.riderName}</p>
        <p><strong>Seats:</strong> ${rideDetails.seats}</p>
      </div>
      <p><a href="${process.env.APP_URL || '#'}/rides/${rideDetails.rideId}" style="background: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
      ${generateEmailFooter(driver.email)}
    </div>
  `;

  return sendEmail({
    to: driver.email,
    subject: 'New Ride Request - Carpooling System',
    html
  });
}

async function sendRideConfirmationEmail(rider, rideDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #27AE60;">Ride Confirmed!</h1>
      <p>Hi ${rider.name || rider.email},</p>
      <p>Great news! Your ride has been confirmed.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${rideDetails.pickupLocation}</p>
        <p><strong>To:</strong> ${rideDetails.dropLocation}</p>
        <p><strong>Date:</strong> ${rideDetails.date}</p>
        <p><strong>Time:</strong> ${rideDetails.departureTime}</p>
        <p><strong>Driver:</strong> ${rideDetails.driverName}</p>
        <p><strong>Vehicle:</strong> ${rideDetails.vehicleDetails}</p>
        <p><strong>Estimated Price:</strong> $${rideDetails.price}</p>
      </div>
      <p><a href="${process.env.APP_URL || '#'}/rides/${rideDetails.rideId}" style="background: #27AE60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Ride Details</a></p>
      ${generateEmailFooter(rider.email)}
    </div>
  `;

  return sendEmail({
    to: rider.email,
    subject: 'Ride Confirmed! - Carpooling System',
    html
  });
}

async function sendRideCancellationEmail(user, rideDetails, reason = '') {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #E74C3C;">Ride Cancelled</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Unfortunately, the following ride has been cancelled:</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${rideDetails.pickupLocation}</p>
        <p><strong>To:</strong> ${rideDetails.dropLocation}</p>
        <p><strong>Date:</strong> ${rideDetails.date}</p>
        <p><strong>Time:</strong> ${rideDetails.time}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      <p><a href="${process.env.APP_URL || '#'}/rides" style="background: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Find New Ride</a></p>
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Ride Cancelled - Carpooling System',
    html
  });
}

async function sendDriverLocationUpdateEmail(rider, rideDetails, eta) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A90E2;">Driver Location Update</h1>
      <p>Hi ${rider.name || rider.email},</p>
      <p>Your driver is on the way!</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Driver:</strong> ${rideDetails.driverName}</p>
        <p><strong>Estimated Arrival:</strong> ${eta} minutes</p>
        <p><strong>Current Location:</strong> ${rideDetails.driverLocation}</p>
      </div>
      <p><a href="${process.env.APP_URL || '#'}/rides/${rideDetails.rideId}/track" style="background: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Ride</a></p>
      ${generateEmailFooter(rider.email)}
    </div>
  `;

  return sendEmail({
    to: rider.email,
    subject: 'Driver On The Way - Carpooling System',
    html
  });
}

async function sendTripCompletionEmail(user, tripDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #27AE60;">Trip Completed!</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Your trip has been completed successfully.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${tripDetails.pickupLocation}</p>
        <p><strong>To:</strong> ${tripDetails.dropLocation}</p>
        <p><strong>Date:</strong> ${tripDetails.date}</p>
        <p><strong>Distance:</strong> ${tripDetails.distance} km</p>
        <p><strong>Duration:</strong> ${tripDetails.duration}</p>
        <p><strong>Total:</strong> $${tripDetails.total}</p>
      </div>
      <p>We hope you had a great ride!</p>
      <p><a href="${process.env.APP_URL || '#'}/trips/${tripDetails.tripId}/review" style="background: #F39C12; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Leave a Review</a></p>
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Trip Completed - Carpooling System',
    html
  });
}

async function sendReceiptEmail(user, receiptDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A90E2;">Trip Receipt</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Thank you for using Carpooling System. Here is your trip receipt:</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Receipt #:</strong> ${receiptDetails.receiptNumber}</p>
        <p><strong>Date:</strong> ${receiptDetails.date}</p>
        <hr style="border: none; border-top: 1px solid #ddd;">
        <p><strong>From:</strong> ${receiptDetails.pickupLocation}</p>
        <p><strong>To:</strong> ${receiptDetails.dropLocation}</p>
        <p><strong>Distance:</strong> ${receiptDetails.distance} km</p>
        <hr style="border: none; border-top: 1px solid #ddd;">
        <p><strong>Base Fare:</strong> $${receiptDetails.baseFare}</p>
        <p><strong>Service Fee:</strong> $${receiptDetails.serviceFee}</p>
        <p><strong>Total:</strong> <strong>$${receiptDetails.total}</strong></p>
      </div>
      ${receiptDetails.pdfUrl ? `<p><a href="${receiptDetails.pdfUrl}" style="background: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download PDF</a></p>` : ''}
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Receipt ${receiptDetails.receiptNumber} - Carpooling System`,
    html
  });
}

async function sendSOSAlertEmail(admin, alertDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #E74C3C;">🚨 SOS Alert</h1>
      <p>An SOS alert has been triggered!</p>
      <div style="background: #ffeaea; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #E74C3C;">
        <p><strong>User:</strong> ${alertDetails.userName}</p>
        <p><strong>Trip ID:</strong> ${alertDetails.tripId}</p>
        <p><strong>Location:</strong> ${alertDetails.location}</p>
        <p><strong>Time:</strong> ${alertDetails.timestamp}</p>
        <p><strong>Message:</strong> ${alertDetails.message || 'No message'}</p>
      </div>
      <p><a href="${process.env.APP_URL || '#'}/admin/sos/${alertDetails.alertId}" style="background: #E74C3C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Alert</a></p>
    </div>
  `;

  return sendEmail({
    to: admin.email,
    subject: '🚨 SOS Alert - Carpooling System',
    html
  });
}

async function sendBookingReminderEmail(user, bookingDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #F39C12;">Upcoming Ride Reminder</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>This is a reminder about your upcoming ride:</p>
      <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${bookingDetails.pickupLocation}</p>
        <p><strong>To:</strong> ${bookingDetails.dropLocation}</p>
        <p><strong>Date:</strong> ${bookingDetails.date}</p>
        <p><strong>Time:</strong> ${bookingDetails.time}</p>
        <p><strong>${bookingDetails.isDriver ? 'Vehicle' : 'Driver'}:</strong> ${bookingDetails.driverName}</p>
      </div>
      <p><a href="${process.env.APP_URL || '#'}/rides/${bookingDetails.rideId}" style="background: #F39C12; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Ride Reminder - Carpooling System',
    html
  });
}

async function sendReviewRequestEmail(user, tripDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A90E2;">How was your trip?</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Thank you for using Carpooling System! We'd love to hear about your experience.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Trip:</strong> ${tripDetails.pickupLocation} → ${tripDetails.dropLocation}</p>
        <p><strong>Date:</strong> ${tripDetails.date}</p>
        <p><strong>${tripDetails.isDriver ? 'Passenger' : 'Driver'}:</strong> ${tripDetails.partnerName}</p>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || '#'}/trips/${tripDetails.tripId}/review" style="background: #F39C12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Leave a Review</a>
      </p>
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Rate Your Trip - Carpooling System',
    html
  });
}

async function sendNewReviewNotification(user, reviewDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #27AE60;">New Review Received!</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>You received a new ${reviewDetails.rating}-star review!</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 24px; margin: 0;">${'⭐'.repeat(reviewDetails.rating)}</p>
        <p><em>"${reviewDetails.comment}"</em></p>
        <p><strong>From:</strong> ${reviewDetails.reviewerName}</p>
      </div>
      <p>Your average rating: ${reviewDetails.newAverageRating} ⭐</p>
      ${generateEmailFooter(user.email)}
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'New Review - Carpooling System',
    html
  });
}

module.exports = {
  sendEmail,
  verifyConnection,
  createTransporter,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendRideRequestNotification,
  sendRideConfirmationEmail,
  sendRideCancellationEmail,
  sendDriverLocationUpdateEmail,
  sendTripCompletionEmail,
  sendReceiptEmail,
  sendSOSAlertEmail,
  sendBookingReminderEmail,
  sendReviewRequestEmail,
  sendNewReviewNotification
};
