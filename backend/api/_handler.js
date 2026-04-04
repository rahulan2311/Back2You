require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

const app = require("../src/app");
const { connectDatabase } = require("../src/config/db");

let connectPromise;

async function ensureDatabaseConnection() {
  if (!connectPromise) {
    connectPromise = connectDatabase().catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  await connectPromise;
}

module.exports = async (req, res) => {
  const requestPath = req.url || req.originalUrl || "/";
  const isHealthRequest = requestPath === "/health" || requestPath === "/api/health";

  if (!isHealthRequest) {
    await ensureDatabaseConnection();
  }

  return app(req, res);
};
