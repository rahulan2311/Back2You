const serverless = require("serverless-http");
const app = require("../../backend/src/app");
const { connectDatabase } = require("../../backend/src/config/db");

let connectPromise;
let handler;

async function ensureDatabaseConnection() {
  if (!connectPromise) {
    connectPromise = connectDatabase().catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  await connectPromise;
}

function normalizeEvent(event) {
  const normalizedPath = event.path
    ? event.path.replace(/^\/\.netlify\/functions\/api/, "")
    : event.path;

  return {
    ...event,
    path: normalizedPath || "/",
    rawUrl: event.rawUrl
      ? event.rawUrl.replace("/.netlify/functions/api", "")
      : event.rawUrl
  };
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await ensureDatabaseConnection();

  if (!handler) {
    handler = serverless(app);
  }

  return handler(normalizeEvent(event), context);
};
