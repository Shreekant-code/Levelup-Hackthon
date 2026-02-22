import Task from "../Schema/Task.js";
import User from "../Schema/User.js";
import { notifyUserEvent } from "../Utils/notificationService.js";

const calculatePriorityScore = (weaknessLevel, deadline) => {
  const now = new Date();
  const targetDate = new Date(deadline);
  const diff = targetDate.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return weaknessLevel * 0.4 + (1 / daysLeft) * 0.6;
};

const difficultyXpMap = {
  easy: 20,
  medium: 50,
  hard: 100,
};

const calculateStreakAndBonus = (user) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

  if (!last) {
    return { streakCount: 1, bonusXp: 10 };
  }

  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { streakCount: user.streakCount || 1, bonusXp: 0 };
  }

  if (diffDays === 1) {
    const nextStreak = (user.streakCount || 0) + 1;
    return { streakCount: nextStreak, bonusXp: Math.min(nextStreak * 10, 100) };
  }

  return { streakCount: 1, bonusXp: 10 };
};

export const createTask = async (req, res) => {
  try {
    const { title, subject, deadline, weaknessLevel, status, difficulty } = req.body;

    if (!title || !subject || !deadline || typeof weaknessLevel !== "number") {
      return res.status(400).json({ message: "title, subject, deadline, weaknessLevel are required" });
    }

    const priorityScore = calculatePriorityScore(weaknessLevel, deadline);

    const task = await Task.create({
      userId: req.user,
      title,
      subject,
      deadline,
      difficulty: difficulty || "easy",
      weaknessLevel,
      priorityScore,
      status: status || "pending",
    });

    const user = await User.findById(req.user).select("name email");
    if (user) {
      void notifyUserEvent({
        userId: user._id,
        email: user.email,
        username: user.name,
        type: "task_added",
        message: `New task added: ${task.title} (${task.subject}).`,
        sendEmail: true,
        additionalData: {
          eventKey: `task-added-${task._id.toString()}`,
          taskId: task._id.toString(),
          taskTitle: task.title,
          focusArea: task.subject,
          forceEmail: true,
        },
      });
    }

    return res.status(201).json(task);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user }).sort({ createdAt: -1 });
    return res.status(200).json(tasks);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const taskToUpdate = await Task.findOne({ _id: req.params.id, userId: req.user });

    if (!taskToUpdate) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updates = { ...req.body };
    delete updates.userId;

    const nextWeaknessLevel =
      typeof updates.weaknessLevel === "number" ? updates.weaknessLevel : taskToUpdate.weaknessLevel;
    const nextDeadline = updates.deadline || taskToUpdate.deadline;

    if (updates.weaknessLevel !== undefined || updates.deadline !== undefined) {
      updates.priorityScore = calculatePriorityScore(nextWeaknessLevel, nextDeadline);
    }

    const markAsCompleted = updates.status === "completed" && taskToUpdate.status !== "completed";
    if (markAsCompleted && !taskToUpdate.xpAwarded) {
      const user = await User.findById(req.user);
      if (user) {
        const previousLevel = user.level || 1;
        const previousStreak = user.streakCount || 0;
        const effectiveDifficulty = updates.difficulty || taskToUpdate.difficulty || "easy";
        const baseXp = difficultyXpMap[effectiveDifficulty] || 20;
        const { streakCount, bonusXp } = calculateStreakAndBonus(user);
        const totalXpGain = baseXp + bonusXp;

        user.xp = (user.xp || 0) + totalXpGain;
        user.level = Math.floor((user.xp || 0) / 200) + 1;
        user.streakCount = streakCount;
        user.lastActiveDate = new Date();
        await user.save();

        updates.xpAwarded = true;

        void notifyUserEvent({
          userId: user._id,
          email: user.email,
          username: user.name,
          type: "task_complete",
          message: `Task completed: ${taskToUpdate.title}. You earned ${totalXpGain} XP.`,
          sendEmail: totalXpGain >= 100,
          additionalData: {
            taskId: taskToUpdate._id.toString(),
            taskTitle: taskToUpdate.title,
            xpEarned: totalXpGain,
            streakCount: user.streakCount || 0,
            eventKey: `task-complete-${taskToUpdate._id.toString()}`,
            forceEmail: totalXpGain >= 100,
          },
        });

        if ((user.streakCount || 0) > previousStreak) {
          void notifyUserEvent({
            userId: user._id,
            email: user.email,
            username: user.name,
            type: "streak_update",
            message: `Streak increased to ${user.streakCount || 0} day(s).`,
            sendEmail: false,
            additionalData: {
              eventKey: `streak-update-${new Date().toISOString().slice(0, 10)}`,
              streakCount: user.streakCount || 0,
            },
          });
        }

        if ((user.level || 1) > previousLevel) {
          void notifyUserEvent({
            userId: user._id,
            email: user.email,
            username: user.name,
            type: "level_up",
            message: `Level up! You reached Level ${user.level || 1}.`,
            sendEmail: true,
            additionalData: {
              eventKey: `level-up-${user.level}`,
              newLevel: user.level || 1,
              xpEarned: totalXpGain,
            },
          });
        }
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      updates,
      { new: true }
    );

    return res.status(200).json(task);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ message: "Task deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};
