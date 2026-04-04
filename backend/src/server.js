const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = require("./app");
const { connectDatabase } = require("./config/db");

const PORT = process.env.PORT || 5000;
const RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 10000);

function scheduleReconnect() {
  setTimeout(() => {
    connectDatabase().catch((error) => {
      console.error(`MongoDB connection retry failed: ${error.message}`);
      scheduleReconnect();
    });
  }, RETRY_DELAY_MS);
}

app.listen(PORT, () => {
  console.log(`Back2You backend running on port ${PORT}`);
});

connectDatabase().catch((error) => {
  console.error(`MongoDB connection failed at startup: ${error.message}`);
  console.error(`API will stay online in degraded mode and retry in ${RETRY_DELAY_MS}ms`);
  scheduleReconnect();
});
