import express from "express";
import verifyToken from "../authMiddleware.js";
import { generateRoadmap } from "../Controller/roadmapController.js";

const router = express.Router();

router.post("/api/generate-roadmap", verifyToken, generateRoadmap);

export default router;
