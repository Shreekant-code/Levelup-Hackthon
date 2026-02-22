

// models/StudyLog.js

import mongoose from "mongoose";

const studyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  date: {
    type: Date,
    default: Date.now
  },
  focusHours: {
    type: Number,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("StudyLog", studyLogSchema);