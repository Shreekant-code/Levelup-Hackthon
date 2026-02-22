import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, CheckCircle2, Flame, ListTodo, Rocket, Sparkles, UserPlus } from 'lucide-react'

const Whattodo = () => {
  const steps = useMemo(
    () => [
      {
        icon: UserPlus,
        title: '1. Set Your Goal',
        desc: 'Choose your target role and define your daily available learning hours to initialize your growth journey.',
      },
      {
        icon: ListTodo,
        title: '2. Create Daily Tasks',
        desc: 'Add structured tasks with difficulty level, estimated hours, and planned date for smart productivity tracking.',
      },
      {
        icon: CheckCircle2,
        title: '3. Complete & Earn XP',
        desc: 'Mark tasks as completed to gain XP, level up, and maintain your daily streak consistency.',
      },
      {
        icon: BarChart3,
        title: '4. Track Analytics',
        desc: 'Visualize your day-wise productivity, XP growth, and task performance through dynamic charts.',
      },
      {
        icon: Sparkles,
        title: '5. Generate AI Roadmap',
        desc: 'Let AI create a personalized 7-day plan based on your progress, weaknesses, and available time.',
      },
      {
        icon: Rocket,
        title: '6. Level Up Continuously',
        desc: 'Use gamification - XP, streaks, levels - to continuously improve and stay motivated.',
      },
    ],
    []
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-16 text-white">
      <div className="mb-16 text-center">
        <h1 className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
          Your Growth Blueprint
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-400">
          Follow these intelligent steps to transform your daily efforts into measurable growth.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon

          return (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 opacity-0 transition duration-200 group-hover:opacity-100" />

              <div className="relative z-10">
                <div className="mb-6 text-cyan-400">
                  <Icon size={28} />
                </div>

                <h3 className="mb-4 text-xl font-semibold">{step.title}</h3>

                <p className="text-sm leading-relaxed text-gray-400">{step.desc}</p>
              </div>
            </motion.article>
          )
        })}
      </div>

      <div className="mt-24 text-center">
        <div className="flex items-center justify-center gap-3 text-lg font-semibold text-orange-400">
          <Flame />
          Stay Consistent. Build Momentum.
        </div>
        <p className="mt-2 text-gray-500">Small disciplined actions compound into massive success.</p>
      </div>
    </div>
  )
}

export default memo(Whattodo)
export { Whattodo }
