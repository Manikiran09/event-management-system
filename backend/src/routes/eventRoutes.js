import express from "express";
import { createEvent, deleteEvent, listEvents, updateEvent } from "../controllers/eventController.js";
import { authRequired, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, allowRoles("admin", "organizer", "participant"), listEvents);
router.post("/", authRequired, allowRoles("admin", "organizer"), createEvent);
router.patch("/:eventId", authRequired, allowRoles("admin", "organizer"), updateEvent);
router.delete("/:eventId", authRequired, allowRoles("admin", "organizer"), deleteEvent);

export default router;
