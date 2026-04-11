-- ============================================
-- Carpooling System Database Schema
-- Generated from Prisma Schema
-- Last Updated: April 11, 2026
-- Changes: Added unique constraints on document tables
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR UNIQUE NOT NULL,
  "password" VARCHAR,
  "firstName" VARCHAR NOT NULL,
  "lastName" VARCHAR NOT NULL,
  "phone" VARCHAR,
  "role" VARCHAR DEFAULT 'RIDER',
  "profilePicture" VARCHAR,
  "isProfileBlurred" BOOLEAN DEFAULT true,
  "isActive" BOOLEAN DEFAULT true,
  "isSuspended" BOOLEAN DEFAULT false,
  "suspendedReason" VARCHAR,
  "rating" FLOAT DEFAULT 0,
  "totalReviews" INT DEFAULT 0,
  "googleId" VARCHAR UNIQUE,
  "isGoogleUser" BOOLEAN DEFAULT false,
  "emailVerified" BOOLEAN DEFAULT false,
  "razorpayAccountId" VARCHAR,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_googleId_idx" ON "users"("googleId");

-- Vehicles Table
CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" SERIAL PRIMARY KEY,
  "driverId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "ownerId" INT REFERENCES "users"("id") ON DELETE SET NULL,
  "brand" VARCHAR NOT NULL,
  "make" VARCHAR,
  "model" VARCHAR NOT NULL,
  "licensePlate" VARCHAR UNIQUE NOT NULL,
  "color" VARCHAR NOT NULL,
  "capacity" INT NOT NULL,
  "vehicleType" VARCHAR DEFAULT 'SEDAN',
  "verificationStatus" VARCHAR DEFAULT 'PENDING',
  "preferences" JSONB DEFAULT '{"smoking": false, "pets": false, "music": true}',
  "isActive" BOOLEAN DEFAULT true,
  "registrationExpiry" TIMESTAMP NOT NULL,
  "pricePerDay" FLOAT DEFAULT 0,
  "pricePerKm" FLOAT DEFAULT 0,
  "minimumCharge" FLOAT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "vehicles_driverId_idx" ON "vehicles"("driverId");
CREATE INDEX IF NOT EXISTS "vehicles_ownerId_idx" ON "vehicles"("ownerId");
CREATE INDEX IF NOT EXISTS "vehicles_brand_idx" ON "vehicles"("brand");
CREATE INDEX IF NOT EXISTS "vehicles_verificationStatus_idx" ON "vehicles"("verificationStatus");

