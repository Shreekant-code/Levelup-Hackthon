import User from "../Schema/User.js";
import Task from "../Schema/Task.js";
import { notifyUserEvent } from "../Utils/notificationService.js";

const difficultyXpMap = {
  easy: 20,
  medium: 50,
  hard: 100,
};

const dayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const estimateDailyXp = (completedTodayTasks) =>
  completedTodayTasks.reduce((sum, task) => {
    const difficulty = String(task.difficulty || "easy").toLowerCase();
    return sum + (difficultyXpMap[difficulty] || 20);
  }, 0);

const processDailyUserEmails = async (user) => {
  const { start, end } = dayBounds();
  const completedTodayTasks = await Task.find({
    userId: user._id,
    status: "completed",
    updatedAt: { $gte: start, $lt: end },
  }).select("difficulty title");

  const tasksCompleted = completedTodayTasks.length;
  const xpGained = estimateDailyXp(completedTodayTasks);

  await notifyUserEvent({
    userId: user._id,
    email: user.email,
    username: user.name,
    type: "daily_summary",
    message: `Daily summary: ${tasksCompleted} tasks completed, ${xpGained} XP gained.`,
    sendEmail: true,
    additionalData: {
      eventKey: `${start.toISOString().slice(0, 10)}-daily-summary`,
      dayKey: start.toISOString().slice(0, 10),
      tasksCompleted,
      xpGained,
      streakCount: user.streakCount || 0,
      reinforcementSuggestion:
        tasksCompleted > 0
          ? "Great consistency today. Start tomorrow with your highest-impact task."
          : "Recovery mode: complete one small task first tomorrow to rebuild momentum.",
    },
  });

  if (tasksCompleted === 0) {
    await notifyUserEvent({
      userId: user._id,
      email: user.email,
      username: user.name,
      type: "penalty_warning",
      message: "No task completion detected today. Recovery recommendation generated.",
      sendEmail: true,
      additionalData: {
        eventKey: `${start.toISOString().slice(0, 10)}-no-completion`,
        dayKey: start.toISOString().slice(0, 10),
        roadmapCompletionRate: 0,
        reinforcementSuggestion:
          "No completion detected today. Use a 25-minute focused sprint to restart progress.",
      },
    });
  }

  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  if (lastActive) {
    const yesterday = new Date(start);
    yesterday.setDate(yesterday.getDate() - 1);
    const streakBroken = lastActive.getTime() < yesterday.getTime();

    if (streakBroken) {
      await notifyUserEvent({
        userId: user._id,
        email: user.email,
        username: user.name,
        type: "streak_broken",
        message: "Streak broken detected in daily check.",
        sendEmail: true,
        additionalData: {
          eventKey: `${start.toISOString().slice(0, 10)}-streak-break`,
          dayKey: start.toISOString().slice(0, 10),
          streakCount: user.streakCount || 0,
          reinforcementSuggestion:
            "Complete one focused task daily for the next 3 days to recover your streak.",
        },
      });
    }
  }
};

const runStreakWarningJob = async () => {
  try {
    const users = await User.find({ streakCount: { $gt: 0 } }).select("name email streakCount");
    const { start, end } = dayBounds();

    await Promise.all(
      users.map(async (user) => {
        const completedToday = await Task.countDocuments({
          userId: user._id,
          status: "completed",
          updatedAt: { $gte: start, $lt: end },
        });

        if (completedToday > 0) return;

        await notifyUserEvent({
          userId: user._id,
          email: user.email,
          username: user.name,
          type: "streak_warning",
          message: "No task completed yet today. Your streak is about to break.",
          sendEmail: true,
          additionalData: {
            eventKey: `${start.toISOString().slice(0, 10)}-streak-warning`,
            dayKey: start.toISOString().slice(0, 10),
            streakCount: user.streakCount || 0,
            reinforcementSuggestion:
              "Complete one focused task before 8PM to keep your streak alive.",
          },
        });
      })
    );
  } catch (error) {
    console.error("Streak warning scheduler failed:", error?.message || error);
  }
};

const runDailySummaryJob = async () => {
  try {
    const users = await User.find({}).select("name email streakCount lastActiveDate");
    await Promise.all(users.map((user) => processDailyUserEmails(user)));
  } catch (error) {
    console.error("Daily email scheduler failed:", error?.message || error);
  }
};

export const initEmailScheduler = async () => {
  try {
    const cronModule = await import("node-cron").catch(() => null);
    if (!cronModule?.default?.schedule) {
      console.warn("node-cron is not installed. Daily summary scheduler not started.");
      return;
    }

    cronModule.default.schedule("59 23 * * *", () => {
      runDailySummaryJob();
    });
    cronModule.default.schedule("0 20 * * *", () => {
      runStreakWarningJob();
    });

    console.log("Email scheduler initialized: streak warning 8:00 PM, summary 11:59 PM.");
  } catch (error) {
    console.error("Failed to initialize email scheduler:", error?.message || error);
  }
};
