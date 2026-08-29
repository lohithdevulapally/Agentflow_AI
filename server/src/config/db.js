const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;
let isInMemoryFallback = false;

// In-Memory Data Store for resilient local development when MongoDB daemon is not running
const inMemoryStore = {
  users: new Map(),
  workflows: new Map(),
  executions: new Map(),
  executionLogs: new Map(),
  integrations: new Map(),
  notifications: new Map(),
  agentMemories: new Map(),
};

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return { isConnected, isInMemoryFallback };
  } catch (error) {
    console.warn(`[Database] MongoDB connection failed (${error.message}).`);
    console.log('[Database] Activating high-speed In-Memory Document Store Fallback for local development.');
    isConnected = true;
    isInMemoryFallback = true;
    return { isConnected, isInMemoryFallback };
  }
};

const getDBStatus = () => ({
  isConnected,
  isInMemoryFallback,
  type: isInMemoryFallback ? 'In-Memory Store (Resilient Fallback)' : 'MongoDB Atlas / Local',
  timestamp: new Date().toISOString(),
});

module.exports = {
  connectDB,
  getDBStatus,
  inMemoryStore,
};
