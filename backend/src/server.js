import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import { authRequired, allowRoles } from "./middleware/auth.js";

dotenv.config();

const app = express();

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "").toLowerCase();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

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
  res.json({ status: "ok", message: "Event management API is running" });
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

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
