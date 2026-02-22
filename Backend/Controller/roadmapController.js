import mongoose from 'mongoose'
import User from '../Schema/User.js'
import Skill from '../Schema/Skill.js'
import Task from '../Schema/Task.js'
import StudyLog from '../Schema/StudyLog.js'
import ProductivityScore from '../Schema/Productivity.js'
import { notifyUserEvent, getUserNotificationSummary } from '../Utils/notificationService.js'

const ROADMAP_DEBUG = String(process.env.ROADMAP_DEBUG || '').toLowerCase() === 'true'

const debugLog = (...args) => {
  if (!ROADMAP_DEBUG) return
  console.log(...args)
}

const motivationLines = [
  'Small consistent wins compound into major outcomes.',
  'Protect your focus block and execute the highest-value task first.',
  'Quality repetitions matter more than random effort.',
  'Deliberate practice turns weak areas into strengths.',
  'Progress becomes predictable when your process is stable.',
  'Use feedback loops, not guesswork, to improve faster.',
  'Finish strong today to make next week easier.',
]

const iconRules = [
  { key: 'frontend', icon: 'Monitor' },
  { key: 'react', icon: 'Monitor' },
  { key: 'backend', icon: 'Server' },
  { key: 'api', icon: 'Server' },
  { key: 'database', icon: 'Database' },
  { key: 'mongo', icon: 'Database' },
  { key: 'dsa', icon: 'Brain' },
  { key: 'algorithm', icon: 'Brain' },
  { key: 'system design', icon: 'Network' },
  { key: 'architecture', icon: 'Network' },
  { key: 'ai', icon: 'Cpu' },
  { key: 'ml', icon: 'Cpu' },
  { key: 'analytics', icon: 'BarChart3' },
  { key: 'design', icon: 'Palette' },
  { key: 'revision', icon: 'RefreshCcw' },
  { key: 'review', icon: 'RefreshCcw' },
  { key: 'project', icon: 'Rocket' },
]

const youtubeCatalog = [
  {
    keys: ['frontend', 'react', 'ui'],
    title: 'React Full Course for Beginners - freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
  },
  {
    keys: ['backend', 'api', 'node', 'express'],
    title: 'Node.js and Express.js Full Course - freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
  },
  {
    keys: ['database', 'mongo', 'mongodb', 'sql'],
    title: 'MongoDB Full Course - freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=ofme2o29ngU',
  },
  {
    keys: ['dsa', 'algorithm', 'data structure'],
    title: 'Data Structures Easy to Advanced Course - freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
  },
  {
    keys: ['system design', 'architecture'],
    title: 'System Design Concepts Course - freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=F2FmTdLtb_4',
  },
  {
    keys: ['ai', 'ml', 'machine learning'],
    title: 'Machine Learning for Everybody - freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
  },
  {
    keys: ['analytics', 'analysis', 'data'],
    title: 'Data Analysis with Python Full Course - freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=r-uOLxNrNk8',
  },
  {
    keys: ['design', 'ux', 'ui design'],
    title: 'UI UX Design Course for Beginners',
    url: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
  },
  {
    keys: ['revision', 'review'],
    title: 'How to Study and Revise Effectively',
    url: 'https://www.youtube.com/watch?v=IlU-zDU6aQ0',
  },
  {
    keys: ['project', 'capstone'],
    title: 'Build and Deploy a Full Stack MERN App',
    url: 'https://www.youtube.com/watch?v=ngc9gnGgUdA',
  },
]

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const round1 = (value) => Number(value.toFixed(1))

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

const daysSince = (dateValue) => {
  if (!dateValue) return 14
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 14
  const diff = Date.now() - date.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

const dayKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

const iconFromTopic = (topic) => {
  const text = String(topic || '').toLowerCase()
  for (const rule of iconRules) {
    if (text.includes(rule.key)) return rule.icon
  }
  return 'Rocket'
}

const youtubeSuggestionFromTopic = (topic) => {
  const text = String(topic || '').toLowerCase()
  const found = youtubeCatalog.find((item) => item.keys.some((key) => text.includes(key)))
  if (found) return { title: found.title, url: found.url }

  return {
    title: 'Project-Based Learning Roadmap',
    url: 'https://www.youtube.com/watch?v=ngc9gnGgUdA',
  }
}

const parseStoredRoadmap = (value) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed?.roadmap)) return parsed
    if (Array.isArray(parsed)) return { roadmap: parsed }
    return parsed
  } catch {
    return null
  }
}

const extractPreviousAdaptiveScores = (roadmapHistory) => {
  const output = []
  for (const item of roadmapHistory) {
    const parsed = parseStoredRoadmap(item.generatedPlan)
    const days = Array.isArray(parsed?.roadmap) ? parsed.roadmap : []
    for (const day of days) {
      const score = Number(day?.adaptiveScore)
      const focusTopic = String(day?.focusTopic || '').trim()
      if (!focusTopic || !Number.isFinite(score)) continue
      output.push({ focusTopic, adaptiveScore: Number(score.toFixed(1)) })
    }
  }
  return output
}

