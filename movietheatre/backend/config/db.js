const mongoose = require('mongoose');

let retries = 0;
const MAX_RETRIES = 5;

async function connectDB() {
  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      retries++;
      console.error(`DB connection attempt ${retries} failed: ${err.message}`);
      if (retries >= MAX_RETRIES) {
        console.error('Could not connect to MongoDB. Exiting.');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

module.exports = connectDB;
