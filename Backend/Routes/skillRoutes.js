import express from "express";
import verifyToken from "../authMiddleware.js";
import { createSkill, getSkills, updateSkill } from "../Controller/skillController.js";

const router = express.Router();

router.post("/api/skills", verifyToken, createSkill);
router.get("/api/skills", verifyToken, getSkills);
router.put("/api/skills/:id", verifyToken, updateSkill);

export default router;
