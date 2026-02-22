import './App.css'
import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useOutletContext } from 'react-router-dom'
import {
  AlertCircle,
  Brain,
  ClipboardList,
  Flame,
  Gauge,
  Link2,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import { Home } from './Component/Home'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { api } from './utils/api'
import { useToast } from './context/ToastContext'
import { Whattodo } from './Component/whattodo'

const AnalyticsCharts = lazy(() => import('./components/AnalyticsCharts'))

const card =
  'rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,.35)]'

const Metric = memo(({ title, value, hint, icon: Icon }) => (
  <article className={`${card} p-4`}>
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-widest text-neutral-400">{title}</p>
      <Icon size={16} className="text-blue-300" />
    </div>
    <h3 className="mt-3 text-2xl font-bold">{value}</h3>
    <p className="text-sm text-neutral-400">{hint}</p>
  </article>
))

const AI_MESSAGES = [
  'Analyzing your skill progress...',
  'Evaluating completion patterns...',
  'Detecting skill gaps...',
  'Applying reinforcement logic...',
  'Optimizing workload balance...',
  'Calculating success probability...',
  'Generating adaptive roadmap...',
]

const MIN_ROADMAP_LOADING_MS = 600
const ROADMAP_DEBOUNCE_MS = 300

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const notificationStyleMap = {
  reminder: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100',
  streak: 'border-orange-500/30 bg-orange-500/10 text-orange-100',
  levelup: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  default: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
}

const notificationIconMap = {
  reminder: AlertCircle,
  streak: Zap,
  levelup: Trophy,
  default: Rocket,
}

const RoadmapLoadingPanel = memo(() => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [fakeProgress, setFakeProgress] = useState(3)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % AI_MESSAGES.length)
    }, 2500)

    const progressInterval = setInterval(() => {
      setFakeProgress((prev) => Math.min(95, prev + 3 + Math.random() * 4))
    }, 900)

    return () => {
      clearInterval(messageInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-cyan-300" />
        <p className="text-sm text-cyan-100">{AI_MESSAGES[currentMessageIndex]}</p>
        <div className="inline-flex items-center gap-1 pl-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${Math.max(3, Math.min(100, fakeProgress))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-cyan-200/80">
        AI is building your adaptive weekly plan using your latest performance signals.
      </p>
    </div>
  )
})

