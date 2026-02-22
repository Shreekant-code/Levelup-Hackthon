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

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
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

const AnalyticsCharts = ({ tasks = [], productivity = [], xpGrowth = [] }) => {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const completionByDay = dayLabels.map((_, index) =>
    tasks.filter((task) => {
      const day = new Date(task.createdAt || task.updatedAt || Date.now()).getDay()
      const mapped = day === 0 ? 6 : day - 1
      return mapped === index && task.status === 'completed'
    }).length
  )

  const completedCount = tasks.filter((task) => task.status === 'completed').length
  const pendingCount = tasks.length - completedCount

  const xpLabels = xpGrowth.length
    ? xpGrowth.map((item) => new Date(item.date).toLocaleDateString())
    : dayLabels
  const xpData = xpGrowth.length
    ? xpGrowth.map((item) => item.xp)
    : productivity.slice(0, 7).reverse().map((item, idx) => Math.round((item.totalScore || 0) * 100 + idx * 10))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <article className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-xl h-72">
        <p className="text-sm font-semibold">Day-wise Task Completion</p>
        <div className="mt-3 h-56">
          <Line
            data={{
              labels: dayLabels,
              datasets: [
                {
                  label: 'Completed Tasks',
                  data: completionByDay,
                  borderColor: '#60a5fa',
                  backgroundColor: 'rgba(96,165,250,0.2)',
                  tension: 0.3,
                },
              ],
            }}
            options={chartBaseOptions}
          />
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-xl h-72">
        <p className="text-sm font-semibold">Completed vs Pending</p>
        <div className="mt-3 h-56">
          <Doughnut
            data={{
              labels: ['Completed', 'Pending'],
              datasets: [
                {
                  data: [completedCount, pendingCount],
                  backgroundColor: ['#22c55e', '#a855f7'],
                  borderColor: ['#22c55e', '#a855f7'],
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#cbd5e1' } } },
            }}
          />
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-xl h-72">
        <p className="text-sm font-semibold">XP Growth Trend</p>
        <div className="mt-3 h-56">
          <Line
            data={{
              labels: xpLabels,
              datasets: [
                {
                  label: 'XP',
                  data: xpData,
                  borderColor: '#a855f7',
                  backgroundColor: 'rgba(168,85,247,0.2)',
                  tension: 0.35,
                },
              ],
            }}
            options={chartBaseOptions}
          />
        </div>
      </article>
    </div>
  )
}

export default AnalyticsCharts
