import StudyLog from '../Schema/StudyLog.js'
import User from '../Schema/User.js'
import { notifyUserEvent } from '../utils/notificationService.js'

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
      const previousLevel = user.level || 1
      const previousStreak = user.streakCount || 0
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

            void notifyUserEvent({
              userId: user._id,
              email: user.email,
              username: user.name,
              type: 'streak_broken',
              message: 'Streak broken. Complete at least one focused task daily to recover quickly.',
              sendEmail: true,
              additionalData: {
                eventKey: `streak-break-${logDate.toISOString().slice(0, 10)}`,
                streakCount: previousStreak,
                reinforcementSuggestion: 'Complete at least one focused task daily to rebuild streak quickly.',
              },
            })
          }
        }

        if (bonusXp > 0) {
          user.xp = (user.xp || 0) + bonusXp
          user.level = Math.floor((user.xp || 0) / 200) + 1
          user.lastActiveDate = logDate
          await user.save()

          if ((user.streakCount || 0) > previousStreak) {
            void notifyUserEvent({
              userId: user._id,
              email: user.email,
              username: user.name,
              type: 'streak_update',
              message: `Streak increased to ${user.streakCount || 0} day(s).`,
              sendEmail: false,
              additionalData: {
                eventKey: `streak-update-${logDate.toISOString().slice(0, 10)}`,
                streakCount: user.streakCount || 0,
              },
            })
          }

          if ((user.level || 1) > previousLevel) {
            void notifyUserEvent({
              userId: user._id,
              email: user.email,
              username: user.name,
              type: 'level_up',
              message: `Level up! You reached Level ${user.level || 1}.`,
              sendEmail: true,
              additionalData: {
                eventKey: `level-up-${user.level}`,
                newLevel: user.level || 1,
              },
            })
          }
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
