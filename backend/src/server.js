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

const getHealthPayload = () => {
  const connectionStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbState = connectionStateMap[mongoose.connection.readyState] || "unknown";
  const status = dbState === "connected" ? "ok" : "degraded";

  return {
    status,
    message: "Event management API is running",
    database: dbState,
  };
};

app.get("/", (req, res) => {
  res.status(200).json(getHealthPayload());
});

app.get("/health", (req, res) => {
  res.status(200).json(getHealthPayload());
});

app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "alive",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

const normalizeOrigin = (origin) => {
  const value = origin.trim();

  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return value.replace(/\/$/, "").toLowerCase();
  }
};

const isPrivateIpv4Host = (host) => {
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  if (parts[0] === 10) {
    return true;
  }

  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  return parts[0] === 192 && parts[1] === 168;
};

const isLocalNetworkOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    const host = (parsed.hostname || "").toLowerCase();

    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    return isPrivateIpv4Host(host);
  } catch {
    return false;
  }
};

const wildcardToRegex = (pattern) => {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`, "i");
};

const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const frontendOriginRules = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const exactAllowedOrigins = frontendOriginRules
  .filter((origin) => !origin.includes("*"))
  .map(normalizeOrigin);

const wildcardAllowedOriginPatterns = frontendOriginRules
  .filter((origin) => origin.includes("*"))
  .map((origin) => wildcardToRegex(normalizeOrigin(origin)));

wildcardAllowedOriginPatterns.push(/^https:\/\/.*\.vercel\.app$/i);

if (process.env.VERCEL_URL) {
  exactAllowedOrigins.push(normalizeOrigin(`https://${process.env.VERCEL_URL}`));
}

if (process.env.NODE_ENV !== "production") {
  exactAllowedOrigins.push(...developmentOrigins.map(normalizeOrigin));
}

const isOriginAllowed = (origin) => {
  if (process.env.NODE_ENV !== "production" && isLocalNetworkOrigin(origin)) {
    return true;
  }

  if (exactAllowedOrigins.length === 0 && wildcardAllowedOriginPatterns.length === 0) {
    return true;
  }

  if (exactAllowedOrigins.includes(origin)) {
    return true;
  }

  return wildcardAllowedOriginPatterns.some((pattern) => pattern.test(origin));
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (isOriginAllowed(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      const corsError = new Error("Not allowed by CORS");
      corsError.status = 403;
      callback(corsError);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json(getHealthPayload());
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

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.method} ${req.originalUrl || req.url || "/"}`,
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = Number(error?.status || error?.statusCode || 500);
  const message = error?.message || "Internal server error";

  res.status(status).json({
    status: "error",
    message,
  });
});

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
