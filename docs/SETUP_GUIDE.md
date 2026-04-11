# Carpooling System - Complete Setup Guide

> **Last Updated:** April 12, 2026  
> **Purpose:** Step-by-step instructions to obtain all required API keys and configurations  
> **Services:** Google Maps, Razorpay, Cloudinary, Google OAuth, Gmail SMTP, Firebase, Twilio  
> **Platforms:** Web (React), Mobile (Flutter), Backend (Node.js)

---

## Quick Start Checklist

| #   | Service      | .env Variable                              | Priority | Time     | Cost                |
| --- | ------------ | ------------------------------------------ | -------- | -------- | ------------------- |
| 1   | Google Maps  | `GOOGLE_MAPS_API_KEY`                      | HIGH     | 15 min   | Free tier ($200/mo) |
| 2   | Razorpay     | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`   | HIGH     | 1-2 days | 2% + GST            |
| 3   | Cloudinary   | 3 keys                                     | HIGH     | 10 min   | Free tier           |
| 4   | Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | MEDIUM   | 15 min   | Free                |
| 5   | Gmail SMTP   | `SMTP_USER`, `SMTP_PASS`                   | MEDIUM   | 5 min    | Free                |
| 6   | Firebase     | 3 FCM keys                                 | LOW      | 30 min   | Free (unlimited)    |
| 7   | Twilio       | 3 keys                                     | LOW      | 20 min   | Pay-as-you-go       |

---

## 1. Google Maps API Key ⭐ CRITICAL

**Purpose:** Maps, location search, directions in Web + Mobile apps

### Step-by-Step:

1. **Go to Google Cloud Console**

   ```
   https://console.cloud.google.com/
   ```

2. **Create a New Project**
   - Click "New Project" at top right
   - Name: `Carpooling System`
   - Click "Create"

3. **Enable Required APIs**
   - Go to APIs & Services > Library
   - Search and enable each:
     - Maps JavaScript API
     - Places API
     - Directions API
     - Geocoding API
     - Maps SDK for Android
     - Maps SDK for iOS

4. **Create API Key**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"
   - Copy the key

5. **Secure the Key (Recommended)**
   - Click on the created key
   - Under "Key restriction":
     - HTTP referrers (for web)
     - Android apps (for Android)
     - iOS apps (for iOS)
   - Restrict to enabled APIs above

### Add to .env:

```
GOOGLE_MAPS_API_KEY=AIzaSy.................................
```

### Cost: Free tier $200/month (sufficient for MVP)

---

## 2. Razorpay (Payment Gateway) ⭐ CRITICAL

**Purpose:** Accept payments from riders

### Step-by-Step:

1. **Sign Up**

   ```
   https://razorpay.com/
   ```

2. **Complete Account Setup**
   - Enter business details
   - Upload business documents
   - Connect bank account

3. **Verify KYC**
   - Wait for Razorpay approval (1-2 business days)
   - Check email for verification status

4. **Get API Keys**
   - Go to Dashboard > API Keys
   - Note: Use "Test" mode keys for development
   - Switch to "Live" mode for production
   - Key ID: `rzp_test_xxxxxxxxxxxx`
   - Key Secret: `xxxxxxxxxxxxxxxxxxxx`

5. **Set Up Webhook (Optional)**
   - Dashboard > Webhooks
   - Add URL: `your-server.com/api/v1/payments/webhook`
   - Events: `payment.authorized`, `payment.failed`, `refund.created`

### Add to .env:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx
```

### Cost: 2% + GST per transaction

---

## 3. Cloudinary (Image Storage) ⭐ CRITICAL

**Purpose:** Store vehicle images, profile pictures, documents

### Step-by-Step:

1. **Sign Up**

   ```
   https://cloudinary.com/
   ```

2. **Create Account**
   - Enter email, password
   - Choose "Free" plan (for now)
   - Copy your "Cloud Name" from dashboard

3. **Get API Credentials**
   - Go to Settings (gear icon) > API Credentials
   - Note:
     - Cloud Name
     - API Key
     - API Secret

4. **Configure Upload Preset (Optional)**
   - Go to Settings > Upload
   - Add upload preset name for unsigned uploads

### Add to .env:

