import express from "express";
import { getCurrentUser, loginUser, registerUser } from "../Controller/authController.js";
import verifyToken from "../authMiddleware.js";

const router = express.Router();

router.post("/api/auth/register", registerUser);
router.post("/api/auth/login", loginUser);
router.get("/api/auth/me", verifyToken, getCurrentUser);

export default router;