const buildPerformanceTrend = (productivityHistory) => {
  if (!Array.isArray(productivityHistory) || productivityHistory.length < 2) return 'stable'
  const latest = Number(productivityHistory[0]?.totalScore || 0)
  const older = Number(productivityHistory[Math.min(2, productivityHistory.length - 1)]?.totalScore || 0)
  if (latest > older + 0.05) return 'improving'
  if (latest < older - 0.05) return 'declining'
  return 'stable'
}

const buildStreakStatus = (tracking) => {
  if (tracking.streakBreaks > 0) return 'broken'
  if (tracking.inconsistentDays >= 3) return 'declining'
  return 'stable'
}

const buildAnalysisSummary = ({
  tracking,
  tasks,
  skillInsights,
  mostSkippedFocus,
  productivityHistory,
  roadmapFollowed,
}) => {
  const totalTasksAssigned = tasks.length
  const totalTasksCompleted = tasks.filter((task) => task.status === 'completed').length
  const tasksMissed = Math.max(0, totalTasksAssigned - totalTasksCompleted)
  const repeatedGapSkills = skillInsights
    .filter((skill) => skill.skippedCount >= 2 || skill.gapScore >= 120)
    .slice(0, 3)
    .map((skill) => skill.skillName)

  const streakStatus = buildStreakStatus(tracking)
  const performanceTrend = buildPerformanceTrend(productivityHistory)

  let reinforcementAction = 'reward'
  let improvementReason = 'Roadmap compliance and momentum are healthy. Challenge is increased gradually.'

  if (!roadmapFollowed && tracking.roadmapCompletionRate < 50) {
    reinforcementAction = 'simplified'
    improvementReason = 'Low roadmap compliance detected. Workload reduced with micro-steps and revision emphasis.'
  } else if (!roadmapFollowed) {
    reinforcementAction = 'penalty'
    improvementReason = 'Repeated skips detected. Penalty applied and weak focus topics reprioritized.'
  }

  return {
    roadmapCompletionRate: tracking.roadmapCompletionRate,
    tasksMissed,
    repeatedGapSkills,
    mostSkippedFocus: mostSkippedFocus || 'None',
    streakStatus,
    performanceTrend,
    reinforcementAction,
    improvementReason,
  }
}

const buildChartData = ({
  tasks,
  skillInsights,
  roadmapHistory,
}) => {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const completionByDayIndex = new Map()
  const xpByDayIndex = new Map()

  for (let i = 0; i < 7; i += 1) {
    completionByDayIndex.set(i, 0)
    xpByDayIndex.set(i, 0)
  }

  tasks.forEach((task) => {
    const date = new Date(task.updatedAt || task.createdAt || Date.now())
    if (Number.isNaN(date.getTime())) return
    const dayIndex = date.getDay()
    if (task.status === 'completed') {
      completionByDayIndex.set(dayIndex, (completionByDayIndex.get(dayIndex) || 0) + 1)
      const diff = String(task.difficulty || 'easy').toLowerCase()
      const xp = diff === 'hard' ? 100 : diff === 'medium' ? 50 : 20
      xpByDayIndex.set(dayIndex, (xpByDayIndex.get(dayIndex) || 0) + xp)
    }
  })

  const dailyCompletion = dayLabels.map((day, idx) => ({
    day,
    value: Number(completionByDayIndex.get(idx) || 0),
  }))

  const xpTrend = dayLabels.map((day, idx) => ({
    day,
    xp: Number(xpByDayIndex.get(idx) || 0),
  }))

  const skillGapRadar = skillInsights.slice(0, 6).map((skill) => ({
    skill: skill.skillName,
    gapScore: Number(skill.gapScore.toFixed(1)),
  }))

  const adaptiveRaw = extractPreviousAdaptiveScores(roadmapHistory)
  const aggregate = new Map()
  adaptiveRaw.forEach((item) => {
    const key = item.focusTopic.toLowerCase()
    const existing = aggregate.get(key) || { focusTopic: item.focusTopic, total: 0, count: 0 }
    existing.total += item.adaptiveScore
    existing.count += 1
    aggregate.set(key, existing)
  })

  const adaptiveTrend = Array.from(aggregate.values())
    .map((item) => ({
      focusTopic: item.focusTopic,
      adaptiveScore: Number((item.total / Math.max(1, item.count)).toFixed(1)),
    }))
    .slice(0, 8)

  return {
    dailyCompletion,
    xpTrend,
    skillGapRadar,
    adaptiveTrend,
  }
}

const getRelatedTasksByTopic = (tasks, topic) => {
  const tokens = String(topic || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)

  return tasks.filter((task) => {
    const title = String(task.title || '').toLowerCase()
    const subject = String(task.subject || '').toLowerCase()
    return tokens.some((token) => title.includes(token) || subject.includes(token))
  })
}

