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

const app = express();

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
  res.status(200).json({
    success: true,
    message: "Back2You API is running"
  });
}

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/items", "/items"], itemRoutes);
app.use(["/api/claims", "/claims"], claimRoutes);
app.use(["/api/feedback", "/feedback"], feedbackRoutes);
app.use(["/api/data", "/data"], dataRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
