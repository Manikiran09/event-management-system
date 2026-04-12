import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import { authRequired, allowRoles } from "./middleware/auth.js";

dotenv.config();

const app = express();

const normalizeOrigin = (origin) => {
  const value = origin.trim();

  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return value.replace(/\/$/, "").toLowerCase();
  }
};

const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean)
  .concat(process.env.NODE_ENV === "production" ? [] : developmentOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  const connectionStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbState = connectionStateMap[mongoose.connection.readyState] || "unknown";
  const status = dbState === "connected" ? "ok" : "degraded";

  res.json({ status, message: "Event management API is running", database: dbState });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);

app.get("/api/admin/overview", authRequired, allowRoles("admin"), (req, res) => {
  res.json({ message: "Admin dashboard data" });
});

app.get(
  "/api/organizer/overview",
  authRequired,
  allowRoles("admin", "organizer"),
  (req, res) => {
    res.json({ message: "Organizer dashboard data" });
  }
);

app.get(
  "/api/participant/overview",
  authRequired,
  allowRoles("admin", "organizer", "participant"),
  (req, res) => {
    res.json({ message: "Participant dashboard data" });
  }
);

const PORT = process.env.PORT || 5112;
const DB_RETRY_DELAY_MS = 5000;

const connectWithRetry = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error(`MongoDB connect failed: ${error.message}. Retrying in ${DB_RETRY_DELAY_MS / 1000}s...`);
    setTimeout(connectWithRetry, DB_RETRY_DELAY_MS);
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectWithRetry();
});
