const mongoose = require("mongoose");

let connectPromise;
let databaseState = {
  connected: false,
  lastError: null,
  lastAttemptAt: null,
  connectedAt: null
};

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    const error = new Error("MONGO_URI is required. For local development, set MONGO_URI=mongodb://127.0.0.1:27017/back2you in backend/.env");
    databaseState = {
      ...databaseState,
      connected: false,
      lastError: error,
      lastAttemptAt: new Date().toISOString()
    };
    throw error;
  }

  if (!connectPromise) {
    databaseState = {
      ...databaseState,
      lastAttemptAt: new Date().toISOString()
    };

    connectPromise = mongoose.connect(mongoUri).then(() => {
      databaseState = {
        connected: true,
        lastError: null,
        lastAttemptAt: databaseState.lastAttemptAt,
        connectedAt: new Date().toISOString()
      };
      console.log("MongoDB connected");
      return mongoose.connection;
    }).catch((error) => {
      databaseState = {
        ...databaseState,
        connected: false,
        lastError: error
      };
      connectPromise = null;
      throw error;
    });
  }

  return connectPromise;
}

function isDatabaseReady() {
  return databaseState.connected && mongoose.connection.readyState === 1;
}

function getDatabaseStatus() {
  return {
    connected: isDatabaseReady(),
    lastAttemptAt: databaseState.lastAttemptAt,
    connectedAt: databaseState.connectedAt,
    readyState: mongoose.connection.readyState,
    error: databaseState.lastError
      ? {
          message: databaseState.lastError.message,
          name: databaseState.lastError.name
        }
      : null
  };
}

module.exports = {
  connectDatabase,
  isDatabaseReady,
  getDatabaseStatus
};
