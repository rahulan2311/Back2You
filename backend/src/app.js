const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const claimRoutes = require("./routes/claimRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const dataRoutes = require("./routes/dataRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { getDatabaseStatus, isDatabaseReady } = require("./config/db");

const app = express();
const frontendDir = path.join(__dirname, "..", "..", "frontend");
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

function healthHandler(req, res) {
  const payload = {
    success: true,
    message: "Back2You API is running"
  };

  if (!isProduction) {
    payload.database = getDatabaseStatus();
  }

  res.status(200).json(payload);
}

function requireDatabase(req, res, next) {
  if (isDatabaseReady()) {
    return next();
  }

  const response = {
    success: false,
    message: "Database unavailable. The API is running, but data-backed routes are temporarily unavailable."
  };

  if (!isProduction) {
    response.database = getDatabaseStatus();
  }

  return res.status(503).json(response);
}

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

app.use(["/api/auth", "/auth", "/api/items", "/items", "/api/claims", "/claims", "/api/feedback", "/feedback", "/api/data", "/data"], requireDatabase);
app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/items", "/items"], itemRoutes);
app.use(["/api/claims", "/claims"], claimRoutes);
app.use(["/api/feedback", "/feedback"], feedbackRoutes);
app.use(["/api/data", "/data"], dataRoutes);

app.use(express.static(frontendDir));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
