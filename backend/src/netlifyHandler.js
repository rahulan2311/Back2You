const serverless = require("serverless-http");
const app = require("./app");
const { connectDatabase } = require("./config/db");

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
  const normalizedEvent = normalizeEvent(event);
  const isHealthRequest = normalizedEvent.path === "/health" || normalizedEvent.path === "/api/health";

  if (!isHealthRequest) {
    await ensureDatabaseConnection();
  }

  if (!handler) {
    handler = serverless(app);
  }

  return handler(normalizedEvent, context);
};