const evaluateRoadmapTracking = ({ tasks, studyLogs, previousRoadmap }) => {
  const fallbackTotal = Math.max(1, tasks.length)
  const roadmapDays = Array.isArray(previousRoadmap?.roadmap) ? previousRoadmap.roadmap : []
  const totalRoadmapTasks = roadmapDays.length
    ? roadmapDays.reduce((sum, day) => sum + Math.max(1, Array.isArray(day.tasks) ? day.tasks.length : 0), 0)
    : fallbackTotal

  const focusTopics = roadmapDays.map((day) => String(day.focusTopic || '').trim()).filter(Boolean)
  const completionByTopic = focusTopics.map((topic) => {
    const related = getRelatedTasksByTopic(tasks, topic)
    const completed = related.filter((task) => task.status === 'completed').length
    const skipped = related.filter((task) => {
      if (task.status === 'completed') return false
      if (!task.deadline) return false
      const deadline = new Date(task.deadline)
      if (Number.isNaN(deadline.getTime())) return false
      return deadline.getTime() < Date.now()
    }).length

    return { topic, relatedCount: related.length, completed, skipped }
  })

  const completedRoadmapTasks = completionByTopic.length
    ? completionByTopic.reduce((sum, x) => sum + x.completed, 0)
    : tasks.filter((task) => task.status === 'completed').length

  const roadmapCompletionRate = clamp((completedRoadmapTasks / Math.max(1, totalRoadmapTasks)) * 100, 0, 100)

  const skippedFocusAreas = completionByTopic.filter((x) => x.skipped > 0).length
  const repeatedSkips = completionByTopic.filter((x) => x.skipped >= 2).length
  const mostSkipped = completionByTopic
    .slice()
    .sort((a, b) => b.skipped - a.skipped)[0]

  const logsByDay = new Set(studyLogs.map((log) => dayKey(log.date)).filter(Boolean))
  let inconsistentDays = 0
  for (let i = 0; i < 7; i += 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    if (key && !logsByDay.has(key)) inconsistentDays += 1
  }

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const twoDaysBack = new Date(today)
  twoDaysBack.setDate(today.getDate() - 2)
  const streakBreaks =
    !logsByDay.has(dayKey(yesterday)) && logsByDay.has(dayKey(twoDaysBack)) ? 1 : 0

  const roadmapFollowed = roadmapCompletionRate >= 70 && repeatedSkips === 0

  return {
    totalTasksAssigned: tasks.length,
    totalTasksCompleted: tasks.filter((task) => task.status === 'completed').length,
    skippedTasksCount: tasks.filter((task) => {
      if (task.status === 'completed' || !task.deadline) return false
      const deadline = new Date(task.deadline)
      return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()
    }).length,
    roadmapCompletionRate: Number(roadmapCompletionRate.toFixed(1)),
    skippedFocusAreas,
    repeatedSkips,
    repeatedSkippedFocusTopics: completionByTopic.filter((x) => x.skipped >= 2).map((x) => x.topic),
    mostSkippedFocus: mostSkipped?.topic || '',
    inconsistentDays,
    streakBreaks,
    focusCompletionStats: completionByTopic,
    roadmapFollowed,
  }
}

const getSkillTaskStats = (tasks, skillName) => {
  const key = String(skillName || '').trim().toLowerCase()
  const related = tasks.filter((task) => {
    const title = String(task.title || '').toLowerCase()
    const subject = String(task.subject || '').toLowerCase()
    return key && (title.includes(key) || subject.includes(key))
  })

  const completed = related.filter((task) => task.status === 'completed').length
  const skipped = related.filter((task) => {
    if (task.status === 'completed') return false
    if (!task.deadline) return false
    const deadline = new Date(task.deadline)
    if (Number.isNaN(deadline.getTime())) return false
    return deadline.getTime() < Date.now()
  }).length

  return { related, completed, skipped }
}

