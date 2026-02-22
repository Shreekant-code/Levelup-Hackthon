// models/User.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  targetRole: {
    type: String
  },
  dailyAvailableHours: {
    type: Number,
    default: 2
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  streakCount: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
