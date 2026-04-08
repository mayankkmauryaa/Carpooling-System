// Connect to MongoDB
const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
    try {
        // mongoose.connect() tries to connect to MongoDB
        const conn = await mongoose.connect(config.MONGODB_URI);

        // If successful, log the host name
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch(error){
        // If failed, log the error and stop the app
        console.log(`Error: ${error.message}`);
        process.exit(1);
        // 1 means something went wrong
    }
}

module.exports = connectDB;

// Why this file?
// - Separate database connection logic
// - Can be reused in different files
// - Centralizes connection error handling