const OverviewPage = () => {
  const { metrics, productivity } = useOutletContext()
  const trend = productivity.slice(0, 7).reverse()

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold md:text-3xl">Overview</h1>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Productivity Score"
          value={`${(metrics.productivityScore * 100).toFixed(0)}%`}
          hint="Adaptive score"
          icon={Gauge}
        />
        <Metric
          title="Completion Rate"
          value={`${(metrics.completionRate * 100).toFixed(0)}%`}
          hint={`${metrics.completedTasks} tasks completed`}
          icon={ClipboardList}
        />
        <Metric title="Focus Hours" value={metrics.focusHoursTotal.toFixed(1)} hint="Total logged" icon={Target} />
        <Metric
          title="Streak"
          value={`${metrics.streak} day${metrics.streak === 1 ? '' : 's'}`}
          hint="Consistency"
          icon={TrendingUp}
        />
      </div>

      <div className={`${card} p-4`}>
        <p className="text-sm">
          XP Level {metrics.level} - {metrics.levelLabel}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            style={{ width: `${(metrics.xpInLevel.value / metrics.xpInLevel.max) * 100}%` }}
          />
        </div>
      </div>

      <div className={`${card} p-4`}>
        <p className="text-sm">Weekly Trend</p>
        <div className="mt-3 grid h-32 grid-cols-7 items-end gap-2">
          {(trend.length ? trend : Array.from({ length: 7 }).map(() => ({ totalScore: 0 }))).map((item, index) => (
            <div key={index} className="flex h-full items-end rounded bg-white/10">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-purple-500"
                style={{ height: `${Math.max(6, (item.totalScore || 0) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TasksPage = () => {
  const { tasks, refreshAll } = useOutletContext()
  const { addToast } = useToast()
  const [form, setForm] = useState({
    title: '',
    subject: '',
    deadline: '',
    weaknessLevel: 3,
    difficulty: 'easy',
  })
  const [loading, setLoading] = useState(false)

  const createTask = async (event) => {
    event.preventDefault()

    if (!form.title || !form.subject || !form.deadline) {
      return addToast({ type: 'error', title: 'Validation', message: 'Please complete all task fields.' })
    }

    setLoading(true)
    const response = await api.post('/api/tasks', form)
    setLoading(false)

    if (!response.ok) {
      return addToast({
        type: 'error',
        title: 'Task Error',
        message: response.data?.message || 'Could not create task.',
      })
    }

    setForm({ title: '', subject: '', deadline: '', weaknessLevel: 3, difficulty: 'easy' })
    addToast({ type: 'success', title: 'Task Created', message: 'Task added successfully.' })
    refreshAll({ quiet: true })
  }

  const toggleTask = async (task) => {
    const response = await api.put(`/api/tasks/${task._id}`, {
      status: task.status === 'completed' ? 'pending' : 'completed',
    })

    if (!response.ok) {
      return addToast({
        type: 'error',
        title: 'Task Error',
        message: response.data?.message || 'Could not update task status.',
      })
    }

    refreshAll({ quiet: true })
  }

  const deleteTask = async (taskId) => {
    const response = await api.delete(`/api/tasks/${taskId}`)

    if (!response.ok) {
      return addToast({
        type: 'error',
        title: 'Task Error',
        message: response.data?.message || 'Could not delete task.',
      })
    }

    refreshAll({ quiet: true })
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold md:text-3xl">Tasks</h1>

      <form onSubmit={createTask} className={`${card} grid grid-cols-1 gap-2 p-4 lg:grid-cols-6`}>
        <input
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        />
        <input
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          placeholder="Subject"
          value={form.subject}
          onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
        />
        <input
          type="date"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          value={form.deadline}
          onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
        />
        <input
          type="number"
          min="1"
          max="5"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          value={form.weaknessLevel}
          onChange={(event) => setForm((prev) => ({ ...prev, weaknessLevel: Number(event.target.value) }))}
        />
        <select
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          value={form.difficulty}
          onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 py-2 font-semibold disabled:opacity-60"
        >
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      <div className="space-y-2">
        {tasks.map((task) => (
          <article
            key={task._id}
            className={`${card} flex flex-col justify-between gap-2 p-4 sm:flex-row`}
          >
            <div>
              <p className="font-semibold">{task.title}</p>
              <p className="text-sm text-neutral-400">
                {task.subject} | {task.status} | {task.difficulty || 'easy'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleTask(task)}
                className="rounded-lg border border-white/15 px-3 py-1 text-sm"
              >
                Toggle
              </button>
              <button
                type="button"
                onClick={() => deleteTask(task._id)}
                className="rounded-lg border border-red-400/30 px-3 py-1 text-sm text-red-300"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const SkillsPage = () => {
  const { skills, refreshAll } = useOutletContext()
  const { addToast } = useToast()
  const [skillName, setSkillName] = useState('')
  const [loading, setLoading] = useState(false)

  const addSkill = async (event) => {
    event.preventDefault()

    if (!skillName.trim()) {
      return addToast({ type: 'error', title: 'Validation', message: 'Skill name is required.' })
    }

    setLoading(true)
    const response = await api.post('/api/skills', { skillName: skillName.trim() })
    setLoading(false)

    if (!response.ok) {
      return addToast({
        type: 'error',
        title: 'Skill Error',
        message: response.data?.message || 'Could not add skill.',
      })
    }

    setSkillName('')
    refreshAll({ quiet: true })
  }

  const updateProgress = async (id, progressPercentage) => {
    const response = await api.put(`/api/skills/${id}`, { progressPercentage })
    if (!response.ok) return
    refreshAll({ quiet: true })
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold md:text-3xl">Skills</h1>

      <form onSubmit={addSkill} className={`${card} flex flex-col gap-2 p-4 sm:flex-row`}>
        <input
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          placeholder="Skill name"
          value={skillName}
          onChange={(event) => setSkillName(event.target.value)}
        />
        <button
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 font-semibold disabled:opacity-60"
        >
          {loading ? 'Adding...' : 'Add Skill'}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {skills.map((skill) => (
          <article key={skill._id} className={`${card} p-4`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{skill.skillName}</h3>
              <span className="text-xs text-neutral-400">{skill.progressPercentage || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue={skill.progressPercentage || 0}
              onMouseUp={(event) => updateProgress(skill._id, Number(event.currentTarget.value))}
              className="mt-3 w-full"
            />
          </article>
        ))}
      </div>
    </section>
  )
}

const AnalyticsPage = () => {
  const { tasks, skills, studyLogs, productivity, metrics } = useOutletContext()
  const weekly = productivity.slice(0, 7).reverse()
  const weakestSkill = useMemo(
    () =>
      [...skills].sort((a, b) => (a.progressPercentage || 0) - (b.progressPercentage || 0))[0],
    [skills]
  )

  const xpGrowth = useMemo(() => {
    const completed = tasks
      .filter((task) => task.status === 'completed')
      .sort((a, b) => new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt))

    let totalXp = 0
    return completed.map((task) => {
      const difficulty = String(task.difficulty || 'easy').toLowerCase()
      const gained = difficulty === 'hard' ? 100 : difficulty === 'medium' ? 50 : 20
      totalXp += gained
      return {
        date: task.updatedAt || task.createdAt,
        xp: totalXp,
      }
    })
  }, [tasks])
  const shouldRenderCharts = tasks.length > 0 || productivity.length > 0 || xpGrowth.length > 0

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold md:text-3xl">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={`${card} p-4`}>
          <p className="text-sm">Weekly Productivity Trend</p>
          <div className="mt-3 grid h-32 grid-cols-7 items-end gap-2">
            {(weekly.length ? weekly : Array.from({ length: 7 }).map(() => ({ totalScore: 0 }))).map(
              (item, index) => (
                <div key={index} className="flex h-full items-end rounded bg-white/10">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-cyan-400"
                    style={{ height: `${Math.max(6, (item.totalScore || 0) * 100)}%` }}
                  />
                </div>
              )
            )}
          </div>
        </div>

        <div className={`${card} p-4`}>
          <p className="text-sm">AI Analysis Panel</p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-300">
            <li>{studyLogs.length ? 'Your focus usually drops when your streak breaks.' : 'Add study logs for deeper insights.'}</li>
            <li>
              {weakestSkill
                ? `${weakestSkill.skillName} progress is currently slower than your strongest skill.`
                : 'Track skills to compare growth.'}
            </li>
            <li>Recommendation: complete one hard task in your first focus block daily.</li>
          </ul>
        </div>
      </div>

      <div className={`${card} p-4`}>
        <p className="text-sm font-semibold">How AI Works</p>
        <div className="mt-3 grid grid-cols-1 gap-2 text-center text-xs sm:grid-cols-5">
          {['User Data', 'Productivity Engine', 'AI Analysis', 'Roadmap Generation', 'Growth Loop'].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-black/40 px-2 py-3">
              {item}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-neutral-400">
          Tasks: {tasks.length} | Skills: {skills.length} | Score: {(metrics.productivityScore * 100).toFixed(0)}%
        </p>
      </div>

      {shouldRenderCharts ? (
        <Suspense
          fallback={
            <div className={`${card} p-4 text-sm text-neutral-400`}>Loading analytics visuals...</div>
          }
        >
          <AnalyticsCharts tasks={tasks} productivity={productivity} xpGrowth={xpGrowth} />
        </Suspense>
      ) : (
        <div className={`${card} p-4 text-sm text-neutral-400`}>
          Add activity data to unlock analytics visuals.
        </div>
      )}
    </section>
  )
}

const RoadmapPage = () => {
  const {
    roadmap,
    setRoadmap,
    optimizationMeta,
    setOptimizationMeta,
    analysisSummary,
    setAnalysisSummary,
    chartData,
    setChartData,
    refreshAll,
  } = useOutletContext()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const debounceRef = useRef(null)
  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const notificationStyle = useCallback(
    (type) => notificationStyleMap[type] || notificationStyleMap.default,
    []
  )

  const notificationIcon = useCallback((type) => {
    const Icon = notificationIconMap[type] || notificationIconMap.default
    return <Icon size={14} />
  }, [])

  const generateRoadmap = useCallback(async () => {
    if (inFlightRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      if (inFlightRef.current || !mountedRef.current) return
      inFlightRef.current = true

      setGenerateError('')
      setLoading(true)
      const startedAt = Date.now()
      let response = null

      try {
        response = await api.post('/api/generate-roadmap', {})
      } catch (error) {
        if (!mountedRef.current) return
        setLoading(false)
        inFlightRef.current = false
        const message = error?.message || 'Could not generate roadmap. Please retry.'
        setGenerateError(message)
        addToast({
          type: 'error',
          title: 'Roadmap Error',
          message,
        })
        return
      } finally {
        const elapsed = Date.now() - startedAt
        if (elapsed < MIN_ROADMAP_LOADING_MS) {
          await wait(MIN_ROADMAP_LOADING_MS - elapsed)
        }
      }

      if (!mountedRef.current) return
      setLoading(false)
      inFlightRef.current = false

      if (!response.ok) {
        setGenerateError(response.data?.message || 'Could not generate roadmap. Please retry.')
        return addToast({
          type: 'error',
          title: 'Roadmap Error',
          message: response.data?.message || 'Could not generate roadmap.',
        })
      }

      const roadmapData = Array.isArray(response.data?.roadmap)
        ? response.data.roadmap
        : response.data?.roadmap?.weeklyPlan || []

      setRoadmap(roadmapData)
      setOptimizationMeta(response.data?.optimizationMeta || null)
      setAnalysisSummary(response.data?.analysisSummary || null)
      setChartData(response.data?.chartData || null)
      refreshAll({ quiet: true })

      addToast({
        type: response.data?.isStarter ? 'info' : 'success',
        title: response.data?.isStarter ? 'Starter Roadmap Ready' : 'Adaptive Roadmap Ready',
        message: response.data?.isStarter
          ? 'No productivity history yet, so a creative starter roadmap was generated.'
          : 'Roadmap updated from your latest productivity and skill signals.',
      })
    }, ROADMAP_DEBOUNCE_MS)
  }, [addToast, refreshAll, setAnalysisSummary, setChartData, setOptimizationMeta, setRoadmap])

  return (
    <section className="space-y-4">
      {optimizationMeta ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-300">Optimization Summary</p>
              <div className="mt-1 inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">
                {optimizationMeta.version || 'initial'}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-200/80">Predicted Success Rate</p>
              <p className="text-3xl font-black text-emerald-300">
                {Number.isFinite(Number(optimizationMeta.predictedSuccessRate))
                  ? `${Math.round(Number(optimizationMeta.predictedSuccessRate))}%`
                  : '--'}
              </p>
            </div>
          </div>
          {optimizationMeta.improvementStrategy ? (
            <p className="mt-3 text-sm text-emerald-100/90">{optimizationMeta.improvementStrategy}</p>
          ) : null}
        </div>
      ) : null}

      {analysisSummary ? (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-blue-300">Performance Intelligence</p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-neutral-400">Roadmap Completion</p>
              <p className="text-lg font-bold text-blue-200">
                {Number.isFinite(Number(analysisSummary.roadmapCompletionRate))
                  ? `${Math.round(Number(analysisSummary.roadmapCompletionRate))}%`
                  : '--'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-neutral-400">Tasks Missed</p>
              <p className="text-lg font-bold text-blue-200">{analysisSummary.tasksMissed ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-neutral-400">Most Skipped Focus</p>
              <p className="text-blue-100">{analysisSummary.mostSkippedFocus || 'None'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-neutral-400">Streak Status</p>
              <p className="text-blue-100 capitalize">{analysisSummary.streakStatus || 'stable'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-neutral-400">Performance Trend</p>
              <p className="text-blue-100 capitalize">{analysisSummary.performanceTrend || 'stable'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-neutral-400">Reinforcement Action</p>
              <p className="text-blue-100 capitalize">{analysisSummary.reinforcementAction || 'reward'}</p>
            </div>
          </div>
          {Array.isArray(analysisSummary.repeatedGapSkills) && analysisSummary.repeatedGapSkills.length ? (
            <p className="mt-3 text-sm text-blue-100">
              Repeated Gap Skills: {analysisSummary.repeatedGapSkills.join(', ')}
            </p>
          ) : null}
          {analysisSummary.improvementReason ? (
            <p className="mt-2 text-sm text-blue-100/90">{analysisSummary.improvementReason}</p>
          ) : null}
        </div>
      ) : null}

      {chartData ? (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-cyan-300">Chart-ready Metrics</p>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-400">Daily Completion</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(chartData.dailyCompletion || []).map((item, idx) => (
                  <span key={idx} className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
                    {item.day}: {item.value}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-400">XP Trend</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(chartData.xpTrend || []).map((item, idx) => (
                  <span key={idx} className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
                    {item.day}: {item.xp} XP
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-400">Skill Gap Radar</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(chartData.skillGapRadar || []).map((item, idx) => (
                  <span key={idx} className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
                    {item.skill}: {Math.round(Number(item.gapScore || 0))}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-400">Adaptive Trend</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(chartData.adaptiveTrend || []).map((item, idx) => (
                  <span key={idx} className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
                    {item.focusTopic}: {Math.round(Number(item.adaptiveScore || 0))}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`${card} p-4`}>
        <h1 className="text-2xl font-bold md:text-3xl">AI Roadmap</h1>
        <p className="mt-2 text-sm text-neutral-400">
          AI adapts your weekly learning roadmap using your role, level, and performance trends.
        </p>
        <button
          type="button"
          onClick={generateRoadmap}
          disabled={loading}
          className="mt-4 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 font-semibold disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Regenerate'}
        </button>

        {loading ? <RoadmapLoadingPanel /> : null}

        {generateError ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {generateError}
          </div>
        ) : null}
      </div>

      {Array.isArray(roadmap) && roadmap.length ? (
        roadmap.map((item, index) => (
          <article key={index} className={`${card} p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{item.day}</h3>
              <div className="flex gap-2 text-xs text-neutral-300">
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1">{item.estimatedHours}h</span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
                  {item.xpReward} XP
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-blue-300">Focus: {item.focusTopic}</p>
            <ul className="mt-2 list-inside list-disc text-sm text-neutral-300">
              {(item.tasks || []).map((task, taskIndex) => (
                <li key={taskIndex}>{task}</li>
              ))}
            </ul>

            {Number.isFinite(Number(item.adaptiveScore)) ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Adaptive Score</span>
                  <span>{Math.round(Number(item.adaptiveScore))}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, Number(item.adaptiveScore)))}%` }}
                  />
                </div>
              </div>
            ) : null}

            {item.youtubeSuggestion?.url ? (
              <a
                href={item.youtubeSuggestion.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 hover:bg-blue-500/20"
              >
                <Link2 size={14} />
                Watch Learning Resource
              </a>
            ) : null}

            {Array.isArray(item.notifications) && item.notifications.length ? (
              <div className="mt-3 space-y-2">
                {item.notifications.map((note, noteIndex) => (
                  <div
                    key={noteIndex}
                    className={`rounded-lg border px-3 py-2 text-xs ${notificationStyle(note.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{notificationIcon(note.type)}</span>
                      <div>
                        <p className="font-medium">{note.message || 'Notification'}</p>
                        <p className="opacity-80">{note.triggerCondition || ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="mt-3 text-xs text-neutral-400">{item.motivationalMessage}</p>
          </article>
        ))
      ) : (
        <div className={`${card} p-5 text-neutral-400`}>No roadmap generated yet.</div>
      )}
    </section>
  )
}

const StudyLogPage = () => {
  const { studyLogs, refreshAll } = useOutletContext()
  const { addToast } = useToast()
  const [focusHours, setFocusHours] = useState('')
  const [tasksCompleted, setTasksCompleted] = useState('')
  const [loading, setLoading] = useState(false)

  const submitLog = async (event) => {
    event.preventDefault()

    if (!focusHours && !tasksCompleted) {
      return addToast({ type: 'error', title: 'Validation', message: 'Enter focus hours or completed tasks.' })
    }

    setLoading(true)
    const response = await api.post('/api/study-log', {
      focusHours: Number(focusHours || 0),
      tasksCompleted: Number(tasksCompleted || 0),
    })
    setLoading(false)

    if (!response.ok) {
      return addToast({
        type: 'error',
        title: 'Study Log Error',
        message: response.data?.message || 'Could not save study log.',
      })
    }

    setFocusHours('')
    setTasksCompleted('')
    refreshAll({ quiet: true })
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold md:text-3xl">Study Log</h1>

      <form onSubmit={submitLog} className={`${card} flex flex-col gap-2 p-4 md:flex-row`}>
        <input
          type="number"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          placeholder="Focus hours"
          value={focusHours}
          onChange={(event) => setFocusHours(event.target.value)}
        />
        <input
          type="number"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          placeholder="Tasks completed"
          value={tasksCompleted}
          onChange={(event) => setTasksCompleted(event.target.value)}
        />
        <button
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 font-semibold disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>

      <div className="space-y-2">
        {studyLogs.map((log) => (
          <article key={log._id} className={`${card} p-4 text-sm`}>
            <p className="font-medium">{new Date(log.date).toLocaleDateString()}</p>
            <p className="text-neutral-400">
              Focus {log.focusHours}h | Completed {log.tasksCompleted}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

const GamificationPage = () => {
  const { metrics } = useOutletContext()

  const badges = [
    { label: '7 Day Streak', unlocked: metrics.streak >= 7 },
    { label: '10 Tasks Completed', unlocked: metrics.completedTasks >= 10 },
    { label: '20 Hours Focus Logged', unlocked: metrics.focusHoursTotal >= 20 },
  ]

  const motivationalMessage =
    metrics.streak >= 5
      ? 'You are in a high-consistency zone. Push for one extra hard task today.'
      : 'Build your streak with one focused win today. Consistency creates momentum.'

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold md:text-3xl">Gamification</h1>

      <div className={`${card} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-400">
              Level {metrics.level} - {metrics.levelLabel}
            </p>
            <p className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-3xl font-black text-transparent">
              {Math.round(metrics.xp)} XP
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-sm text-orange-200">
            <Flame size={14} /> {metrics.streak} day streak
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            style={{ width: `${(metrics.xpInLevel.value / metrics.xpInLevel.max) * 100}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-neutral-300">{motivationalMessage}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <article
            key={badge.label}
            className={`${card} p-4 ${badge.unlocked ? 'border-emerald-400/40' : 'opacity-70'}`}
          >
            <div className="flex items-center gap-2">
              <Trophy size={16} className={badge.unlocked ? 'text-emerald-300' : 'text-neutral-500'} />
              <p>{badge.label}</p>
            </div>
            <p className="mt-2 text-sm text-neutral-400">{badge.unlocked ? 'Unlocked' : 'In progress'}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

const NotificationsPage = () => {
  const { metrics } = useOutletContext()

  const colorClass = (type) => {
    if (type === 'success') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    if (type === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    return 'border-blue-500/30 bg-blue-500/10 text-blue-200'
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold md:text-3xl">Notifications</h1>
      <div className="space-y-2">
        {metrics.notifications.map((notification, index) => (
          <article key={index} className={`rounded-xl border p-4 ${colorClass(notification.type)}`}>
            <p className="text-sm">{notification.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

const App = () => (
  <Routes>
    <Route
  path="/"
  element={
    <>
      <Home />
      <Whattodo />
    </>
  }
/>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<OverviewPage />} />
      <Route path="tasks" element={<TasksPage />} />
      <Route path="skills" element={<SkillsPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="roadmap" element={<RoadmapPage />} />
      <Route path="study-log" element={<StudyLogPage />} />
      <Route path="gamification" element={<GamificationPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default App
