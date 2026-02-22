// models/Task.js

import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: String,
  subject: String,
  deadline: Date,
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy"
  },
  weaknessLevel: Number, // 1-5
  priorityScore: Number,
  xpAwarded: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);
