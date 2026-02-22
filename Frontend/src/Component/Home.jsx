import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { TypeAnimation } from 'react-type-animation'
import { ChevronRight, Rocket, Zap } from 'lucide-react'
import HowFutureMEWorksModal, {
  dismissHowItWorks,
  getHowItWorksDismissed,
} from '../components/HowFutureMEWorksModal'

export const Home = () => {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(() => !getHowItWorksDismissed())

  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        duration: 7 + i,
        width: 120 + i * 36,
        height: 120 + i * 36,
        left: 12 + i * 18,
        top: 10 + (i % 3) * 24,
      })),
    []
  )

  const handleCloseHowItWorks = useCallback(() => {
    dismissHowItWorks()
    setIsHowItWorksOpen(false)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-cyan-500/30">
      <AnimatePresence>
        {isHowItWorksOpen ? <HowFutureMEWorksModal onClose={handleCloseHowItWorks} /> : null}
      </AnimatePresence>

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 hidden md:block md:bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.1),transparent_50%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            animate={{ y: [0, -72, 0], opacity: [0.08, 0.2, 0.08] }}
            transition={{ duration: particle.duration, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute rounded-full bg-cyan-500/15 blur-2xl"
            style={{
              width: particle.width,
              height: particle.height,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              transform: 'translateZ(0)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto flex min-h-screen flex-col items-center justify-between px-6 pt-20 lg:flex-row lg:pt-0">
        <div className="order-2 w-full space-y-8 pb-20 text-center lg:order-1 lg:w-1/2 lg:pb-0 lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Next-Gen Learning Engine Active
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <h1 className="text-5xl font-black leading-[0.9] tracking-tighter md:text-7xl lg:text-8xl">
              STOP PLANNING. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                START EVOLVING.
              </span>
            </h1>
            <p className="mx-auto max-w-lg text-lg font-light leading-relaxed text-gray-400 md:text-xl lg:mx-0">
              FutureMe is the <span className="font-medium italic text-white">Predictive Productivity OS</span> that
              turns your daily habits into a masterclass of skill growth.
            </p>
          </motion.div>

          <div className="flex h-12 items-center justify-center font-mono text-xl text-cyan-400 md:text-2xl lg:justify-start">
            <span className="mr-2 text-gray-600">&gt;</span>
            <TypeAnimation
              sequence={[
                'Optimize Focus Cycles.',
                1500,
                'Predict Career Trajectory.',
                1500,
                'Master New Dimensions.',
                1500,
                'Unlock Human Potential.',
                1500,
              ]}
              speed={50}
              repeat={Infinity}
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="pt-6"
          >
            <Link to="/dashboard" className="group relative inline-block">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 opacity-40 blur-2xl transition duration-300 group-hover:opacity-85" />
              <button className="relative flex items-center gap-4 rounded-2xl border border-white/20 bg-black px-10 py-5 text-lg font-bold tracking-tight transition-all hover:border-transparent">
                <Rocket className="h-6 w-6 text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                INITIATE ASCENSION
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" />
              </button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative order-1 mt-10 flex w-full justify-center lg:order-2 lg:mt-0 lg:w-1/2 lg:justify-end"
        >
          <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/10 blur-[40px]" />

          <div className="h-80 w-80 drop-shadow-[0_0_28px_rgba(34,211,238,0.2)] md:h-[550px] md:w-[550px] lg:h-[650px] lg:w-[650px]">
            <DotLottieReact src="https://lottie.host/54c8632d-1074-49e3-a7b8-e60fc6d07d9c/uOpuYNoYvt.lottie" loop autoplay />
          </div>

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-10 top-20 hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm xl:flex"
          >
            <Zap className="text-yellow-400" />
            <div className="text-xs font-bold uppercase tracking-tighter">Peak Focus: 98%</div>
          </motion.div>
        </motion.div>
      </div>

      <footer className="absolute bottom-0 w-full border-t border-white/5 bg-gradient-to-t from-black to-transparent py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-gray-600">
            Designed by Team SSA - System v4.0.0
          </p>
          <div className="flex gap-8 text-xs font-mono text-gray-500">
            <span className="cursor-pointer transition hover:text-cyan-400">SECURITY</span>
            <span className="cursor-pointer transition hover:text-cyan-400">ARCHITECTURE</span>
            <span className="cursor-pointer transition hover:text-cyan-400">NEURAL_LINK</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
