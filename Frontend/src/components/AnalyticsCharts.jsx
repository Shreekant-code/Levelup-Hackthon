import { memo, useMemo } from 'react'
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
)

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 260 },
  plugins: {
    legend: {
      labels: { color: '#cbd5e1' },
    },
  },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 260 },
  plugins: { legend: { labels: { color: '#cbd5e1' } } },
}

const AnalyticsCharts = ({ tasks = [], productivity = [], xpGrowth = [] }) => {
  const completionByDay = useMemo(() => {
    const mapped = Array(7).fill(0)

    for (const task of tasks) {
      if (task.status !== 'completed') continue
      const day = new Date(task.createdAt || task.updatedAt || Date.now()).getDay()
      const index = day === 0 ? 6 : day - 1
      mapped[index] += 1
    }

    return mapped
  }, [tasks])

  const completedCount = useMemo(
    () => tasks.reduce((count, task) => (task.status === 'completed' ? count + 1 : count), 0),
    [tasks]
  )

  const pendingCount = useMemo(() => tasks.length - completedCount, [tasks.length, completedCount])

  const xpSeries = useMemo(() => {
    const labels = xpGrowth.length
      ? xpGrowth.map((item) => new Date(item.date).toLocaleDateString())
      : DAY_LABELS

    const data = xpGrowth.length
      ? xpGrowth.map((item) => item.xp)
      : productivity.slice(0, 7).reverse().map((item, idx) => Math.round((item.totalScore || 0) * 100 + idx * 10))

    return { labels, data }
  }, [xpGrowth, productivity])

  const lineData = useMemo(
    () => ({
      labels: DAY_LABELS,
      datasets: [
        {
          label: 'Completed Tasks',
          data: completionByDay,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96,165,250,0.2)',
          tension: 0.3,
        },
      ],
    }),
    [completionByDay]
  )

  const pieData = useMemo(
    () => ({
      labels: ['Completed', 'Pending'],
      datasets: [
        {
          data: [completedCount, pendingCount],
          backgroundColor: ['#22c55e', '#a855f7'],
          borderColor: ['#22c55e', '#a855f7'],
          borderWidth: 1,
        },
      ],
    }),
    [completedCount, pendingCount]
  )

  const xpData = useMemo(
    () => ({
      labels: xpSeries.labels,
      datasets: [
        {
          label: 'XP',
          data: xpSeries.data,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,0.2)',
          tension: 0.35,
        },
      ],
    }),
    [xpSeries]
  )

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article className="h-72 rounded-2xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-md">
        <p className="text-sm font-semibold">Day-wise Task Completion</p>
        <div className="mt-3 h-56">
          <Line data={lineData} options={chartBaseOptions} />
        </div>
      </article>

      <article className="h-72 rounded-2xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-md">
        <p className="text-sm font-semibold">Completed vs Pending</p>
        <div className="mt-3 h-56">
          <Doughnut data={pieData} options={doughnutOptions} />
        </div>
      </article>

      <article className="h-72 rounded-2xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-md">
        <p className="text-sm font-semibold">XP Growth Trend</p>
        <div className="mt-3 h-56">
          <Line data={xpData} options={chartBaseOptions} />
        </div>
      </article>
    </div>
  )
}

export default memo(AnalyticsCharts)
