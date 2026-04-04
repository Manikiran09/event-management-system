import express from "express";
import {
	login,
	register,
	me,
	listUsers,
	createUserByAdmin,
	updateUserByAdmin,
	deleteUserByAdmin,
	approveUser,
	rejectUser,
	pendingSignups,
} from "../controllers/authController.js";
import { authRequired, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authRequired, me);
router.get("/users", authRequired, allowRoles("admin"), listUsers);
router.post("/users", authRequired, allowRoles("admin"), createUserByAdmin);
router.get("/users/pending", authRequired, allowRoles("admin"), pendingSignups);
router.patch("/users/:userId", authRequired, allowRoles("admin"), updateUserByAdmin);
router.delete("/users/:userId", authRequired, allowRoles("admin"), deleteUserByAdmin);
router.patch("/users/:userId/approve", authRequired, allowRoles("admin"), approveUser);
router.patch("/users/:userId/reject", authRequired, allowRoles("admin"), rejectUser);

export default router;