```
CLOUDINARY_CLOUD_NAME=yourcloudname
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Cost: Free tier: 25GB storage, 1GB bandwidth/month

---

## 4. Google OAuth (Login) ⚡ MEDIUM

**Purpose:** "Sign in with Google" button

### Step-by-Step:

1. **Go to Google Cloud Console**

   ```
   https://console.cloud.google.com/
   ```

2. **Select Your Project**

3. **Configure OAuth Consent Screen**
   - Go to APIs & Services > OAuth consent screen
   - User Type: External
   - Fill required fields:
     - App name: Carpooling System
     - User support email: your@email.com
     - Developer email: your@email.com
   - Click "Save and Continue"

4. **Create OAuth Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > OAuth client ID
   - Application type: Web application
   - Name: Carpooling Web App
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     http://localhost:3001
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/v1/auth/google/callback
     http://localhost:3001/api/v1/auth/google/callback
     ```

5. **Get Client ID and Secret**
   - Copy the created credentials

### Add to .env:

```
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
```

---

## 5. SMTP (Email) ⚡ MEDIUM

**Purpose:** Send booking confirmations, OTPs, notifications

### Option A: Gmail (Easiest)

1. **Enable 2-Factor Authentication**
   - Go to myaccount.google.com > Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to myaccount.google.com > Security
   - App passwords (search)
   - Generate new password for "Mail"
   - Copy the 16-character password

### Add to .env:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Carpooling System
```

### Option B: SendGrid (Better Deliverability)

1. **Sign Up**

   ```
   https://sendgrid.com/
   ```

2. **Create API Key**
   - Go to Settings > API Keys
   - Create API Key (Full Access)
   - Copy the key

### Add to .env:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM_NAME=Carpooling System
```

---

## 6. Firebase (Push Notifications) 🔔

**Purpose:** Push notifications on mobile when app is closed

### Step-by-Step:

1. **Go to Firebase Console**

   ```
   https://console.firebase.google.com/
   ```

2. **Create Project**
   - Add project name: `carpooling-app`
   - Link to existing Google Cloud project
   - Enable Google Analytics (optional)

3. **Add Android App**
   - Click Android icon
   - Package name: `com.carpooling.app`
   - Download `google-services.json`

4. **Add iOS App**
   - Click iOS icon
   - Bundle ID: `com.carpooling.app`
   - Download `GoogleService-Info.plist`

5. **Get Service Account Credentials**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - JSON file will download

6. **Extract Values from JSON:**
   ```json
   {
     "project_id": "carpooling-app-xxx",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "firebase-adminsdk@carpooling-app-xxx.iam.gserviceaccount.com"
   }
   ```

### Add to .env:

```
FCM_PROJECT_ID=carpooling-app-xxx
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEF..."
FCM_CLIENT_EMAIL=firebase-adminsdk@carpooling-app-xxx.iam.gserviceaccount.com
```

### Note:

- For mobile app: Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
- Place in mobile app's root directory

---

## 7. Twilio (Privacy Calling + SMS)

**Purpose:** Masked phone calls, OTP SMS

### Step-by-Step:

1. **Sign Up**

   ```
   https://www.twilio.com/
   ```

2. **Verify Account**
   - Verify phone number with OTP

3. **Get Credentials**
   - Go to Console (home)
   - Copy Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy Auth Token: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Get Phone Number (for calls)**
   - Go to Phone Numbers > Buy a Number
   - Search available numbers
   - Buy (note the cost per minute)

5. **Configure (Optional)**
   - Verify caller ID in Console

### Add to .env:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_SMS_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SMS_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SMS_FROM=+1234567890
```

### Cost: Pay-as-you-go (~$1/min calls, $0.01/SMS)

---

## After Filling All Keys

### Update backend/.env

```
# ============================================
# Server Configuration
# ============================================
PORT=3000
APP_URL=http://localhost

# ============================================
# Mobile App Configuration
# ============================================
MOBILE_API_URL=http://YOUR_SERVER_IP:3000/api/v1
MOBILE_SOCKET_URL=http://YOUR_SERVER_IP:3000

# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://...

# ============================================
# JWT
# ============================================
JWT_SECRET=carpooling_super_secret_key_2024_make_it_at_least_32_chars

# ============================================
# Google Maps
# ============================================
GOOGLE_MAPS_API_KEY=AIzaSy.................................

# ============================================
# Razorpay
# ============================================
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx

# ============================================
# Cloudinary
# ============================================
CLOUDINARY_CLOUD_NAME=yourcloudname
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# Google OAuth
# ============================================
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback

# ============================================
# SMTP (Email)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Carpooling System

# ============================================
# Firebase Push
# ============================================
FCM_PROJECT_ID=carpooling-app-xxx
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FCM_CLIENT_EMAIL=firebase-adminsdk@carpooling-app-xxx.iam.gserviceaccount.com

# ============================================
# Twilio (Calls + SMS)
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_SMS_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SMS_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SMS_FROM=+1234567890
```

---

## For Mobile App Developers

### Files to Copy to Mobile App

| Platform | File                       | Source Location                     |
| -------- | -------------------------- | ----------------------------------- |
| Android  | `google-services.json`     | Firebase Console > Project Settings |
| iOS      | `GoogleService-Info.plist` | Firebase Console > Project Settings |

### Mobile App Configuration

In your Flutter app, configure the API base URL:

```dart
// lib/config.dart
class AppConfig {
  static const String apiBaseUrl = 'http://YOUR_SERVER_IP:3000/api/v1';
  static const String socketUrl = 'http://YOUR_SERVER_IP:3000';
  static const String googleMapsKey = 'YOUR_GOOGLE_MAPS_API_KEY';
  static const String fcmSenderId = 'YOUR_FCM_PROJECT_NUMBER';
}
```

---

## Quick Start Priority

If you want to launch quickly:

| Priority        | Services                     | What Works                   |
| --------------- | ---------------------------- | ---------------------------- |
| **MVP (Day 1)** | Maps + Cloudinary + Razorpay | Full ride booking flow       |
| **Week 1**      | + Google OAuth + Email       | Social login + confirmations |
| **Week 2**      | + Firebase + Twilio          | Push notifications + calls   |

---

## Mobile App Configuration

### Flutter App Setup

Add `lib/config.dart`:

```dart
class AppConfig {
  // Update these for your server
  static const String apiBaseUrl = 'http://YOUR_SERVER_IP:3000/api/v1';
  static const String socketUrl = 'http://YOUR_SERVER_IP:3000';

  // Google Maps - get from Google Cloud Console
  static const String googleMapsKey = 'YOUR_GOOGLE_MAPS_API_KEY';

  // Firebase - from Firebase Console
  static const String fcmSenderId = 'YOUR_FCM_PROJECT_NUMBER';

  // Razorpadey - from Razorpay dashboard
  static const String razorpayKeyId = 'YOUR_RAZORPAY_KEY_ID';
}
```

### Android Configuration

1. Copy `google-services.json` to `android/app/google-services.json`
2. Update `android/build.gradle`:

```groovy
plugins {
  id 'com.google.gms.google-services' version '4.4.0' apply false
}
```

3. In `android/app/build.gradle`, add:

```groovy
apply plugin: 'com.google.gms.google-services'
```

### iOS Configuration

1. Copy `GoogleService-Info.plist` to `ios/Runner/GoogleService-Info.plist`
2. In Xcode, right-click Runner > Add files to Runner
3. Select `GoogleService-Info.plist`
4. Ensure "Copy items if needed" is checked
5. Run `cd ios && pod install`

---

## Complete .env Template

```env
# ============================================
# CARPOOLING SYSTEM - ENVIRONMENT
# ============================================

# ===== Server =====
PORT=3000
NODE_ENV=development
APP_NAME=Carpooling System

# ===== Mobile =====
MOBILE_API_URL=http://YOUR_SERVER_IP:3000/api/v1
MOBILE_SOCKET_URL=http://YOUR_SERVER_IP:3000

# ===== Database =====
DATABASE_URL=postgresql://...

# ===== JWT =====
JWT_SECRET=your_32_char_minimum_secret_key

# ===== Google Maps =====
GOOGLE_MAPS_API_KEY=AIzaSy...........
GOOGLE_MAPS_ENABLED=true

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback

# ===== Razorpay =====
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# ===== Cloudinary =====
CLOUDINARY_CLOUD_NAME=yourcloudname
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxx

# ===== Email =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Carpooling System

# ===== Firebase Push =====
FCM_PROJECT_ID=your_project_id
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FCM_CLIENT_EMAIL=firebase-adminsdk@...

# ===== Twilio (Optional) =====
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

_Document Created: April 12, 2026_
_For: Carpooling System (Backend + Web + Mobile)_