-- RidePools Table
CREATE TABLE IF NOT EXISTS "ride_pools" (
  "id" SERIAL PRIMARY KEY,
  "driverId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "vehicleId" INT NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "pickupLocation" JSONB NOT NULL,
  "dropLocation" JSONB NOT NULL,
  "departureTime" TIMESTAMP NOT NULL,
  "availableSeats" INT NOT NULL,
  "pricePerSeat" FLOAT NOT NULL,
  "status" VARCHAR DEFAULT 'ACTIVE',
  "preferences" JSONB DEFAULT '{"smoking": false, "pets": false, "femaleOnly": false, "music": true}',
  "routeData" JSONB,
  "distance" FLOAT,
  "estimatedDuration" INT,
  "bookedSeats" INT DEFAULT 0,
  "passengers" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ride_pools_pickupLocation_idx" ON "ride_pools" USING GIN ("pickupLocation");
CREATE INDEX IF NOT EXISTS "ride_pools_dropLocation_idx" ON "ride_pools" USING GIN ("dropLocation");
CREATE INDEX IF NOT EXISTS "ride_pools_departureTime_idx" ON "ride_pools"("departureTime");
CREATE INDEX IF NOT EXISTS "ride_pools_status_idx" ON "ride_pools"("status");
CREATE INDEX IF NOT EXISTS "ride_pools_driverId_idx" ON "ride_pools"("driverId");
CREATE INDEX IF NOT EXISTS "ride_pools_status_departureTime_idx" ON "ride_pools"("status", "departureTime");
CREATE INDEX IF NOT EXISTS "ride_pools_status_driverId_idx" ON "ride_pools"("status", "driverId");
CREATE INDEX IF NOT EXISTS "ride_pools_driverId_status_idx" ON "ride_pools"("driverId", "status");

-- Trips Table
CREATE TABLE IF NOT EXISTS "trips" (
  "id" SERIAL PRIMARY KEY,
  "ridePoolId" INT NOT NULL REFERENCES "ride_pools"("id") ON DELETE CASCADE,
  "driverId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "riderIds" INT[] DEFAULT '{}',
  "startTime" TIMESTAMP,
  "endTime" TIMESTAMP,
  "status" VARCHAR DEFAULT 'SCHEDULED',
  "totalFare" FLOAT DEFAULT 0,
  "distance" FLOAT,
  "estimatedDuration" INT,
  "actualDistance" FLOAT,
  "actualDuration" INT,
  "startLocation" JSONB,
  "endLocation" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "trips_ridePoolId_idx" ON "trips"("ridePoolId");
CREATE INDEX IF NOT EXISTS "trips_driverId_idx" ON "trips"("driverId");
CREATE INDEX IF NOT EXISTS "trips_status_idx" ON "trips"("status");

-- Messages Table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" SERIAL PRIMARY KEY,
  "senderId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "receiverId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "ridePoolId" INT REFERENCES "ride_pools"("id") ON DELETE SET NULL,
  "content" VARCHAR NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "isSystemMessage" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "messages_senderId_receiverId_idx" ON "messages"("senderId", "receiverId");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");

-- Reviews Table
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" SERIAL PRIMARY KEY,
  "tripId" INT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
  "reviewerId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "revieweeId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" VARCHAR NOT NULL,
  "rating" INT NOT NULL,
  "comment" VARCHAR,
  "isVisible" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "reviews_tripId_idx" ON "reviews"("tripId");
CREATE INDEX IF NOT EXISTS "reviews_reviewerId_idx" ON "reviews"("reviewerId");
CREATE INDEX IF NOT EXISTS "reviews_revieweeId_idx" ON "reviews"("revieweeId");

-- SOSAlerts Table
CREATE TABLE IF NOT EXISTS "sos_alerts" (
  "id" SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "ridePoolId" INT REFERENCES "ride_pools"("id") ON DELETE SET NULL,
  "message" VARCHAR,
  "location" JSONB,
  "status" VARCHAR DEFAULT 'ACTIVE',
  "acknowledgedBy" INT,
  "acknowledgedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "notes" VARCHAR,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "sos_alerts_userId_idx" ON "sos_alerts"("userId");
CREATE INDEX IF NOT EXISTS "sos_alerts_ridePoolId_idx" ON "sos_alerts"("ridePoolId");
CREATE INDEX IF NOT EXISTS "sos_alerts_status_idx" ON "sos_alerts"("status");
CREATE INDEX IF NOT EXISTS "sos_alerts_createdAt_idx" ON "sos_alerts"("createdAt");

-- RideRequests Table
CREATE TABLE IF NOT EXISTS "ride_requests" (
  "id" SERIAL PRIMARY KEY,
  "ridePoolId" INT NOT NULL REFERENCES "ride_pools"("id") ON DELETE CASCADE,
  "riderId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" VARCHAR DEFAULT 'PENDING',
  "pickupLocation" JSONB,
  "dropLocation" JSONB,
  "requestedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "rejectedAt" TIMESTAMP,
  "rejectionReason" VARCHAR,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ride_requests_ridePoolId_idx" ON "ride_requests"("ridePoolId");
CREATE INDEX IF NOT EXISTS "ride_requests_riderId_idx" ON "ride_requests"("riderId");
CREATE INDEX IF NOT EXISTS "ride_requests_status_idx" ON "ride_requests"("status");

-- SagaLog Table
CREATE TABLE IF NOT EXISTS "saga_logs" (
  "id" SERIAL PRIMARY KEY,
  "sagaType" VARCHAR NOT NULL,
  "status" VARCHAR DEFAULT 'PENDING',
  "currentStep" INT DEFAULT 0,
  "totalSteps" INT NOT NULL,
  "errorMessage" VARCHAR,
  "context" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "saga_logs_sagaType_idx" ON "saga_logs"("sagaType");
CREATE INDEX IF NOT EXISTS "saga_logs_status_idx" ON "saga_logs"("status");

-- SagaStepLog Table
CREATE TABLE IF NOT EXISTS "saga_step_logs" (
  "id" SERIAL PRIMARY KEY,
  "sagaId" INT NOT NULL REFERENCES "saga_logs"("id") ON DELETE CASCADE,
  "stepName" VARCHAR NOT NULL,
  "status" VARCHAR NOT NULL,
  "result" VARCHAR,
  "error" VARCHAR,
  "executedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "saga_step_logs_sagaId_idx" ON "saga_step_logs"("sagaId");

-- Bookings Table
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" SERIAL PRIMARY KEY,
  "ridePoolId" INT NOT NULL REFERENCES "ride_pools"("id") ON DELETE CASCADE,
  "riderId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "rideRequestId" INT,
  "seatsBooked" INT DEFAULT 1,
  "status" VARCHAR DEFAULT 'PENDING',
  "pickupLocation" JSONB,
  "dropLocation" JSONB,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "totalAmount" FLOAT DEFAULT 0,
  "paymentOrderId" VARCHAR,
  "razorpayPaymentId" VARCHAR,
  "confirmedAt" TIMESTAMP,
  "cancelledAt" TIMESTAMP,
  "cancelledBy" INT,
  "cancellationReason" VARCHAR,
  "refundAmount" FLOAT,
  "refundStatus" VARCHAR,
  "sagaState" VARCHAR,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "bookings_ridePoolId_idx" ON "bookings"("ridePoolId");
CREATE INDEX IF NOT EXISTS "bookings_riderId_idx" ON "bookings"("riderId");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_startDate_idx" ON "bookings"("startDate");
CREATE INDEX IF NOT EXISTS "bookings_endDate_idx" ON "bookings"("endDate");
CREATE INDEX IF NOT EXISTS "bookings_riderId_status_idx" ON "bookings"("riderId", "status");
CREATE INDEX IF NOT EXISTS "bookings_ridePoolId_riderId_idx" ON "bookings"("ridePoolId", "riderId");
CREATE INDEX IF NOT EXISTS "bookings_status_createdAt_idx" ON "bookings"("status", "createdAt");

-- Payouts Table
CREATE TABLE IF NOT EXISTS "payouts" (
  "id" SERIAL PRIMARY KEY,
  "driverId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tripId" INT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
  "amount" FLOAT NOT NULL,
  "platformFee" FLOAT DEFAULT 0,
  "razorpayPayoutId" VARCHAR,
  "status" VARCHAR DEFAULT 'PENDING',
  "processedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "payouts_driverId_idx" ON "payouts"("driverId");
CREATE INDEX IF NOT EXISTS "payouts_tripId_idx" ON "payouts"("tripId");
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");

-- Payments Table
CREATE TABLE IF NOT EXISTS "payments" (
  "id" SERIAL PRIMARY KEY,
  "razorpayOrderId" VARCHAR UNIQUE,
  "razorpayPaymentId" VARCHAR UNIQUE,
  "userId" INT REFERENCES "users"("id") ON DELETE SET NULL,
  "tripId" INT REFERENCES "trips"("id") ON DELETE SET NULL,
  "vehicleId" INT REFERENCES "vehicles"("id") ON DELETE SET NULL,
  "amount" FLOAT NOT NULL,
  "currency" VARCHAR DEFAULT 'INR',
  "status" VARCHAR DEFAULT 'PENDING',
  "receipt" VARCHAR,
  "capturedAmount" FLOAT,
  "refundedAmount" FLOAT,
  "notes" JSONB,
  "capturedAt" TIMESTAMP,
  "refundedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "payments_razorpayOrderId_idx" ON "payments"("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "payments_razorpayPaymentId_idx" ON "payments"("razorpayPaymentId");
CREATE INDEX IF NOT EXISTS "payments_userId_idx" ON "payments"("userId");
CREATE INDEX IF NOT EXISTS "payments_vehicleId_idx" ON "payments"("vehicleId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- Refunds Table
CREATE TABLE IF NOT EXISTS "refunds" (
  "id" SERIAL PRIMARY KEY,
  "razorpayRefundId" VARCHAR UNIQUE,
  "razorpayPaymentId" VARCHAR,
  "paymentId" INT NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
  "amount" FLOAT NOT NULL,
  "status" VARCHAR DEFAULT 'PENDING',
  "speed" VARCHAR,
  "notes" JSONB,
  "processedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "refunds_razorpayRefundId_idx" ON "refunds"("razorpayRefundId");
CREATE INDEX IF NOT EXISTS "refunds_paymentId_idx" ON "refunds"("paymentId");
CREATE INDEX IF NOT EXISTS "refunds_status_idx" ON "refunds"("status");

-- Wallets Table
CREATE TABLE IF NOT EXISTS "wallets" (
  "id" SERIAL PRIMARY KEY,
  "userId" INT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "balance" FLOAT DEFAULT 0,
  "currency" VARCHAR DEFAULT 'INR',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "wallets_userId_idx" ON "wallets"("userId");

-- WalletTransactions Table
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id" SERIAL PRIMARY KEY,
  "walletId" INT NOT NULL REFERENCES "wallets"("id") ON DELETE CASCADE,
  "userId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" VARCHAR NOT NULL,
  "amount" FLOAT NOT NULL,
  "balance" FLOAT NOT NULL,
  "reference" VARCHAR,
  "description" VARCHAR,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");
CREATE INDEX IF NOT EXISTS "wallet_transactions_userId_idx" ON "wallet_transactions"("userId");
CREATE INDEX IF NOT EXISTS "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- RazorpayCustomers Table
CREATE TABLE IF NOT EXISTS "razorpay_customers" (
  "id" SERIAL PRIMARY KEY,
  "customerId" VARCHAR UNIQUE NOT NULL,
  "email" VARCHAR NOT NULL,
  "name" VARCHAR NOT NULL,
  "phone" VARCHAR,
  "userId" INT UNIQUE REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "razorpay_customers_userId_idx" ON "razorpay_customers"("userId");
CREATE INDEX IF NOT EXISTS "razorpay_customers_email_idx" ON "razorpay_customers"("email");

-- DriverLocations Table
CREATE TABLE IF NOT EXISTS "driver_locations" (
  "id" SERIAL PRIMARY KEY,
  "driverId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "latitude" FLOAT NOT NULL,
  "longitude" FLOAT NOT NULL,
  "heading" FLOAT,
  "speed" FLOAT,
  "accuracy" FLOAT,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "driver_locations_driverId_idx" ON "driver_locations"("driverId");
CREATE INDEX IF NOT EXISTS "driver_locations_timestamp_idx" ON "driver_locations"("timestamp");
CREATE INDEX IF NOT EXISTS "driver_locations_isActive_idx" ON "driver_locations"("isActive");
CREATE INDEX IF NOT EXISTS "driver_locations_isActive_timestamp_idx" ON "driver_locations"("isActive", "timestamp");
CREATE INDEX IF NOT EXISTS "driver_locations_driverId_timestamp_idx" ON "driver_locations"("driverId", "timestamp");

-- LocationHistories Table
CREATE TABLE IF NOT EXISTS "location_histories" (
  "id" SERIAL PRIMARY KEY,
  "driverId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "latitude" FLOAT NOT NULL,
  "longitude" FLOAT NOT NULL,
  "heading" FLOAT,
  "speed" FLOAT,
  "accuracy" FLOAT,
  "locationType" VARCHAR DEFAULT 'DRIVER_LOCATION',
  "relatedId" INT,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "location_histories_driverId_idx" ON "location_histories"("driverId");
CREATE INDEX IF NOT EXISTS "location_histories_timestamp_idx" ON "location_histories"("timestamp");
CREATE INDEX IF NOT EXISTS "location_histories_locationType_idx" ON "location_histories"("locationType");

-- DriverDocuments Table
CREATE TABLE IF NOT EXISTS "driver_documents" (
  "id" SERIAL PRIMARY KEY,
  "driverId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "documentType" VARCHAR NOT NULL,
  "url" VARCHAR NOT NULL,
  "status" VARCHAR DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP,
  "verifiedBy" INT REFERENCES "users"("id") ON DELETE SET NULL,
  "rejectedReason" VARCHAR,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("driverId", "documentType")
);

CREATE UNIQUE INDEX IF NOT EXISTS "driver_documents_driverId_documentType_idx" ON "driver_documents"("driverId", "documentType");
CREATE INDEX IF NOT EXISTS "driver_documents_driverId_idx" ON "driver_documents"("driverId");
CREATE INDEX IF NOT EXISTS "driver_documents_documentType_idx" ON "driver_documents"("documentType");
CREATE INDEX IF NOT EXISTS "driver_documents_status_idx" ON "driver_documents"("status");
CREATE INDEX IF NOT EXISTS "driver_documents_expiresAt_idx" ON "driver_documents"("expiresAt");

-- VehicleDocuments Table
CREATE TABLE IF NOT EXISTS "vehicle_documents" (
  "id" SERIAL PRIMARY KEY,
  "vehicleId" INT NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "documentType" VARCHAR NOT NULL,
  "url" VARCHAR NOT NULL,
  "status" VARCHAR DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP,
  "verifiedBy" INT REFERENCES "users"("id") ON DELETE SET NULL,
  "rejectedReason" VARCHAR,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("vehicleId", "documentType")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_documents_vehicleId_documentType_idx" ON "vehicle_documents"("vehicleId", "documentType");
CREATE INDEX IF NOT EXISTS "vehicle_documents_vehicleId_idx" ON "vehicle_documents"("vehicleId");
CREATE INDEX IF NOT EXISTS "vehicle_documents_documentType_idx" ON "vehicle_documents"("documentType");
CREATE INDEX IF NOT EXISTS "vehicle_documents_status_idx" ON "vehicle_documents"("status");
CREATE INDEX IF NOT EXISTS "vehicle_documents_expiresAt_idx" ON "vehicle_documents"("expiresAt");

-- PaymentMethods Table
CREATE TABLE IF NOT EXISTS "payment_methods" (
  "id" SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" VARCHAR NOT NULL,
  "isDefault" BOOLEAN DEFAULT false,
  "details" JSONB NOT NULL,
  "status" VARCHAR DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "payment_methods_userId_idx" ON "payment_methods"("userId");
CREATE INDEX IF NOT EXISTS "payment_methods_type_idx" ON "payment_methods"("type");
CREATE INDEX IF NOT EXISTS "payment_methods_status_idx" ON "payment_methods"("status");

-- Owners Table
CREATE TABLE IF NOT EXISTS "owners" (
  "id" SERIAL PRIMARY KEY,
  "userId" INT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "businessName" VARCHAR,
  "gstNumber" VARCHAR,
  "panNumber" VARCHAR,
  "rejectionReason" VARCHAR,
  "verificationStatus" VARCHAR DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "owners_userId_idx" ON "owners"("userId");

-- OwnerDocuments Table
CREATE TABLE IF NOT EXISTS "owner_documents" (
  "id" SERIAL PRIMARY KEY,
  "ownerId" INT NOT NULL REFERENCES "owners"("id") ON DELETE CASCADE,
  "documentType" VARCHAR NOT NULL,
  "url" VARCHAR NOT NULL,
  "status" VARCHAR DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP,
  "verifiedBy" INT REFERENCES "users"("id") ON DELETE SET NULL,
  "rejectedReason" VARCHAR,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("ownerId", "documentType")
);

CREATE UNIQUE INDEX IF NOT EXISTS "owner_documents_ownerId_documentType_idx" ON "owner_documents"("ownerId", "documentType");
CREATE INDEX IF NOT EXISTS "owner_documents_ownerId_idx" ON "owner_documents"("ownerId");
CREATE INDEX IF NOT EXISTS "owner_documents_documentType_idx" ON "owner_documents"("documentType");
CREATE INDEX IF NOT EXISTS "owner_documents_status_idx" ON "owner_documents"("status");
CREATE INDEX IF NOT EXISTS "owner_documents_expiresAt_idx" ON "owner_documents"("expiresAt");

-- Device Tokens Table (for Push Notifications)
CREATE TABLE IF NOT EXISTS "device_tokens" (
  "id" SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" VARCHAR UNIQUE NOT NULL,
  "deviceType" VARCHAR NOT NULL,
  "deviceName" VARCHAR,
  "appVersion" VARCHAR,
  "fcmToken" VARCHAR,
  "isActive" BOOLEAN DEFAULT true,
  "lastUsedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "device_tokens_userId_idx" ON "device_tokens"("userId");
CREATE INDEX IF NOT EXISTS "device_tokens_deviceType_idx" ON "device_tokens"("deviceType");
CREATE INDEX IF NOT EXISTS "device_tokens_isActive_idx" ON "device_tokens"("isActive");

-- ============================================
-- Enums
-- ============================================

CREATE TYPE role AS ENUM ('DRIVER', 'RIDER', 'ADMIN', 'OWNER');
CREATE TYPE ride_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE trip_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE review_type AS ENUM ('DRIVER_TO_RIDER', 'RIDER_TO_DRIVER');
CREATE TYPE sos_status AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE saga_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'COMPENSATING', 'ROLLED_BACK');
CREATE TYPE booking_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'ACTIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'CAPTURED', 'REFUNDED', 'FAILED');
CREATE TYPE refund_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE transaction_type AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE location_type AS ENUM ('DRIVER_LOCATION', 'PICKUP_LOCATION', 'DROPOFF_LOCATION', 'SOS_LOCATION');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE driver_document_type AS ENUM ('AADHAAR', 'PAN', 'PASSPORT_PHOTO', 'DRIVING_LICENSE', 'POLICE_VERIFICATION', 'BANK_DETAILS', 'BADGE', 'MEDICAL_FITNESS');
CREATE TYPE vehicle_document_type AS ENUM ('RC', 'PERMIT', 'INSURANCE', 'FITNESS_CERTIFICATE', 'PUC', 'FASTAG');
CREATE TYPE doc_status AS ENUM ('PENDING', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE owner_document_type AS ENUM ('GST', 'PAN', 'BUSINESS_LICENSE', 'ADDRESS_PROOF');
CREATE TYPE vehicle_type AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'MINIVAN', 'TEMPO', 'MOTORCYCLE', 'AUTO', 'EV_SEDAN', 'EV_SUV', 'EV_HATCHBACK', 'EV_AUTO', 'EV_MOTORCYCLE', 'LUXURY', 'PREMIUM', 'ECONOMY', 'PICKUP', 'TRUCK', 'VAN');
CREATE TYPE device_type AS ENUM ('ANDROID', 'IOS', 'WEB');

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
LANGUAGE plpgsql;

-- Apply updatedAt trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ride_pools_updated_at BEFORE UPDATE ON ride_pools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sos_alerts_updated_at BEFORE UPDATE ON sos_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON ride_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saga_logs_updated_at BEFORE UPDATE ON saga_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saga_step_logs_updated_at BEFORE UPDATE ON saga_step_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_razorpay_customers_updated_at BEFORE UPDATE ON razorpay_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_locations_updated_at BEFORE UPDATE ON driver_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_location_histories_updated_at BEFORE UPDATE ON location_histories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_documents_updated_at BEFORE UPDATE ON driver_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_documents_updated_at BEFORE UPDATE ON vehicle_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_owner_documents_updated_at BEFORE UPDATE ON owner_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON device_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- End of Schema
-- ============================================
