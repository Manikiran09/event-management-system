import express from "express";
import {
  cancelRegistration,
  myRegistrations,
  registerForEvent,
} from "../controllers/registrationController.js";
import { authRequired, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authRequired, allowRoles("participant"), myRegistrations);
router.post("/:eventId", authRequired, allowRoles("participant"), registerForEvent);
router.patch("/:eventId/cancel", authRequired, allowRoles("participant"), cancelRegistration);

export default router;
