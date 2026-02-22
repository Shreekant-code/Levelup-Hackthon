

import mongoose from "mongoose";

const productivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  date: {
    type: Date,
    default: Date.now
  },
  completionRate: Number,
  focusScore: Number,
  streakBonus: Number,
  totalScore: Number
});

export default mongoose.model("ProductivityScore", productivitySchema);