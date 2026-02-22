import mongoose from 'mongoose'
import User from '../Schema/User.js'
import Skill from '../Schema/Skill.js'
import ProductivityScore from '../Schema/Productivity.js'

const motivationLines = [
  'Small daily execution beats occasional intensity.',
  'Consistency today makes advanced work easier tomorrow.',
  'Focus on quality reps and measurable progress.',
  'Your growth comes from deliberate, repeatable effort.',
  'Keep momentum and reduce context switching.',
  'Treat feedback as data and iterate fast.',
  'Strong finish today unlocks a better week ahead.',
]

const iconRules = [
  { key: 'frontend', icon: 'Monitor' },
  { key: 'react', icon: 'Monitor' },
  { key: 'ui', icon: 'Monitor' },
  { key: 'backend', icon: 'Server' },
  { key: 'api', icon: 'Server' },
  { key: 'node', icon: 'Server' },
  { key: 'database', icon: 'Database' },
  { key: 'mongo', icon: 'Database' },
  { key: 'sql', icon: 'Database' },
  { key: 'dsa', icon: 'Brain' },
  { key: 'algorithm', icon: 'Brain' },
  { key: 'system design', icon: 'Network' },
  { key: 'architecture', icon: 'Network' },
  { key: 'ai', icon: 'Cpu' },
  { key: 'ml', icon: 'Cpu' },
  { key: 'analytics', icon: 'BarChart3' },
  { key: 'analysis', icon: 'BarChart3' },
  { key: 'design', icon: 'Palette' },
  { key: 'revision', icon: 'RefreshCcw' },
  { key: 'review', icon: 'RefreshCcw' },
  { key: 'project', icon: 'Rocket' },
  { key: 'capstone', icon: 'Rocket' },
]

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const normalizeDailyHours = (hours) => {
  const numeric = Number(hours)
  if (!Number.isFinite(numeric)) return 2
  return clamp(numeric, 1, 10)
}

const normalizeScore = (score) => {
  const numeric = Number(score)
  if (!Number.isFinite(numeric)) return 0
  return clamp(numeric, 0, 1)
}

const normalizeLevel = (level) => {
  const numeric = Number(level)
  if (!Number.isFinite(numeric)) return 1
  return Math.max(1, Math.floor(numeric))
}

const iconFromTopic = (focusTopic) => {
  const topic = String(focusTopic || '').toLowerCase()
  for (const rule of iconRules) {
    if (topic.includes(rule.key)) return rule.icon
  }
  return 'Rocket'
}

const uniqueTopics = (topics) => {
  const seen = new Set()
  const output = []
  for (const topic of topics) {
    const value = String(topic || '').trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }
  return output
}

const buildDynamicTopicPool = ({ targetRole, skills }) => {
  const role = String(targetRole || '').trim() || 'Target Role'

  const weakestSkills = skills
    .filter((skill) => typeof skill.skillName === 'string' && skill.skillName.trim())
    .sort((a, b) => (a.progressPercentage || 0) - (b.progressPercentage || 0))
    .slice(0, 3)

  const strongerSkills = skills
    .filter((skill) => typeof skill.skillName === 'string' && skill.skillName.trim())
    .sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))
    .slice(0, 2)

  if (weakestSkills.length) {
    const weakTopics = weakestSkills.map((skill) => `${skill.skillName} skill improvement`)
    const supportTopics = strongerSkills.map((skill) => `${skill.skillName} reinforcement`)

    return uniqueTopics([
      ...weakTopics,
      `${role} practical implementation`,
      ...supportTopics,
      `${role} project integration`,
      `${role} revision and optimization`,
    ])
  }

  return uniqueTopics([
    `${role} fundamentals`,
    `${role} practical workflows`,
    `${role} implementation patterns`,
    `${role} performance optimization`,
    `${role} system design`,
    `${role} project development`,
    `${role} revision and polish`,
  ])
}

const createTaskSet = ({ focusTopic, dayNumber, estimatedHours, stageLabel }) => {
  const blockA = Math.max(1, Number((estimatedHours * 0.4).toFixed(1)))
  const blockB = Math.max(1, Number((estimatedHours * 0.35).toFixed(1)))
  const blockC = Math.max(1, Number((estimatedHours * 0.25).toFixed(1)))

  return [
    `${stageLabel}: work on ${focusTopic} for ${blockA} hour(s) with clear deliverable`,
    `Practice session: complete targeted exercises on ${focusTopic} for ${blockB} hour(s)`,
    `Review and iteration: summarize learnings and refine one output in ${blockC} hour(s)`,
  ]
}

const buildDynamicFallbackRoadmap = ({ targetRole, skills, level, dailyAvailableHours, productivityScore }) => {
  const topics = buildDynamicTopicPool({ targetRole, skills })
  const baseHours = normalizeDailyHours(dailyAvailableHours)
  const levelFactor = (normalizeLevel(level) - 1) * 0.08
  const score = normalizeScore(productivityScore)
  const productivityFactor = score < 0.4 ? -0.25 : score > 0.75 ? 0.35 : 0.1

  const stageByDay = [
    'Foundation',
    'Foundation+',
    'Build',
    'Build+',
    'Applied',
    'Advanced',
    'Capstone',
  ]

  return Array.from({ length: 7 }, (_, index) => {
    const dayNumber = index + 1
    const topic = topics[index % topics.length]

    const progressionFactor = -0.2 + index * 0.12
    const estimatedHours = Number(
      clamp(baseHours + levelFactor + productivityFactor + progressionFactor, 1, 10).toFixed(1)
    )

    const xpBase = 35 + normalizeLevel(level) * 6
    const xpReward = Math.round(xpBase + dayNumber * 8 + Math.max(0, score - 0.5) * 20)

    return {
      day: `Day ${dayNumber}`,
      focusTopic: topic,
      icon: iconFromTopic(topic),
      tasks: createTaskSet({
        focusTopic: topic,
        dayNumber,
        estimatedHours,
        stageLabel: stageByDay[index],
      }).slice(0, 3),
      estimatedHours,
      xpReward,
      motivationalMessage: motivationLines[index % motivationLines.length],
    }
  })
}

