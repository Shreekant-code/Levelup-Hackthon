import express from "express";
import verifyToken from "../authMiddleware.js";
import { createStudyLog, getStudyLogs } from "../Controller/studyLogController.js";

const router = express.Router();

router.post("/api/study-log", verifyToken, createStudyLog);
router.get("/api/study-log", verifyToken, getStudyLogs);

export default router;
