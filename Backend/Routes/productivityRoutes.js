import express from "express";
import verifyToken from "../authMiddleware.js";
import { createProductivityScore, getProductivityScores } from "../Controller/productivityController.js";

const router = express.Router();

router.post("/api/productivity/calculate", verifyToken, createProductivityScore);
router.get("/api/productivity", verifyToken, getProductivityScores);

export default router;
