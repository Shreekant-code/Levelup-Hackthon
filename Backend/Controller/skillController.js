import Skill from "../Schema/Skill.js";

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

    return res.status(200).json(skill);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};