const buildSkillInsights = ({ skills, tasks, roadmapCompletionRate }) => {
  if (!skills.length) return []

  const lowCompletionWeight = clamp((70 - roadmapCompletionRate) / 10, 0, 10)

  return skills
    .map((skill) => {
      const skillName = String(skill.skillName || '').trim()
      if (!skillName) return null

      const progress = clamp(Number(skill.progressPercentage) || 0, 0, 100)
      const { completed, skipped } = getSkillTaskStats(tasks, skillName)
      const stagnationDays = daysSince(skill.updatedAt || skill.createdAt)
      const notPracticedLong = stagnationDays >= 14

      const gapScore =
        (100 - progress) +
        skipped * 10 +
        stagnationDays * 5 +
        lowCompletionWeight

      const reinforcementReward = completed > 0 ? 10 : 0
      const skipPenalty = skipped >= 2 ? 5 : 0
      const adaptiveScore = clamp(100 - gapScore + reinforcementReward - skipPenalty, 0, 100)

      let gapReason = 'balanced'
      if (skipped >= 2) gapReason = 'overload'
      else if (notPracticedLong || stagnationDays >= 5) gapReason = 'stagnation'
      else if (progress < 50) gapReason = 'low_practice'

      return {
        skillName,
        progress,
        skippedCount: skipped,
        stagnationDays,
        lowCompletionWeight,
        gapScore,
        adaptiveScore,
        gapReason,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.gapScore - a.gapScore)
}

const buildTopicPool = ({ targetRole, skillInsights }) => {
  const role = String(targetRole || '').trim() || 'Target role'

  if (skillInsights.length) {
    const topGapSkills = skillInsights.slice(0, 3)
    const strongest = [...skillInsights].sort((a, b) => b.progress - a.progress).slice(0, 2)

    return [
      `${topGapSkills[0]?.skillName || role} fundamentals`,
      `${topGapSkills[1]?.skillName || role} practice sprint`,
      `${role} implementation workflow`,
      `${topGapSkills[2]?.skillName || role} revision`,
      `${strongest[0]?.skillName || role} integration`,
      `${role} system design and scaling`,
      `${strongest[1]?.skillName || role} project delivery`,
    ]
  }

  return [
    `${role} fundamentals`,
    `${role} core practice`,
    `${role} implementation workflows`,
    `${role} optimization`,
    `${role} architecture thinking`,
    `${role} project execution`,
    `${role} revision and polish`,
  ]
}

const resolveDayStrategy = (skillInsight) => {
  if (!skillInsight) return 'balanced'
  if (skillInsight.gapReason === 'low_practice') return 'practice_heavy'
  if (skillInsight.gapReason === 'overload') return 'reduce_intensity'
  if (skillInsight.gapReason === 'stagnation') return 'revision_fundamentals'
  return 'balanced'
}

const buildTasks = ({ focusTopic, estimatedHours, strategy, complexity }) => {
  const blockA = Math.max(1, round1(estimatedHours * 0.4))
  const blockB = Math.max(1, round1(estimatedHours * 0.35))
  const blockC = Math.max(1, round1(estimatedHours * 0.25))

  if (strategy === 'practice_heavy') {
    return [
      `Targeted exercises on ${focusTopic} for ${blockA} hour(s) with timed sets`,
      `Build 2 practical implementations for ${blockB} hour(s) on ${focusTopic}`,
      `Review mistakes and improve one weak pattern for ${blockC} hour(s)`,
    ]
  }

  if (strategy === 'reduce_intensity') {
    return [
      `Micro-task session: split ${focusTopic} into 3 small outcomes (${blockA} hour(s))`,
      `Guided practice on one subtopic of ${focusTopic} for ${blockB} hour(s)`,
      `Revision checklist and summary notes for ${blockC} hour(s)`,
    ]
  }

  if (strategy === 'revision_fundamentals') {
    return [
      `Fundamental concept refresh for ${focusTopic} (${blockA} hour(s))`,
      `Solve foundational drills on ${focusTopic} for ${blockB} hour(s)`,
      `Revision + concept mapping for ${blockC} hour(s) to break stagnation`,
    ]
  }

  if (complexity === 'advanced') {
    return [
      `Advanced implementation challenge in ${focusTopic} for ${blockA} hour(s)`,
      `Scenario-based problem solving on ${focusTopic} for ${blockB} hour(s)`,
      `Optimization pass and technical reflection for ${blockC} hour(s)`,
    ]
  }

  return [
    `Core concept work on ${focusTopic} for ${blockA} hour(s)`,
    `Guided practice tasks on ${focusTopic} for ${blockB} hour(s)`,
    `Review and improvement loop for ${blockC} hour(s)`,
  ]
}

const buildNotifications = ({
  dayNumber,
  isRegenerated,
  aboutToBreakStreak,
  levelUpPossible,
  roadmapFollowed,
}) => {
  const notifications = []

  if (isRegenerated && dayNumber === 1) {
    notifications.push({
      type: 'roadmap',
      message: 'Your weekly roadmap has been regenerated using latest behavior data.',
      triggerCondition: 'After roadmap regeneration',
    })
  }

  notifications.push({
    type: 'reminder',
    message: 'Focus session pending. Complete at least one task before 8PM.',
    triggerCondition: 'If no task completed by 8PM',
  })

  if (aboutToBreakStreak) {
    notifications.push({
      type: 'streak',
      message: 'Your streak is at risk. Complete one task to keep momentum.',
      triggerCondition: 'If streak about to break',
    })
  }

  if (levelUpPossible) {
    notifications.push({
      type: 'levelup',
      message: 'You are close to level up. Finish today\'s roadmap tasks.',
      triggerCondition: 'If level increases',
    })
  }

  if (!roadmapFollowed) {
    notifications.push({
      type: 'penalty',
      message: 'Roadmap compliance dropped. Simplified plan has been applied.',
      triggerCondition: 'If roadmap not followed',
    })
  }

  return notifications
}

const buildAdaptiveRoadmap = ({
  user,
  skillInsights,
  productivityScore,
  tracking,
  isRegenerated = false,
  penaltyMultiplier = 1,
}) => {
  const baseHours = normalizeDailyHours(user.dailyAvailableHours)
  const level = normalizeLevel(user.level)
  const score = normalizeScore(productivityScore)
  const topics = buildTopicPool({ targetRole: user.targetRole, skillInsights })

  const aboutToBreakStreak = Boolean(user.lastActiveDate && daysSince(user.lastActiveDate) >= 1)
  const levelUpPossible = Number(user.xp || 0) % 200 >= 150

  const prioritized = skillInsights.slice(0, 3)

  const days = Array.from({ length: 7 }, (_, index) => {
    const dayNumber = index + 1
    const progression = -0.2 + index * 0.12
    const scoreFactor = score < 0.5 ? -0.2 : 0.25
    const levelFactor = (level - 1) * 0.07

    const topic = topics[index % topics.length]
    const mappedInsight = prioritized[index % Math.max(1, prioritized.length)]

    const reinforcementReward = mappedInsight && mappedInsight.adaptiveScore >= 60 ? 10 : 0
    const skippedPenalty = mappedInsight && mappedInsight.skippedCount >= 2 ? 5 * penaltyMultiplier : 0
    const roadmapPenalty = tracking.roadmapFollowed ? 0 : 10

    const adaptiveScore = clamp(
      (mappedInsight?.adaptiveScore ?? 55) + reinforcementReward - skippedPenalty - roadmapPenalty + index,
      0,
      100
    )

    let estimatedHours = clamp(baseHours + progression + scoreFactor + levelFactor, 1, 10)

    let complexity = 'normal'
    if (adaptiveScore >= 70) {
      complexity = 'advanced'
      estimatedHours = clamp(estimatedHours + 0.2, 1, 10)
    }

    if (adaptiveScore <= 40) {
      complexity = 'micro'
      estimatedHours = clamp(estimatedHours - 0.5, 1, 10)
    }

    const strategy = resolveDayStrategy(mappedInsight)
    const tasks = buildTasks({
      focusTopic: topic,
      estimatedHours: round1(estimatedHours),
      strategy,
      complexity,
    }).slice(0, 3)

    const xpBase = 35 + level * 6 + dayNumber * 8
    const xpAdaptive = adaptiveScore >= 70 ? 20 : adaptiveScore <= 40 ? -8 : 8
    const xpReward = Math.max(20, Math.round(xpBase + xpAdaptive))

    return {
      day: `Day ${dayNumber}`,
      focusTopic: topic,
      icon: iconFromTopic(topic),
      tasks,
      estimatedHours: round1(estimatedHours),
      xpReward,
      adaptiveScore: Number(adaptiveScore.toFixed(1)),
      motivationalMessage: motivationLines[index % motivationLines.length],
      youtubeSuggestion: youtubeSuggestionFromTopic(topic),
      notifications: buildNotifications({
        dayNumber,
        isRegenerated,
        aboutToBreakStreak,
        levelUpPossible,
        roadmapFollowed: tracking.roadmapFollowed,
      }),
    }
  })

  for (let i = 1; i < days.length; i += 1) {
    if (days[i].focusTopic.toLowerCase() === days[i - 1].focusTopic.toLowerCase()) {
      days[i].focusTopic = `${days[i].focusTopic} advanced track`
      days[i].icon = iconFromTopic(days[i].focusTopic)
      days[i].youtubeSuggestion = youtubeSuggestionFromTopic(days[i].focusTopic)
    }
  }

  return days
}

const sanitizeRoadmap = (value) => {
  if (!Array.isArray(value) || value.length < 7) return null

  const output = []
  for (let index = 0; index < 7; index += 1) {
    const row = value[index] || {}
    const tasks = Array.isArray(row.tasks)
      ? row.tasks.map((task) => String(task || '').trim()).filter(Boolean).slice(0, 3)
      : []

    if (tasks.length !== 3) return null

    const focusTopic = String(row.focusTopic || '').trim()
    if (!focusTopic) return null

    const estimatedHoursRaw = Number(row.estimatedHours)
    if (!Number.isFinite(estimatedHoursRaw)) return null

    const xpRewardRaw = Number(row.xpReward)
    if (!Number.isFinite(xpRewardRaw)) return null

    const adaptiveScoreRaw = Number(row.adaptiveScore)
    const adaptiveScore = Number.isFinite(adaptiveScoreRaw) ? clamp(adaptiveScoreRaw, 0, 100) : 55

    const youtube = row.youtubeSuggestion && typeof row.youtubeSuggestion === 'object'
      ? {
          title: String(row.youtubeSuggestion.title || '').trim(),
          url: String(row.youtubeSuggestion.url || '').trim(),
        }
      : null

    if (!youtube || !youtube.title || !youtube.url || !youtube.url.startsWith('http')) return null

    const notifications = Array.isArray(row.notifications)
      ? row.notifications
          .map((n) => ({
            type: String(n?.type || '').trim(),
            message: String(n?.message || '').trim(),
            triggerCondition: String(n?.triggerCondition || '').trim(),
          }))
          .filter((n) => n.type && n.message && n.triggerCondition)
      : undefined

    output.push({
      day: `Day ${index + 1}`,
      focusTopic,
      icon: iconFromTopic(String(row.icon || focusTopic)),
      tasks,
      estimatedHours: round1(clamp(estimatedHoursRaw, 1, 10)),
      xpReward: Math.max(20, Math.round(xpRewardRaw)),
      adaptiveScore: Number(adaptiveScore.toFixed(1)),
      motivationalMessage: String(row.motivationalMessage || motivationLines[index % motivationLines.length]),
      youtubeSuggestion: youtube,
      ...(notifications && notifications.length ? { notifications } : {}),
    })
  }

  for (let i = 1; i < output.length; i += 1) {
    if (output[i].focusTopic.toLowerCase() === output[i - 1].focusTopic.toLowerCase()) {
      return null
    }
  }

  return output
}

const buildPrompt = ({ user, skills, skillInsights, latestScore, tracking }) => {
  const skillLines = skills.length
    ? skills.map((skill) => `${skill.skillName}: ${skill.progressPercentage || 0}%`).join('\n')
    : 'No skills available'

  const gapLines = skillInsights.length
    ? skillInsights
        .slice(0, 3)
        .map((insight) => `${insight.skillName} | gapScore=${insight.gapScore} | adaptiveScore=${insight.adaptiveScore}`)
        .join('\n')
    : 'No skill gaps available'

  return `Generate a dynamic 7-day roadmap as valid JSON array only.
Inputs:
- targetRole: ${user.targetRole || 'Not specified'}
- level: ${user.level || 1}
- dailyAvailableHours: ${user.dailyAvailableHours || 2}
- productivityScore: ${latestScore?.totalScore ?? 0}
- completionRate: ${tracking.roadmapCompletionRate}
- roadmapFollowed: ${tracking.roadmapFollowed}
- repeatedSkips: ${tracking.repeatedSkips}
Skills:\n${skillLines}
Top gap skills:\n${gapLines}

Rules:
- Prioritize top 3 highest gap skills if skills exist.
- If no skills, align with targetRole.
- Day 1 easier, Day 7 harder.
- Adapt workload to dailyAvailableHours + productivityScore.
- Use reinforcement updates: +10 for completed focus areas, -5 repeated skipped focus areas, -10 if roadmapFollowed false.
- Keep exactly 3 tasks per day.
- No consecutive same focusTopic.

Each day object must include:
{
  "day": "Day 1",
  "focusTopic": "string",
  "icon": "Monitor|Server|Database|Brain|Network|Cpu|BarChart3|Palette|RefreshCcw|Rocket",
  "tasks": ["task1", "task2", "task3"],
  "estimatedHours": number,
  "xpReward": number,
  "adaptiveScore": number,
  "motivationalMessage": "string",
  "youtubeSuggestion": { "title": "string", "url": "https://..." },
  "notifications": [
    { "type": "reminder|streak|levelup|penalty|roadmap", "message": "string", "triggerCondition": "string" }
  ]
}
Return only JSON array.`
}

const parseModelRoadmap = (rawText) => {
  try {
    const cleaned = String(rawText || '').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return sanitizeRoadmap(parsed)
  } catch {
    return null
  }
}

const generateWithGemini = async ({ prompt, fallbackRoadmap }) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

  if (!apiKey) {
    debugLog('[RoadmapDebug] Missing GEMINI_API_KEY/API_KEY. Using fallback roadmap.')
    return {
      roadmap: fallbackRoadmap,
      source: 'fallback',
      reason: 'missing_api_key',
      model,
      status: null,
    }
  }

  try {
    debugLog('[RoadmapDebug] Gemini model:', model)
    debugLog('[RoadmapDebug] Prompt preview:', String(prompt).slice(0, 500))

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

    console.log('Gemini Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      debugLog('[RoadmapDebug] Gemini non-OK response body:', errorText.slice(0, 800))
      return {
        roadmap: fallbackRoadmap,
        source: 'fallback',
        reason: 'gemini_non_ok',
        model,
        status: response.status,
      }
    }

    const data = await response.json()
    if (!Array.isArray(data?.candidates)) {
      debugLog('[RoadmapDebug] Gemini candidates missing/invalid. Using fallback.')
      return {
        roadmap: fallbackRoadmap,
        source: 'fallback',
        reason: 'missing_candidates',
        model,
        status: response.status,
      }
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    console.log('Raw Gemini Output:', text)
    if (!text) {
      debugLog('[RoadmapDebug] Empty Gemini text output. Using fallback.')
      return {
        roadmap: fallbackRoadmap,
        source: 'fallback',
        reason: 'missing_text',
        model,
        status: response.status,
      }
    }

    const parsed = parseModelRoadmap(text)
    if (!parsed) {
      debugLog('[RoadmapDebug] parseModelRoadmap failed. Using fallback.')
      return {
        roadmap: fallbackRoadmap,
        source: 'fallback',
        reason: 'parse_failed',
        model,
        status: response.status,
      }
    }

    debugLog('[RoadmapDebug] Parsed roadmap length:', parsed.length)
    return {
      roadmap: parsed,
      source: 'gemini',
      reason: null,
      model,
      status: response.status,
    }
  } catch {
    debugLog('[RoadmapDebug] Gemini request threw error. Using fallback.')
    return {
      roadmap: fallbackRoadmap,
      source: 'fallback',
      reason: 'request_failed',
      model,
      status: null,
    }
  }
}

const evaluateRoadmapQuality = (roadmap) => {
  if (!Array.isArray(roadmap) || roadmap.length !== 7) return false

  for (let i = 0; i < roadmap.length; i += 1) {
    const day = roadmap[i]
    if (!day || !Array.isArray(day.tasks) || day.tasks.length !== 3) return false
    if (!day.youtubeSuggestion || !day.youtubeSuggestion.url) return false
    if (i > 0 && String(day.focusTopic).toLowerCase() === String(roadmap[i - 1].focusTopic).toLowerCase()) return false
  }

  return true
}

const calculateDifficultyBalance = (roadmap) => {
  if (!roadmap.length) return 0.5
  const hours = roadmap.map((d) => Number(d.estimatedHours) || 0)
  const avg = hours.reduce((a, b) => a + b, 0) / hours.length
  const variance = hours.reduce((sum, x) => sum + (x - avg) ** 2, 0) / hours.length
  const normalized = clamp(1 - variance / 6, 0, 1)
  return normalized
}

const predictSuccessRate = ({ completionRate, streakConsistency, productivityScore, difficultyBalance }) => {
  const successRate =
    completionRate * 0.4 +
    streakConsistency * 0.2 +
    productivityScore * 0.3 +
    difficultyBalance * 0.1

  return Number(clamp(successRate * 100, 25, 95).toFixed(1))
}

const maybeSendEmails = async ({
  user,
  tracking,
  optimizationVersion,
  levelUpPossible,
  predictedSuccessRate,
  improvementStrategy,
}) => {
  const suggestion = tracking.roadmapFollowed
    ? 'Maintain your strongest focus block and continue progressive complexity.'
    : 'Start with one micro-task block and recover consistency for 3 consecutive days.'

  const completionRate = tracking.roadmapCompletionRate

  if (!tracking.roadmapFollowed) {
    await notifyUserEvent({
      userId: user._id,
      email: user.email,
      username: user.name || 'Student',
      type: 'penalty_warning',
      message: `Roadmap completion is ${Math.round(completionRate)}%. Recovery mode was activated.`,
      sendEmail: true,
      additionalData: {
        eventKey: `penalty-${new Date().toISOString().slice(0, 10)}`,
        roadmapCompletionRate: completionRate,
        reinforcementSuggestion: suggestion,
      },
    })
  }

  if (tracking.streakBreaks > 0) {
    await notifyUserEvent({
      userId: user._id,
      email: user.email,
      type: 'streak_broken',
      username: user.name || 'Student',
      message: 'Streak broken. Complete one task today to re-enter growth loop.',
      sendEmail: true,
      additionalData: {
        eventKey: `streak-break-${new Date().toISOString().slice(0, 10)}`,
        streakCount: user.streakCount || 0,
        reinforcementSuggestion: suggestion,
      },
    })
  }

  if (levelUpPossible) {
    await notifyUserEvent({
      userId: user._id,
      email: user.email,
      type: 'level_up',
      username: user.name || 'Student',
      message: `Level up! You reached Level ${user.level || 1}.`,
      sendEmail: true,
      additionalData: {
        eventKey: `level-up-${user.level || 1}`,
        newLevel: user.level || 1,
        reinforcementSuggestion: suggestion,
      },
    })
  }

  if (optimizationVersion === 'reinforcement_optimized') {
    await notifyUserEvent({
      userId: user._id,
      email: user.email,
      type: 'roadmap_ready',
      username: user.name || 'Student',
      message: `Roadmap optimized. Predicted success rate ${Math.round(predictedSuccessRate)}%.`,
      sendEmail: true,
      additionalData: {
        eventKey: `roadmap-ready-${new Date().toISOString().slice(0, 10)}`,
        predictedSuccessRate,
        roadmapCompletionRate: completionRate,
        reinforcementSuggestion: improvementStrategy || suggestion,
      },
    })
  }
}

export const generateRoadmap = async (req, res) => {
  try {
    console.log('User ID:', req.user)
    const userId = req.user
    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing in request context',
        code: 'USER_ID_MISSING',
      })
    }

    const RoadmapCollection = mongoose.connection.collection('roadmaps')

    const [user, skills, latestProductivityScore, tasks, studyLogs, previousRoadmapDoc, roadmapHistory, productivityHistory] = await Promise.all([
      User.findById(userId),
      Skill.find({ userId }).select('skillName progressPercentage createdAt updatedAt'),
      ProductivityScore.findOne({ userId }).sort({ date: -1 }),
      Task.find({ userId }).select('title subject deadline status difficulty createdAt updatedAt'),
      StudyLog.find({ userId }).sort({ date: -1 }).limit(30),
      RoadmapCollection.find({ userId }).sort({ createdAt: -1 }).limit(1).next(),
      RoadmapCollection.find({ userId }).sort({ createdAt: -1 }).limit(5).toArray(),
      ProductivityScore.find({ userId }).sort({ date: -1 }).limit(7),
    ])

    debugLog('[RoadmapDebug] Fetched user:', Boolean(user))
    debugLog('[RoadmapDebug] Skill count:', skills.length)
    debugLog('[RoadmapDebug] Latest productivity score found:', Boolean(latestProductivityScore))

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const previousRoadmapParsed = parseStoredRoadmap(previousRoadmapDoc?.generatedPlan)

    const tracking = evaluateRoadmapTracking({
      tasks,
      studyLogs,
      previousRoadmap: previousRoadmapParsed,
    })

    const productivityScore = Number.isFinite(Number(latestProductivityScore?.totalScore))
      ? Number(latestProductivityScore.totalScore)
      : clamp(tracking.roadmapCompletionRate / 100, 0, 1)

    const skillInsights = buildSkillInsights({
      skills,
      tasks,
      roadmapCompletionRate: tracking.roadmapCompletionRate,
    })

    const initialFallbackRoadmap = buildAdaptiveRoadmap({
      user,
      skillInsights,
      productivityScore,
      tracking,
      isRegenerated: false,
      penaltyMultiplier: 1,
    })

    const prompt = buildPrompt({
      user,
      skills,
      skillInsights,
      latestScore: latestProductivityScore,
      tracking,
    })

    const geminiResult = await generateWithGemini({ prompt, fallbackRoadmap: initialFallbackRoadmap })
    let roadmap = geminiResult.roadmap
    let optimizationVersion = 'initial'
    let improvementStrategy = 'Adaptive generation based on roadmap tracking, skill gaps, and reinforcement signals.'
    let usedFallback = geminiResult.source !== 'gemini'

    debugLog('[RoadmapDebug] Gemini source:', geminiResult.source)
    debugLog('[RoadmapDebug] Gemini reason:', geminiResult.reason)
    debugLog('[RoadmapDebug] Gemini status:', geminiResult.status)

    const repeatedFailures = roadmapHistory
      .map((item) => parseStoredRoadmap(item.generatedPlan))
      .filter(Boolean)
      .filter((item) => item?.optimizationMeta?.version === 'reinforcement_optimized').length

    const highSkillGap = skillInsights[0]?.gapScore >= 140
    const poorQuality = !evaluateRoadmapQuality(roadmap)
    const lowCompletion = tracking.roadmapCompletionRate < 50
    const shouldOptimize = poorQuality || lowCompletion || repeatedFailures >= 2 || highSkillGap

    if (shouldOptimize) {
      usedFallback = true
      roadmap = buildAdaptiveRoadmap({
        user,
        skillInsights,
        productivityScore: normalizeScore(productivityScore) * 0.9,
        tracking: { ...tracking, roadmapFollowed: false },
        isRegenerated: true,
        penaltyMultiplier: 1.3,
      })

      optimizationVersion = 'reinforcement_optimized'
      improvementStrategy =
        'Applied penalties for roadmap misses, recalculated gap pressure, reduced overload, and regenerated a simplified adaptive plan.'
    }

    const streakConsistency = clamp((7 - tracking.inconsistentDays) / 7, 0, 1)
    const difficultyBalance = calculateDifficultyBalance(roadmap)

    const predictedSuccessRate = predictSuccessRate({
      completionRate: clamp(tracking.roadmapCompletionRate / 100, 0, 1),
      streakConsistency,
      productivityScore: normalizeScore(productivityScore),
      difficultyBalance,
    })

    const optimizationMeta = {
      version: optimizationVersion,
      roadmapCompletionRate: tracking.roadmapCompletionRate,
      predictedSuccessRate,
      roadmapFollowed: tracking.roadmapFollowed,
      improvementStrategy,
      generationSource: geminiResult.source,
      fallbackReason: geminiResult.reason,
      geminiStatus: geminiResult.status,
      geminiModel: geminiResult.model,
      usedFallback,
    }

    const analysisSummary = buildAnalysisSummary({
      tracking,
      tasks,
      skillInsights,
      mostSkippedFocus: tracking.mostSkippedFocus,
      productivityHistory,
      roadmapFollowed: tracking.roadmapFollowed,
    })

    const chartData = buildChartData({
      tasks,
      skillInsights,
      roadmapHistory,
    })

    const isStarter = !latestProductivityScore

    debugLog('[RoadmapDebug] Parsed/Final roadmap preview:', JSON.stringify(roadmap?.slice?.(0, 2) || roadmap))
    debugLog('[RoadmapDebug] Used fallback:', usedFallback)
    debugLog('[RoadmapDebug] Final roadmap length:', Array.isArray(roadmap) ? roadmap.length : 0)

    const levelUpPossible = Number(user.xp || 0) % 200 >= 150
    try {
      await maybeSendEmails({
        user,
        tracking,
        optimizationVersion,
        levelUpPossible,
        predictedSuccessRate,
        improvementStrategy,
      })
    } catch (emailError) {
      // Email failures must not block roadmap delivery.
      console.warn('[RoadmapEmailWarning]', emailError?.message || emailError)
    }

    await RoadmapCollection.insertOne({
      userId,
      generatedPlan: JSON.stringify({ roadmap, isStarter, analysisSummary, chartData, optimizationMeta, prompt }),
      duration: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const notificationCenter = await getUserNotificationSummary(userId, 5)

    return res.status(200).json({ analysisSummary, chartData, roadmap, isStarter, optimizationMeta, notificationCenter })
  } catch (error) {
    console.error('[RoadmapError]', error?.message || error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const getLatestRoadmap = async (req, res) => {
  try {
    const userId = req.user
    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing in request context',
        code: 'USER_ID_MISSING',
      })
    }

    const RoadmapCollection = mongoose.connection.collection('roadmaps')
    const latest = await RoadmapCollection.find({ userId }).sort({ createdAt: -1 }).limit(1).next()

    if (!latest) {
      return res.status(200).json({
        roadmap: [],
        analysisSummary: null,
        chartData: null,
        optimizationMeta: null,
        isStarter: true,
      })
    }

    const parsed = parseStoredRoadmap(latest.generatedPlan) || {}

    return res.status(200).json({
      roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : [],
      analysisSummary: parsed.analysisSummary || null,
      chartData: parsed.chartData || null,
      optimizationMeta: parsed.optimizationMeta || null,
      isStarter: Boolean(parsed.isStarter),
    })
  } catch (error) {
    console.error('[RoadmapLatestError]', error?.message || error)
    return res.status(500).json({ message: 'Server error' })
  }
}
