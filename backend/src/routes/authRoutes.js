import express from "express";
import {
	login,
	logout,
	register,
	me,
	updateProfile,
	listUsers,
	createUserByAdmin,
	updateUserByAdmin,
	deleteUserByAdmin,
	deleteUsersByAdmin,
	approveUser,
	rejectUser,
	pendingSignups,
} from "../controllers/authController.js";
import { authRequired, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authRequired, logout);
router.get("/me", authRequired, me);
router.patch("/profile", authRequired, updateProfile);
router.get("/users", authRequired, allowRoles("admin"), listUsers);
router.post("/users", authRequired, allowRoles("admin"), createUserByAdmin);
router.delete("/users", authRequired, allowRoles("admin"), deleteUsersByAdmin);
router.get("/users/pending", authRequired, allowRoles("admin"), pendingSignups);
router.patch("/users/:userId", authRequired, allowRoles("admin"), updateUserByAdmin);
router.delete("/users/:userId", authRequired, allowRoles("admin"), deleteUserByAdmin);
router.patch("/users/:userId/approve", authRequired, allowRoles("admin"), approveUser);
router.patch("/users/:userId/reject", authRequired, allowRoles("admin"), rejectUser);

export default router;