const buildPrompt = ({ user, skills, latestScore }) => {
  const weakestSkills = skills
    .filter((skill) => typeof skill.skillName === 'string' && skill.skillName.trim())
    .sort((a, b) => (a.progressPercentage || 0) - (b.progressPercentage || 0))
    .slice(0, 3)

  const skillLines = skills.length
    ? skills.map((skill) => `${skill.skillName}: ${skill.progressPercentage || 0}%`).join('\n')
    : 'No skills available'

  const weakLines = weakestSkills.length
    ? weakestSkills.map((skill) => `${skill.skillName}: ${skill.progressPercentage || 0}%`).join(', ')
    : 'No weak skill data available'

  return `Generate a dynamic 7-day learning roadmap.
Inputs:
- targetRole: ${user.targetRole || 'Not specified'}
- dailyAvailableHours: ${user.dailyAvailableHours || 2}
- level: ${user.level || 1}
- latestProductivityScore: ${latestScore?.totalScore ?? 0}
- completionRate: ${latestScore?.completionRate ?? 0}
- focusScore: ${latestScore?.focusScore ?? 0}
- skills:\n${skillLines}
- weakestSkillsToPrioritize: ${weakLines}

Rules:
- If skills exist, prioritize weakest 2-3 skills in early-mid days.
- If no skills, align all days strictly to targetRole.
- Day 1 easier, Day 7 harder.
- Workload must adapt to dailyAvailableHours and latestProductivityScore.
- Keep tasks realistic and exactly 3 per day.
- Avoid repeating same focusTopic consecutively.

Return only valid JSON array of exactly 7 objects.
Each object must be:
{
  "day": "Day 1",
  "focusTopic": "string",
  "icon": "Monitor|Server|Database|Brain|Network|Cpu|BarChart3|Palette|RefreshCcw|Rocket",
  "tasks": ["task1", "task2", "task3"],
  "estimatedHours": number,
  "xpReward": number,
  "motivationalMessage": "string"
}
No extra fields.`
}

const sanitizeRoadmapArray = (value) => {
  if (!Array.isArray(value) || value.length < 7) return null

  const output = []

  for (let index = 0; index < 7; index += 1) {
    const row = value[index] || {}
    const focusTopic = String(row.focusTopic || `Focused practice ${index + 1}`).trim()

    const tasks = Array.isArray(row.tasks)
      ? row.tasks.map((task) => String(task || '').trim()).filter(Boolean).slice(0, 3)
      : []

    if (tasks.length < 3) return null

    const estimatedHoursRaw = Number(row.estimatedHours)
    const estimatedHours = Number.isFinite(estimatedHoursRaw)
      ? Number(clamp(estimatedHoursRaw, 1, 10).toFixed(1))
      : null

    if (estimatedHours === null) return null

    const xpRewardRaw = Number(row.xpReward)
    const xpReward = Number.isFinite(xpRewardRaw) ? Math.max(10, Math.round(xpRewardRaw)) : null
    if (xpReward === null) return null

    const icon = iconFromTopic(String(row.icon || focusTopic))

    output.push({
      day: `Day ${index + 1}`,
      focusTopic,
      icon,
      tasks: tasks.slice(0, 3),
      estimatedHours,
      xpReward,
      motivationalMessage: String(row.motivationalMessage || motivationLines[index % motivationLines.length]),
    })
  }

  for (let i = 1; i < output.length; i += 1) {
    if (output[i].focusTopic.toLowerCase() === output[i - 1].focusTopic.toLowerCase()) {
      output[i].focusTopic = `${output[i].focusTopic} - Advanced`
      output[i].icon = iconFromTopic(output[i].focusTopic)
    }
  }

  return output
}

const parseModelRoadmap = (rawText) => {
  try {
    const cleaned = String(rawText || '').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return sanitizeRoadmapArray(parsed)
  } catch {
    return null
  }
}

const generateWithGemini = async ({ prompt, fallbackRoadmap }) => {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

  if (!apiKey) return fallbackRoadmap

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) return fallbackRoadmap

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return fallbackRoadmap

    const parsed = parseModelRoadmap(text)
    return parsed || fallbackRoadmap
  } catch {
    return fallbackRoadmap
  }
}

export const generateRoadmap = async (req, res) => {
  try {
    const userId = req.user

    const [user, skills, latestProductivityScore] = await Promise.all([
      User.findById(userId),
      Skill.find({ userId }).select('skillName progressPercentage'),
      ProductivityScore.findOne({ userId }).sort({ date: -1 }),
    ])

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isStarter = !latestProductivityScore

    const fallbackRoadmap = buildDynamicFallbackRoadmap({
      targetRole: user.targetRole,
      skills,
      level: user.level || 1,
      dailyAvailableHours: user.dailyAvailableHours,
      productivityScore: latestProductivityScore?.totalScore || 0,
    })

    const prompt = buildPrompt({
      user,
      skills,
      latestScore: latestProductivityScore,
    })

    const roadmap = await generateWithGemini({ prompt, fallbackRoadmap })

    const RoadmapCollection = mongoose.connection.collection('roadmaps')
    await RoadmapCollection.insertOne({
      userId,
      generatedPlan: JSON.stringify({ roadmap, isStarter, prompt }),
      duration: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return res.status(200).json({ roadmap, isStarter })
  } catch {
    return res.status(500).json({ message: 'Server error' })
  }
}
