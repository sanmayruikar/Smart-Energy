const mongoose = require('mongoose');

const dbStatus = {
  connected: false,
  status: 'DISCONNECTED',
  mode: 'DEMO_IN_MEMORY',
  uri: '',
  error: null,
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_energy';
  dbStatus.uri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'); // mask credentials in logs

  const isAtlas = uri.startsWith('mongodb+srv://');

  try {
    // Attempt standard connection to MongoDB (local or Atlas)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });

    dbStatus.connected = true;
    dbStatus.status = 'CONNECTED';
    dbStatus.mode = isAtlas ? 'MongoDB Atlas' : 'MongoDB Local';
    dbStatus.error = null;

    console.log('=======================================================');
    console.log(`DATABASE: CONNECTED (${dbStatus.mode})`);
    console.log(`MongoDB URI: ${dbStatus.uri}`);
    console.log('=======================================================');
  } catch (err) {
    dbStatus.connected = false;
    dbStatus.status = 'DISCONNECTED';
    dbStatus.mode = 'DEMO_IN_MEMORY';
    dbStatus.error = err.message;

    console.warn('=======================================================');
    console.warn('DATABASE: DISCONNECTED');
    console.warn(`Reason: ${err.message}`);
    console.warn('Active Storage: DEMO IN-MEMORY FALLBACK (Simulation Mode)');
    console.warn('Note: Full dashboard, simulation, and analytics are working in demo mode.');
    console.warn('To connect to real MongoDB:');
    console.warn('  A. Start local MongoDB: net start MongoDB (or run mongod)');
    console.warn('  B. Or configure MongoDB Atlas in backend/.env:');
    console.warn('     MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smart_energy');
    console.warn('=======================================================');
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  dbStatus.connected = false;
  dbStatus.status = 'DISCONNECTED';
};

const getDbStatus = () => ({ ...dbStatus });

module.exports = { connectDB, disconnectDB, getDbStatus };
