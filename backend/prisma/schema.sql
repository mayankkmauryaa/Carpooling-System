// Users Table
Table users {
  id int [pk, increment]
  email varchar [unique]
  password varchar
  firstName varchar
  lastName varchar
  phone varchar
  role role [default: 'RIDER']
  profilePicture varchar
  isProfileBlurred boolean [default: true]
  isActive boolean [default: true]
  rating float [default: 0]
  totalReviews int [default: 0]
  googleId varchar [unique]
  isGoogleUser boolean [default: false]
  emailVerified boolean [default: false]
  createdAt timestamp [default: 'now()']
  updatedAt timestamp
}
// Vehicles Table
Table vehicles {
  id int [pk, increment]
  driverId int [ref: > users.id]
  model varchar
  licensePlate varchar [unique]
  color varchar
  capacity int
  preferences json [default: '{"smoking": false, "pets": false, "music": true}']
  isActive boolean [default: true]
  registrationExpiry timestamp
  createdAt timestamp [default: 'now()']
  updatedAt timestamp
}
// RidePools Table
Table ridePools {
  id int [pk, increment]
  driverId int [ref: > users.id]
  vehicleId int [ref: > vehicles.id]
  pickupLocation json
  dropLocation json
  departureTime timestamp
  availableSeats int
  pricePerSeat float
  status ride_status [default: 'ACTIVE']
  preferences json [default: '{"smoking": false, "pets": false, "femaleOnly": false, "music": true}']
  routeData json
  bookedSeats int [default: 0]
  passengers json [default: '[]']
  createdAt timestamp [default: 'now()']
  updatedAt timestamp
}
// Trips Table
Table trips {
  id int [pk, increment]
  ridePoolId int [ref: > ridePools.id]
  driverId int [ref: > users.id]
  riderIds int
  startTime timestamp
  endTime timestamp
  status trip_status [default: 'SCHEDULED']
  totalFare float [default: 0]
  actualDistance float
  actualDuration int
  startLocation json
  endLocation json
  createdAt timestamp [default: 'now()']
  updatedAt timestamp
}
// Messages Table
Table messages {
  id int [pk, increment]
  senderId int [ref: > users.id]
  receiverId int [ref: > users.id]
  ridePoolId int [ref: > ridePools.id]
  content varchar
  isRead boolean [default: false]
  isSystemMessage boolean [default: false]
  createdAt timestamp [default: 'now()']
  updatedAt timestamp
}
// Reviews Table
Table reviews {
  id int [pk, increment]
  tripId int [ref: > trips.id]
  reviewerId int [ref: > users.id]
  revieweeId int [ref: > users.id]
  type review_type
  rating int
  comment varchar
  isVisible boolean [default: false]
  createdAt timestamp [default: 'now()']
  updatedAt timestamp
}
// SOSAlerts Table
Table sos_alerts {
  id int [pk, increment]
  userId int [ref: > users.id]
  ridePoolId int [ref: > ridePools.id]
  message varchar
  location json
  status sos_status [default: 'ACTIVE']
  acknowledgedBy int
  acknowledgedAt timestamp
  resolvedAt timestamp
  notes varchar
  createdAt timestamp [default: 'now()']
  updatedAt timestamp
}
// RideRequests Table
Table ride_requests {
  id int [pk, increment]
  ridePoolId int [ref: > ridePools.id]
  riderId int [ref: > users.id]
  status request_status [default: 'PENDING']
  pickupLocation json
  dropLocation json
  requestedAt timestamp [default: 'now()']
  approvedAt timestamp
  rejectedAt timestamp
  rejectionReason varchar
  createdAt timestamp [default: 'now()']
  updatedAt timestamp
}
// Enums
Enum role {
  DRIVER
  RIDER
  ADMIN
}
Enum ride_status {
  ACTIVE
  COMPLETED
  CANCELLED
}
Enum trip_status {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
Enum review_type {
  DRIVER_TO_RIDER
  RIDER_TO_DRIVER
}
Enum sos_status {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
}
Enum request_status {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}