import StudyLog from '../Schema/StudyLog.js'
import User from '../Schema/User.js'

const normalizeDate = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const dayDiff = (a, b) => Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))

export const createStudyLog = async (req, res) => {
  try {
    const { focusHours, tasksCompleted, date } = req.body

    const studyLog = await StudyLog.create({
      userId: req.user,
      focusHours: typeof focusHours === 'number' ? focusHours : 0,
      tasksCompleted: typeof tasksCompleted === 'number' ? tasksCompleted : 0,
      ...(date ? { date } : {}),
    })

    const user = await User.findById(req.user)
    if (user) {
      const logDate = normalizeDate(studyLog.date || new Date())
      const today = normalizeDate(new Date())

      if (logDate.getTime() <= today.getTime()) {
        const lastActive = user.lastActiveDate ? normalizeDate(user.lastActiveDate) : null
        let bonusXp = 0

        if (!lastActive) {
          user.streakCount = 1
          bonusXp = 10
        } else {
          const diff = dayDiff(logDate, lastActive)

          if (diff === 1) {
            user.streakCount = (user.streakCount || 0) + 1
            bonusXp = Math.min(10 + user.streakCount * 5, 60)
          } else if (diff > 1) {
            user.streakCount = 1
            bonusXp = 10
          }
        }

        if (bonusXp > 0) {
          user.xp = (user.xp || 0) + bonusXp
          user.level = Math.floor((user.xp || 0) / 200) + 1
          user.lastActiveDate = logDate
          await user.save()
        }
      }
    }

    return res.status(201).json(studyLog)
  } catch {
    return res.status(500).json({ message: 'Server error' })
  }
}

export const getStudyLogs = async (req, res) => {
  try {
    const logs = await StudyLog.find({ userId: req.user }).sort({ date: -1 })
    return res.status(200).json(logs)
  } catch {
    return res.status(500).json({ message: 'Server error' })
  }
}
