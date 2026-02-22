import { memo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BrainCircuit,
  CheckCircle2,
  ListChecks,
  Route,
  SlidersHorizontal,
  Target,
  Trophy,
} from 'lucide-react'

const ONBOARDING_STORAGE_KEY = 'futureme_how_it_works_dismissed_v2'

const steps = [
  {
    title: 'Step 1 - Set Your Goal',
    description: 'Choose your target role so the system knows where to guide you.',
    example: 'Example: Fullstack Developer.',
    icon: Target,
  },
  {
    title: 'Step 2 - Add Skills & Tasks',
    description: 'Add skills like React, DSA, and Node, then create actionable study tasks.',
    example: 'Example: Practice React Hooks for 1 hour.',
    icon: ListChecks,
  },
  {
    title: 'Step 3 - System Behavior Analysis',
    description:
      'The engine tracks completion rate, detects skipped tasks, calculates streak, detects skill gaps, and measures stagnation.',
    icon: BrainCircuit,
  },
  {
    title: 'Step 4 - AI Generates Roadmap',
    description: 'AI builds a personalized 7-day adaptive roadmap from your performance and weak skills.',
    icon: Route,
  },
  {
    title: 'Step 5 - Earn XP & Build Streak',
    description: 'Completed tasks award XP and stronger streaks reinforce consistency and discipline.',
    icon: Trophy,
  },
  {
    title: 'Step 6 - Adaptive Optimization',
    description:
      'If you skip tasks, the next plan is simplified. If you perform well, tasks become more challenging automatically.',
    icon: SlidersHorizontal,
  },
]

const HowFutureMEWorksModal = ({ onClose }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.985 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-[0_0_36px_rgba(34,211,238,0.12)]"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-20 rounded-full bg-cyan-500/10 blur-2xl" />

        <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-7 lg:p-8">
          <div className="mb-5 sm:mb-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
              <CheckCircle2 size={14} />
              Onboarding
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">🧠 How FutureME Works</h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Your adaptive productivity system turns daily actions into measurable growth.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <article
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-slate-900/65 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/10 text-cyan-200">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 sm:text-base">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-300">{step.description}</p>
                      {step.example ? <p className="mt-1 text-sm text-cyan-200/85">{step.example}</p> : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-blue-400/25 bg-blue-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Real Example</p>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              If you skip DSA for 3 days, the system detects a skill gap and adds a lighter DSA revision block in your
              next roadmap to rebuild momentum.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(37,99,235,0.35)] transition hover:brightness-110"
            >
              Go to Home
            </button>
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}

export const getHowItWorksDismissed = () => {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
}

export const dismissHowItWorks = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
}

export default memo(HowFutureMEWorksModal)
