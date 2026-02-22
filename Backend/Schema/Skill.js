

import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  skillName: String,
  level: {
    type: Number,
    default: 1
  },
  progressPercentage: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("Skill", skillSchema);