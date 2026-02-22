import Task from "../Schema/Task.js";
import User from "../Schema/User.js";
import StudyLog from "../Schema/StudyLog.js";
import ProductivityScore from "../Schema/Productivity.js";

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const calculateProductivityScore = async (userId) => {
  const [totalTasks, completedTasks, user] = await Promise.all([
    Task.countDocuments({ userId }),
    Task.countDocuments({ userId, status: "completed" }),
    User.findById(userId),
  ]);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const today = getDayRange(new Date());
  const todayStudyLog = await StudyLog.findOne({
    userId,
    date: { $gte: today.start, $lt: today.end },
  }).sort({ date: -1 });

  const focusHours = todayStudyLog ? todayStudyLog.focusHours : 0;
  const focusScore = user.dailyAvailableHours > 0 ? focusHours / user.dailyAvailableHours : 0;

  const previousDay = new Date();
  previousDay.setDate(previousDay.getDate() - 1);
  const yesterday = getDayRange(previousDay);

  const yesterdayLog = await StudyLog.findOne({
    userId,
    date: { $gte: yesterday.start, $lt: yesterday.end },
  });

  const streakBonus = yesterdayLog ? 0.3 : 0;

  const totalScore = completionRate * 0.4 + focusScore * 0.3 + streakBonus * 0.3;

  const score = await ProductivityScore.create({
    userId,
    date: new Date(),
    completionRate,
    focusScore,
    streakBonus,
    totalScore,
  });

  return score;
};

export const createProductivityScore = async (req, res) => {
  try {
    const score = await calculateProductivityScore(req.user);
    return res.status(201).json(score);
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

export const getProductivityScores = async (req, res) => {
  try {
    const scores = await ProductivityScore.find({ userId: req.user }).sort({ date: -1 });
    return res.status(200).json(scores);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};
