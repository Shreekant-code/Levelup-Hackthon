import express from "express";
import verifyToken from "../authMiddleware.js";
import { createTask, deleteTask, getTasks, updateTask } from "../Controller/taskController.js";

const router = express.Router();

router.post("/api/tasks", verifyToken, createTask);
router.get("/api/tasks", verifyToken, getTasks);
router.put("/api/tasks/:id", verifyToken, updateTask);
router.delete("/api/tasks/:id", verifyToken, deleteTask);

export default router;
