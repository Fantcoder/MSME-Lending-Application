const mongoose = require('mongoose');

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/msme_lending_audit';

/**
 * Connect to MongoDB with retry logic.
 * Mongoose buffers commands until connected, but we want explicit confirmation.
 */
const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    console.log('[MongoDB] Connection verified');
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    throw err;
  }
};

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Runtime error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected');
});

module.exports = { connectMongo, mongoose };
