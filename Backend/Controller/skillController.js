import Skill from "../Schema/Skill.js";
import User from "../Schema/User.js";
import { notifyUserEvent } from "../Utils/notificationService.js";

export const createSkill = async (req, res) => {
  try {
    const { skillName, level, progressPercentage } = req.body;

    if (!skillName) {
      return res.status(400).json({ message: "skillName is required" });
    }

    const skill = await Skill.create({
      userId: req.user,
      skillName,
      ...(typeof level === "number" ? { level } : {}),
      ...(typeof progressPercentage === "number" ? { progressPercentage } : {}),
    });

    const user = await User.findById(req.user).select("name email");
    if (user) {
      void notifyUserEvent({
        userId: user._id,
        email: user.email,
        username: user.name,
        type: "skill_added",
        message: `New skill added: ${skill.skillName}.`,
        sendEmail: true,
        additionalData: {
          eventKey: `skill-added-${skill._id.toString()}`,
          skillName: skill.skillName,
          forceEmail: true,
        },
      });
    }

    return res.status(201).json(skill);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.user }).sort({ createdAt: -1 });
    return res.status(200).json(skills);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateSkill = async (req, res) => {
  try {
    const { progressPercentage, skillName, level } = req.body;

    const updates = {};
    if (typeof progressPercentage === "number") updates.progressPercentage = progressPercentage;
    if (skillName !== undefined) updates.skillName = skillName;
    if (typeof level === "number") updates.level = level;

    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      updates,
      { new: true }
    );

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    if (typeof progressPercentage === "number") {
      const user = await User.findById(req.user).select("name email");
      if (user) {
        void notifyUserEvent({
          userId: user._id,
          email: user.email,
          username: user.name,
          type: "skill_progress_updated",
          message: `${skill.skillName} updated to ${progressPercentage}% progress.`,
          sendEmail: true,
          additionalData: {
            eventKey: `skill-progress-${skill._id.toString()}-${progressPercentage}`,
            skillName: skill.skillName,
            progressPercentage,
            forceEmail: true,
          },
        });
      }
    }

    return res.status(200).json(skill);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};
