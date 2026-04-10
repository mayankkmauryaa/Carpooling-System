#!/usr/bin/env node

const readline = require('readline');
const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

let currentToken = null;
let currentUser = null;
let driverToken = null;
let riderToken = null;
let vehicleId = null;
let ridePoolId = null;
let tripId = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function printHeader(text) {
  console.log('\n' + '='.repeat(60));
  console.log(text);
  console.log('='.repeat(60));
}

function printMenu(options) {
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt}`);
  });
  console.log('  0. Back to Main Menu\n');
}

async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {};
    if (currentToken) {
      config.headers = { Authorization: `Bearer ${currentToken}` };
    }
    
    let response;
    if (method === 'GET') {
      response = await api.get(endpoint, config);
    } else if (method === 'POST') {
      response = await api.post(endpoint, data, config);
    } else if (method === 'PUT') {
      response = await api.put(endpoint, data, config);
    } else if (method === 'DELETE') {
      response = await api.delete(endpoint, config);
    }
    
    console.log('\n✅ Success:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log('\n❌ Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('\n❌ Error:', error.message);
    }
    return null;
  }
}

async function authMenu() {
  printHeader('AUTHENTICATION');
  printMenu([
    'Register as Rider',
    'Register as Driver',
    'Login',
    'Login with Google (Mobile)',
    'Get Current User',
    'Refresh Token',
    'Link Google Account'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      await register('RIDER');
      break;
    case '2':
      await register('DRIVER');
      break;
    case '3':
      await login();
      break;
    case '4':
      await googleMobile();
      break;
    case '5':
      await apiRequest('GET', '/auth/me');
      break;
    case '6':
      await apiRequest('POST', '/auth/refresh');
      break;
    case '7':
      const idToken = await ask('Enter Google ID Token: ');
      await apiRequest('POST', '/auth/google/link', { idToken });
      break;
  }
}

async function register(role) {
  const email = await ask('Email: ');
  const password = await ask('Password: ');
  const firstName = await ask('First Name: ');
  const lastName = await ask('Last Name: ');
  const phone = await ask('Phone (optional): ');

  const data = {
    email,
    password,
    firstName,
    lastName,
    role: role.toUpperCase(),
    phone: phone || undefined
  };

  const result = await apiRequest('POST', '/auth/register', data);
  if (result?.data?.token) {
    currentToken = result.data.token;
    currentUser = result.data.user;
    if (role === 'DRIVER') driverToken = currentToken;
    if (role === 'RIDER') riderToken = currentToken;
    console.log(`\n✅ Registered as ${role}! Token saved.`);
  }
}

async function login() {
  const email = await ask('Email: ');
  const password = await ask('Password: ');

  const result = await apiRequest('POST', '/auth/login', { email, password });
  if (result?.data?.token) {
    currentToken = result.data.token;
    currentUser = result.data.user;
    console.log('\n✅ Logged in! Token saved.');
    console.log(`   User: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.role})`);
  }
}

async function googleMobile() {
  const idToken = await ask('Enter Google ID Token: ');
  const result = await apiRequest('POST', '/auth/google/mobile', { idToken });
  if (result?.data?.token) {
    currentToken = result.data.token;
    currentUser = result.data.user;
    console.log('\n✅ Google login successful! Token saved.');
  }
}

async function userMenu() {
  printHeader('USER MANAGEMENT');
  printMenu([
    'View My Profile',
    'Update My Profile',
    'Change Password',
    'View User by ID',
    'List All Users',
    'List All Drivers',
    'List All Riders',
    'Toggle User Status (Admin)'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      await apiRequest('GET', '/users/profile');
      break;
    case '2':
      const firstName = await ask('First Name: ');
      const lastName = await ask('Last Name: ');
      const phone = await ask('Phone: ');
      await apiRequest('PUT', '/users/profile', { firstName, lastName, phone });
      break;
    case '3':
      const currentPassword = await ask('Current Password: ');
      const newPassword = await ask('New Password: ');
      await apiRequest('PUT', '/users/password', { currentPassword, newPassword });
      break;
    case '4':
      const userId = await ask('User ID: ');
      await apiRequest('GET', `/users/${userId}`);
      break;
    case '5':
      await apiRequest('GET', '/users');
      break;
    case '6':
      await apiRequest('GET', '/users/drivers');
      break;
    case '7':
      await apiRequest('GET', '/users/riders');
      break;
    case '8':
      const uid = await ask('User ID: ');
      const isActive = await ask('Is Active (true/false): ');
      await apiRequest('PUT', `/users/${uid}/status`, { isActive: isActive === 'true' });
      break;
  }
}

async function vehicleMenu() {
  printHeader('VEHICLE MANAGEMENT');
  printMenu([
    'Create Vehicle',
    'View My Vehicles',
    'View Vehicle by ID',
    'Update Vehicle',
    'Delete Vehicle',
    'Toggle Vehicle Status',
    'List All Vehicles (Admin)'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      const model = await ask('Model (e.g., Toyota Camry): ');
      const licensePlate = await ask('License Plate (e.g., ABC-1234): ');
      const color = await ask('Color (e.g., Silver): ');
      const capacity = await ask('Capacity (e.g., 4): ');
      const expiry = await ask('Registration Expiry (YYYY-MM-DD): ');
      
      const vehicleData = {
        model,
        licensePlate,
        color,
        capacity: parseInt(capacity),
        registrationExpiry: expiry
      };
      
      const result = await apiRequest('POST', '/vehicles', vehicleData);
      if (result?.data?.vehicle) {
        vehicleId = result.data.vehicle.id;
        console.log(`\n✅ Vehicle created! ID: ${vehicleId}`);
      }
      break;
    case '2':
      await apiRequest('GET', '/vehicles');
      break;
    case '3':
      const vid = await ask('Vehicle ID: ');
      await apiRequest('GET', `/vehicles/${vid}`);
      break;
    case '4':
      const updateVid = await ask('Vehicle ID: ');
      const updateModel = await ask('New Model: ');
      const updateColor = await ask('New Color: ');
      await apiRequest('PUT', `/vehicles/${updateVid}`, { model: updateModel, color: updateColor });
      break;
    case '5':
      const delVid = await ask('Vehicle ID: ');
      await apiRequest('DELETE', `/vehicles/${delVid}`);
      break;
    case '6':
      const toggleVid = await ask('Vehicle ID: ');
      const isActive = await ask('Is Active (true/false): ');
      await apiRequest('PUT', `/vehicles/${toggleVid}/status`, { isActive: isActive === 'true' });
      break;
    case '7':
      await apiRequest('GET', '/vehicles/all');
      break;
  }
}

async function rideMenu() {
  printHeader('RIDE MANAGEMENT');
  printMenu([
    'Create Ride',
    'View My Rides',
    'Search Rides',
    'Get Recommendations',
    'View Ride by ID',
    'Update Ride',
    'Cancel Ride',
    'Get Ride Requests',
    'Respond to Request',
    'Request to Join Ride',
    'Get My Requests',
    'Cancel Join Request',
    'Get Nearby Rides',
    'Get Upcoming Rides',
    'List All Rides (Admin)'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      const rideVehicleId = await ask(`Vehicle ID [${vehicleId || 'required'}]: `) || vehicleId;
      const pickupLat = await ask('Pickup Latitude (e.g., 37.7749): ');
      const pickupLng = await ask('Pickup Longitude (e.g., -122.4194): ');
      const pickupAddr = await ask('Pickup Address: ');
      const dropLat = await ask('Drop Latitude (e.g., 37.4028): ');
      const dropLng = await ask('Drop Longitude (e.g., -122.0869): ');
      const dropAddr = await ask('Drop Address: ');
      const departureTime = await ask('Departure Time (ISO format, e.g., 2026-04-15T09:00:00Z): ');
      const availableSeats = await ask('Available Seats (e.g., 3): ');
      const pricePerSeat = await ask('Price per Seat (e.g., 25): ');

      const rideData = {
        vehicleId: parseInt(rideVehicleId),
        pickupLocation: {
          coordinates: [parseFloat(pickupLng), parseFloat(pickupLat)],
          address: pickupAddr
        },
        dropLocation: {
          coordinates: [parseFloat(dropLng), parseFloat(dropLat)],
          address: dropAddr
        },
        departureTime,
        availableSeats: parseInt(availableSeats),
        pricePerSeat: parseFloat(pricePerSeat)
      };

      const result = await apiRequest('POST', '/rides', rideData);
      if (result?.data?.ride) {
        ridePoolId = result.data.ride.id;
        console.log(`\n✅ Ride created! ID: ${ridePoolId}`);
      }
      break;
    case '2':
      await apiRequest('GET', '/rides');
      break;
    case '3':
      const searchPickupLat = await ask('Pickup Latitude: ');
      const searchPickupLng = await ask('Pickup Longitude: ');
      const searchDropLat = await ask('Drop Latitude: ');
      const searchDropLng = await ask('Drop Longitude: ');
      const searchRadius = await ask('Radius (km, default 15): ') || '15';
      const searchDate = await ask('Departure Date (YYYY-MM-DD): ');
      const searchSeats = await ask('Min Available Seats: ');

      const query = new URLSearchParams({
        pickupLat: searchPickupLat,
        pickupLng: searchPickupLng,
        dropLat: searchDropLat,
        dropLng: searchDropLng,
        radius: searchRadius
      });
      if (searchDate) query.append('departureDate', searchDate);
      if (searchSeats) query.append('availableSeats', searchSeats);

      await apiRequest('GET', `/rides/search?${query.toString()}`);
      break;
    case '4':
      await apiRequest('GET', '/rides/recommendations');
      break;
    case '5':
      const viewRideId = await ask(`Ride ID [${ridePoolId || 'required'}]: `) || ridePoolId;
      await apiRequest('GET', `/rides/${viewRideId}`);
      break;
    case '6':
      const updateRideId = await ask('Ride ID: ');
      const newSeats = await ask('New Available Seats: ');
      const newPrice = await ask('New Price: ');
      await apiRequest('PUT', `/rides/${updateRideId}`, {
        availableSeats: parseInt(newSeats),
        pricePerSeat: parseFloat(newPrice)
      });
      break;
    case '7':
      const cancelRideId = await ask('Ride ID: ');
      await apiRequest('DELETE', `/rides/${cancelRideId}`);
      break;
    case '8':
      const reqRideId = await ask('Ride ID: ');
      await apiRequest('GET', `/rides/${reqRideId}/requests`);
      break;
    case '9':
      const respondRideId = await ask('Ride ID: ');
      const respondRiderId = await ask('Rider ID: ');
      const action = await ask('Action (approve/reject): ');
      const reason = await ask('Reason (optional): ');
      await apiRequest('PUT', `/rides/${respondRideId}/requests/${respondRiderId}?action=${action}`, { reason });
      break;
    case '10':
      const joinRideId = await ask('Ride ID: ');
      const joinPickupLat = await ask('Pickup Latitude: ');
      const joinPickupLng = await ask('Pickup Longitude: ');
      const joinPickupAddr = await ask('Pickup Address: ');
      const joinDropLat = await ask('Drop Latitude: ');
      const joinDropLng = await ask('Drop Longitude: ');
      const joinDropAddr = await ask('Drop Address: ');

      await apiRequest('POST', `/rides/${joinRideId}/join`, {
        pickupLocation: {
          coordinates: [parseFloat(joinPickupLng), parseFloat(joinPickupLat)],
          address: joinPickupAddr
        },
        dropLocation: {
          coordinates: [parseFloat(joinDropLng), parseFloat(joinDropLat)],
          address: joinDropAddr
        }
      });
      break;
    case '11':
      await apiRequest('GET', '/rides/my-requests');
      break;
    case '12':
      const cancelReqRideId = await ask('Ride ID: ');
      await apiRequest('DELETE', `/rides/${cancelReqRideId}/join`);
      break;
    case '13':
      const nearbyLat = await ask('Latitude: ');
      const nearbyLng = await ask('Longitude: ');
      const nearbyRadius = await ask('Radius (km): ') || '10';
      await apiRequest('GET', `/rides/nearby?lat=${nearbyLat}&lng=${nearbyLng}&radius=${nearbyRadius}`);
      break;
    case '14':
      await apiRequest('GET', '/rides/upcoming');
      break;
    case '15':
      await apiRequest('GET', '/rides/all');
      break;
  }
}

async function tripMenu() {
  printHeader('TRIP MANAGEMENT');
  printMenu([
    'View My Trips',
    'View Trip by ID',
    'Start Trip',
    'Complete Trip',
    'Cancel Trip',
    'Get Trip by RidePool',
    'Get Trips by Date',
    'Get Upcoming Trips',
    'Get Trip Stats (Admin)',
    'List All Trips (Admin)'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      await apiRequest('GET', '/trips');
      break;
    case '2':
      const tripIdInput = await ask(`Trip ID [${tripId || 'required'}]: `) || tripId;
      await apiRequest('GET', `/trips/${tripIdInput}`);
      break;
    case '3':
      const startTripId = await ask(`Trip ID [${tripId || 'required'}]: `) || tripId;
      const startResult = await apiRequest('POST', `/trips/${startTripId}/start`);
      if (startResult?.data?.trip) {
        tripId = startResult.data.trip.id;
      }
      break;
    case '4':
      const completeTripId = await ask(`Trip ID [${tripId || 'required'}]: `) || tripId;
      const actualDistance = await ask('Actual Distance (km): ');
      const actualDuration = await ask('Actual Duration (minutes): ');
      const endLat = await ask('End Latitude: ');
      const endLng = await ask('End Longitude: ');
      const endAddr = await ask('End Address: ');

      await apiRequest('POST', `/trips/${completeTripId}/complete`, {
        actualDistance: parseFloat(actualDistance),
        actualDuration: parseInt(actualDuration),
        endLocation: {
          coordinates: [parseFloat(endLng), parseFloat(endLat)],
          address: endAddr
        }
      });
      break;
    case '5':
      const cancelTripId = await ask('Trip ID: ');
      const cancelReason = await ask('Reason: ');
      await apiRequest('POST', `/trips/${cancelTripId}/cancel`, { reason: cancelReason });
      break;
    case '6':
      const ridePoolTripId = await ask('RidePool ID: ');
      await apiRequest('GET', `/trips/ridepool/${ridePoolTripId}`);
      break;
    case '7':
      const date = await ask('Date (YYYY-MM-DD): ');
      await apiRequest('GET', `/trips/date/${date}`);
      break;
    case '8':
      await apiRequest('GET', '/trips/upcoming');
      break;
    case '9':
      await apiRequest('GET', '/trips/stats');
      break;
    case '10':
      await apiRequest('GET', '/trips/all');
      break;
  }
}

async function messageMenu() {
  printHeader('MESSAGING');
  printMenu([
    'Send Message',
    'View Conversations',
    'View Conversation with User',
    'Get Unread Count',
    'Mark Messages as Read',
    'Delete Message',
    'Delete Conversation'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      const receiverId = await ask('Receiver ID: ');
      const content = await ask('Message: ');
      const ridePoolMsgId = await ask('RidePool ID (optional): ');
      await apiRequest('POST', '/messages', {
        receiverId: parseInt(receiverId),
        content,
        ridePoolId: ridePoolMsgId ? parseInt(ridePoolMsgId) : undefined
      });
      break;
    case '2':
      await apiRequest('GET', '/messages/conversations');
      break;
    case '3':
      const convUserId = await ask('User ID: ');
      await apiRequest('GET', `/messages/conversation/${convUserId}`);
      break;
    case '4':
      await apiRequest('GET', '/messages/unread-count');
      break;
    case '5':
      const markUserId = await ask('User ID: ');
      await apiRequest('PUT', '/messages/read', { userId: parseInt(markUserId) });
      break;
    case '6':
      const delMsgId = await ask('Message ID: ');
      await apiRequest('DELETE', `/messages/${delMsgId}`);
      break;
    case '7':
      const delConvUserId = await ask('User ID: ');
      await apiRequest('DELETE', `/messages/conversation/${delConvUserId}`);
      break;
  }
}

async function reviewMenu() {
  printHeader('REVIEWS');
  printMenu([
    'Create Review',
    'View My Reviews',
    'View User Reviews',
    'View Trip Reviews',
    'View Review Stats',
    'Delete Review',
    'List All Reviews (Admin)'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      const reviewTripId = await ask('Trip ID: ');
      const revieweeId = await ask('Reviewee ID: ');
      const type = await ask('Type (DRIVER_TO_RIDER/RIDER_TO_DRIVER): ');
      const rating = await ask('Rating (1-5): ');
      const comment = await ask('Comment: ');

      await apiRequest('POST', '/reviews', {
        tripId: parseInt(reviewTripId),
        revieweeId: parseInt(revieweeId),
        type: type.toUpperCase(),
        rating: parseInt(rating),
        comment
      });
      break;
    case '2':
      await apiRequest('GET', '/reviews/my-reviews');
      break;
    case '3':
      const userRevId = await ask('User ID: ');
      await apiRequest('GET', `/reviews/user/${userRevId}`);
      break;
    case '4':
      const tripRevId = await ask('Trip ID: ');
      await apiRequest('GET', `/reviews/trip/${tripRevId}`);
      break;
    case '5':
      const statsUserId = await ask('User ID: ');
      await apiRequest('GET', `/reviews/stats/user/${statsUserId}`);
      break;
    case '6':
      const delReviewId = await ask('Review ID: ');
      await apiRequest('DELETE', `/reviews/${delReviewId}`);
      break;
    case '7':
      await apiRequest('GET', '/reviews/all');
      break;
  }
}

async function privacyMenu() {
  printHeader('PRIVACY FEATURES');
  printMenu([
    'Initiate Call',
    'End Call',
    'Get Masked Phone',
    'Send SOS Alert',
    'View SOS History',
    'Get Privacy Settings',
    'Update Privacy Settings',
    'Get Profile Visibility'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      const targetUserId = await ask('Target User ID: ');
      await apiRequest('POST', '/privacy/call/initiate', { targetUserId: parseInt(targetUserId) });
      break;
    case '2':
      const callId = await ask('Call ID: ');
      await apiRequest('POST', '/privacy/call/end', { callId });
      break;
    case '3':
      const maskedUserId = await ask('User ID: ');
      await apiRequest('GET', `/privacy/masked-phone/${maskedUserId}`);
      break;
    case '4':
      const sosRidePoolId = await ask('RidePool ID (optional): ');
      const sosMessage = await ask('Emergency Message: ');
      const sosLat = await ask('Latitude: ');
      const sosLng = await ask('Longitude: ');
      const sosAddr = await ask('Address: ');

      await apiRequest('POST', '/privacy/sos/alert', {
        ridePoolId: sosRidePoolId ? parseInt(sosRidePoolId) : undefined,
        message: sosMessage,
        location: {
          coordinates: [parseFloat(sosLng), parseFloat(sosLat)],
          address: sosAddr
        }
      });
      break;
    case '5':
      await apiRequest('GET', '/privacy/sos/history');
      break;
    case '6':
      await apiRequest('GET', '/privacy/settings');
      break;
    case '7':
      const blurProfile = await ask('Blur Profile (true/false): ');
      await apiRequest('PUT', '/privacy/settings', { isProfileBlurred: blurProfile === 'true' });
      break;
    case '8':
      await apiRequest('GET', '/privacy/profile-visibility');
      break;
  }
}

async function adminMenu() {
  printHeader('ADMIN FUNCTIONS');
  printMenu([
    'System Health Check',
    'View System Stats',
    'Toggle User Status',
    'Delete User',
    'Update Ride Status',
    'View All Vehicles',
    'View All Rides',
    'View All Trips',
    'View All Reviews'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      await apiRequest('GET', '/health');
      break;
    case '2':
      await apiRequest('GET', '/stats');
      break;
    case '3':
      const toggleUid = await ask('User ID: ');
      const toggleActive = await ask('Is Active (true/false): ');
      await apiRequest('PUT', `/users/${toggleUid}/status`, { isActive: toggleActive === 'true' });
      break;
    case '4':
      const delUid = await ask('User ID: ');
      await apiRequest('DELETE', `/users/${delUid}`);
      break;
    case '5':
      const rideStatusId = await ask('Ride ID: ');
      const newStatus = await ask('New Status (ACTIVE/COMPLETED/CANCELLED): ');
      await apiRequest('PUT', `/rides/${rideStatusId}/status`, { status: newStatus.toUpperCase() });
      break;
    case '6':
      await apiRequest('GET', '/vehicles/all');
      break;
    case '7':
      await apiRequest('GET', '/rides/all');
      break;
    case '8':
      await apiRequest('GET', '/trips/all');
      break;
    case '9':
      await apiRequest('GET', '/reviews/all');
      break;
  }
}

async function demoScenario() {
  printHeader('DEMO SCENARIO - Complete Flow');
  
  console.log('\n📋 This will run a complete demo scenario:');
  console.log('   1. Register a driver');
  console.log('   2. Register a rider');
  console.log('   3. Create a vehicle');
  console.log('   4. Create a ride');
  console.log('   5. Rider requests to join');
  console.log('   6. Driver approves request');
  console.log('   7. Start trip');
  console.log('   8. Complete trip');
  console.log('   9. Create review');
  
  const confirm = await ask('\nProceed? (y/n): ');
  if (confirm.toLowerCase() !== 'y') return;

  printHeader('Step 1: Register Driver');
  const driverEmail = `driver_${Date.now()}@test.com`;
  const driverResult = await apiRequest('POST', '/auth/register', {
    email: driverEmail,
    password: 'password123',
    firstName: 'John',
    lastName: 'Driver',
    role: 'DRIVER'
  });
  
  if (!driverResult?.data?.token) {
    console.log('\n❌ Driver registration failed');
    return;
  }
  
  driverToken = driverResult.data.token;
  console.log(`\n✅ Driver registered: ${driverEmail}`);

  printHeader('Step 2: Register Rider');
  const riderEmail = `rider_${Date.now()}@test.com`;
  const riderResult = await apiRequest('POST', '/auth/register', {
    email: riderEmail,
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Rider',
    role: 'RIDER'
  });
  
  if (!riderResult?.data?.token) {
    console.log('\n❌ Rider registration failed');
    return;
  }
  
  riderToken = riderResult.data.token;
  const riderId = riderResult.data.user.id;
  console.log(`\n✅ Rider registered: ${riderEmail} (ID: ${riderId})`);

  printHeader('Step 3: Create Vehicle (as Driver)');
  api.defaults.headers.common['Authorization'] = `Bearer ${driverToken}`;
  const vehicleResult = await api.post('/vehicles', {
    model: 'Toyota Camry',
    licensePlate: `TEST-${Date.now()}`,
    color: 'Silver',
    capacity: 4,
    registrationExpiry: '2027-12-31'
  });
  
  if (!vehicleResult.data?.data?.vehicle) {
    console.log('\n❌ Vehicle creation failed');
    return;
  }
  
  vehicleId = vehicleResult.data.data.vehicle.id;
  console.log(`\n✅ Vehicle created: ID ${vehicleId}`);

  printHeader('Step 4: Create Ride');
  const rideResult = await api.post('/rides', {
    vehicleId,
    pickupLocation: {
      coordinates: [-122.4194, 37.7749],
      address: 'San Francisco, CA'
    },
    dropLocation: {
      coordinates: [-122.0869, 37.4028],
      address: 'Palo Alto, CA'
    },
    departureTime: '2026-04-15T09:00:00Z',
    availableSeats: 3,
    pricePerSeat: 25.00
  });
  
  if (!rideResult.data?.data?.ride) {
    console.log('\n❌ Ride creation failed');
    return;
  }
  
  ridePoolId = rideResult.data.data.ride.id;
  console.log(`\n✅ Ride created: ID ${ridePoolId}`);

  printHeader('Step 5: Rider Requests to Join');
  api.defaults.headers.common['Authorization'] = `Bearer ${riderToken}`;
  const joinResult = await api.post(`/rides/${ridePoolId}/join`, {
    pickupLocation: {
      coordinates: [-122.4194, 37.7749],
      address: 'San Francisco, CA'
    },
    dropLocation: {
      coordinates: [-122.0869, 37.4028],
      address: 'Palo Alto, CA'
    }
  });
  console.log('\n✅ Join request sent');

  printHeader('Step 6: Driver Approves Request');
  api.defaults.headers.common['Authorization'] = `Bearer ${driverToken}`;
  const approveResult = await api.put(`/rides/${ridePoolId}/requests/${riderId}?action=approve`, {
    reason: 'Welcome aboard!'
  });
  
  if (approveResult.data?.data?.trip) {
    tripId = approveResult.data.data.trip.id;
    console.log(`\n✅ Request approved! Trip created: ID ${tripId}`);
  }

  printHeader('Step 7: Start Trip');
  const startResult = await api.post(`/trips/${tripId}/start`);
  console.log('\n✅ Trip started!');

  printHeader('Step 8: Complete Trip');
  const completeResult = await api.post(`/trips/${tripId}/complete`, {
    actualDistance: 45.5,
    actualDuration: 50,
    endLocation: {
      coordinates: [-122.0869, 37.4028],
      address: 'Palo Alto, CA'
    }
  });
  console.log('\n✅ Trip completed!');

  printHeader('Step 9: Create Review');
  api.defaults.headers.common['Authorization'] = `Bearer ${riderToken}`;
  const reviewResult = await api.post('/reviews', {
    tripId,
    revieweeId: driverResult.data.user.id,
    type: 'RIDER_TO_DRIVER',
    rating: 5,
    comment: 'Great ride! Very friendly driver.'
  });
  console.log('\n✅ Review created!');

  printHeader('DEMO COMPLETE');
  console.log('\n🎉 Full scenario executed successfully!');
  console.log(`   Driver: ${driverEmail}`);
  console.log(`   Rider: ${riderEmail}`);
  console.log(`   Vehicle: ${vehicleId}`);
  console.log(`   Ride: ${ridePoolId}`);
  console.log(`   Trip: ${tripId}`);
  
  api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
}

async function mainMenu() {
  printHeader('CARPOOLING SYSTEM CONSOLE DEMO');
  console.log(`\nAPI Base: ${API_BASE}`);
  console.log(`Current User: ${currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.role})` : 'Not logged in'}`);
  
  printMenu([
    'Authentication',
    'User Management',
    'Vehicle Management',
    'Ride Management',
    'Trip Management',
    'Messaging',
    'Reviews',
    'Privacy Features',
    'Admin Functions',
    'Run Demo Scenario'
  ]);

  const choice = await ask('Enter choice: ');

  switch (choice) {
    case '1':
      await authMenu();
      break;
    case '2':
      await userMenu();
      break;
    case '3':
      await vehicleMenu();
      break;
    case '4':
      await rideMenu();
      break;
    case '5':
      await tripMenu();
      break;
    case '6':
      await messageMenu();
      break;
    case '7':
      await reviewMenu();
      break;
    case '8':
      await privacyMenu();
      break;
    case '9':
      await adminMenu();
      break;
    case '10':
      await demoScenario();
      break;
    case '0':
      console.log('\n👋 Goodbye!');
      rl.close();
      process.exit(0);
  }
  
  await mainMenu();
}

async function main() {
  console.log('\n🚀 Carpooling System Console Demo');
  console.log('   Server must be running at:', API_BASE);
  console.log('');
  
  await mainMenu();
}

main().catch(console.error);
