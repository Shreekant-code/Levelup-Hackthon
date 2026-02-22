import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  Brain,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  ListTodo,
  Medal,
  Menu,
  Sparkles,
  UserCircle2,
  X,
} from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../utils/api'

const card =
  'rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-md shadow-[0_0_24px_rgba(0,0,0,.35)]'

const dayKey = (dateValue) => {
  const date = new Date(dateValue)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

const calculateStreakFromLogs = (logs) => {
  const daySet = new Set(logs.map((log) => dayKey(log.date)))
  let streak = 0
  const cursor = new Date()

  while (daySet.has(dayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

const useDashboardData = () => {
  const { addToast } = useToast()
  const { user, refreshProfile } = useAuth()
  const mountedRef = useRef(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState([])
  const [skills, setSkills] = useState([])
  const [studyLogs, setStudyLogs] = useState([])
  const [productivity, setProductivity] = useState([])
  const [roadmap, setRoadmap] = useState([])
  const [optimizationMeta, setOptimizationMeta] = useState(null)
  const [analysisSummary, setAnalysisSummary] = useState(null)
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refreshAll = useCallback(
    async ({ quiet = false } = {}) => {
      if (!mountedRef.current) return
      setLoading(true)
      setError('')

      try {
        const [taskRes, skillRes, studyRes, productivityRes] = await Promise.all([
          api.get('/api/tasks'),
          api.get('/api/skills'),
          api.get('/api/study-log'),
          api.get('/api/productivity'),
        ])

        if (!mountedRef.current) return

        setLoading(false)

        const failed = [taskRes, skillRes, studyRes, productivityRes].find((response) => !response.ok)
        if (failed) {
          const message = failed.data?.message || 'Failed to sync dashboard data.'
          setError(message)
          if (!quiet) {
            addToast({ type: 'error', title: 'Sync Error', message })
          }
          return
        }

        setTasks(taskRes.data || [])
        setSkills(skillRes.data || [])
        setStudyLogs(studyRes.data || [])
        setProductivity(productivityRes.data || [])

        await refreshProfile()
      } catch (err) {
        if (!mountedRef.current) return
        setLoading(false)
        const message = err?.message || 'Failed to sync dashboard data.'
        setError(message)
        if (!quiet) {
          addToast({ type: 'error', title: 'Sync Error', message })
        }
      }
    },
    [addToast, refreshProfile]
  )

  useEffect(() => {
    refreshAll({ quiet: true })
  }, [refreshAll])

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed').length,
    [tasks]
  )

  const completionRate = useMemo(
    () => (tasks.length ? completedTasks / tasks.length : 0),
    [tasks.length, completedTasks]
  )

  const focusHoursTotal = useMemo(
    () => studyLogs.reduce((sum, log) => sum + (log.focusHours || 0), 0),
    [studyLogs]
  )

  const fallbackStreak = useMemo(() => calculateStreakFromLogs(studyLogs), [studyLogs])

  const streak = Number.isFinite(user?.streakCount) ? user.streakCount : fallbackStreak
  const xp = Number.isFinite(user?.xp)
    ? user.xp
    : completedTasks * 20 + focusHoursTotal * 5 + streak * 10
  const level = Number.isFinite(user?.level) ? user.level : Math.floor(xp / 200) + 1

  const levelLabel = useMemo(() => {
    if (level <= 1) return 'Beginner'
    if (level === 2) return 'Explorer'
    if (level === 3) return 'Builder'
    return 'Expert'
  }, [level])

  const xpInLevel = useMemo(
    () => ({
      value: Math.max(0, xp % 200),
      max: 200,
    }),
    [xp]
  )

  const productivityScore = useMemo(() => {
    if (productivity[0]?.totalScore !== undefined) {
      return productivity[0].totalScore
    }

    return completionRate * 0.45 + Math.min(focusHoursTotal / 14, 1) * 0.3 + Math.min(streak / 7, 1) * 0.25
  }, [productivity, completionRate, focusHoursTotal, streak])

  const notifications = useMemo(() => {
    const items = []

    if (productivityScore < 0.45) {
      items.push({ type: 'warning', text: 'Low productivity warning: your score is below 45%.' })
    }

    const nearDeadlineTasks = tasks.filter((task) => {
      const diff = new Date(task.deadline).getTime() - Date.now()
      return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 2 && task.status !== 'completed'
    })

    if (nearDeadlineTasks.length) {
      items.push({ type: 'info', text: `${nearDeadlineTasks.length} task(s) are due within 48 hours.` })
    }

    if (streak >= 7) items.push({ type: 'success', text: 'Achievement unlocked: 7 Day Streak.' })
    if (completedTasks >= 10) items.push({ type: 'success', text: 'Achievement unlocked: 10 Tasks Completed.' })
    if (focusHoursTotal >= 20) items.push({ type: 'success', text: 'Achievement unlocked: 20 Focus Hours.' })

    if (!items.length) {
      items.push({ type: 'info', text: 'AI suggestion: start with one high-impact task each morning.' })
    }

    return items
  }, [productivityScore, tasks, streak, completedTasks, focusHoursTotal])

  return {
    loading,
    error,
    tasks,
    skills,
    studyLogs,
    productivity,
    roadmap,
    setRoadmap,
    optimizationMeta,
    setOptimizationMeta,
    analysisSummary,
    setAnalysisSummary,
    chartData,
    setChartData,
    refreshAll,
    metrics: {
      completionRate,
      completedTasks,
      focusHoursTotal,
      level,
      levelLabel,
      notifications,
      productivityScore,
      streak,
      xp,
      xpInLevel,
    },
  }
}

const DashboardLayout = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const data = useDashboardData()
  const [open, setOpen] = useState(false)

  const navItems = useMemo(
    () => [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
      { to: '/dashboard/skills', label: 'Skills', icon: Brain },
      { to: '/dashboard/analytics', label: 'Analytics', icon: Gauge },
      { to: '/dashboard/roadmap', label: 'AI Roadmap', icon: Sparkles },
      { to: '/dashboard/study-log', label: 'Study Log', icon: ClipboardList },
      { to: '/dashboard/gamification', label: 'Gamification', icon: Medal },
      { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    ],
    []
  )

  const toggleOpen = useCallback(() => {
    setOpen((current) => !current)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/', { replace: true })
  }, [logout, navigate])

  return (
    <div className="min-h-dvh overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(56,189,248,0.13),transparent_35%),radial-gradient(circle_at_75%_20%,rgba(168,85,247,0.14),transparent_40%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-neutral-900/70 p-2 md:hidden"
              onClick={toggleOpen}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link to="/dashboard" className="text-sm font-semibold tracking-wide sm:text-base">
              FutureME Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard/notifications" className="rounded-xl border border-white/10 bg-neutral-900/70 p-2">
              <Bell size={16} />
            </Link>
            <span className="hidden items-center gap-2 rounded-xl border border-white/10 bg-neutral-900/70 px-3 py-2 text-xs sm:flex">
              <UserCircle2 size={14} /> {user?.name || 'Student'}
            </span>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:pl-80">
        <Sidebar
          open={open}
          setOpen={setOpen}
          navItems={navItems}
          userName={user?.name}
          xp={data.metrics.xp}
          level={data.metrics.level}
          streak={data.metrics.streak}
          onLogout={handleLogout}
        />

        <main className={`${card} relative min-h-[70vh] p-4 md:p-5`}>
          {data.loading ? (
            <div className="pointer-events-none absolute right-4 top-4 rounded-lg border border-white/10 bg-black/45 px-3 py-1 text-xs text-neutral-300 backdrop-blur-sm">
              Syncing dashboard data...
            </div>
          ) : null}
          {data.error ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {data.error}
            </div>
          ) : null}

          <Outlet context={data} />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
