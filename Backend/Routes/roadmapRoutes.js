import express from "express";
import verifyToken from "../authMiddleware.js";
import { generateRoadmap, getLatestRoadmap } from "../Controller/roadmapController.js";

const router = express.Router();

router.post("/api/generate-roadmap", verifyToken, generateRoadmap);
router.get("/api/roadmap/latest", verifyToken, getLatestRoadmap);

export default router;
