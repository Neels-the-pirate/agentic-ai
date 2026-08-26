const mongoose = require('mongoose');
const config = require('./env');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let uri = config.mongoUri;

    if (!uri) {
      console.log('[Database] No MONGODB_URI provided. Initializing in-memory MongoDB server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      console.log(`[Database] In-memory MongoDB running at: ${uri}`);
    } else {
      console.log(`[Database] Connecting to MongoDB at ${uri.split('@').pop()}...`);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('[Database] MongoDB connection established successfully.');
  } catch (error) {
    console.warn(`[Database] External MongoDB connection failed (${error.message}). Falling back to in-memory MongoDB...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const fallbackUri = mongoMemoryServer.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`[Database] In-memory MongoDB fallback established successfully at: ${fallbackUri}`);
    } catch (inMemErr) {
      console.error('[Database] Fatal: Unable to initialize in-memory MongoDB fallback:', inMemErr.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
