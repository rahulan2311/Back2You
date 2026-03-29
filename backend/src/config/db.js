const mongoose = require("mongoose");

let connectPromise;

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(mongoUri).then(() => {
      console.log("MongoDB connected");
      return mongoose.connection;
    }).catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  return connectPromise;
}

module.exports = {
  connectDatabase
};
