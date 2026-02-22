import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { TypeAnimation } from "react-type-animation";
import { ChevronRight, Zap, Star, Shield, Rocket } from "lucide-react";

export const Home = () => {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-cyan-500/30">
      
      {/* 🌌 INNOVATIVE BACKGROUND ARCHITECTURE */}
      <div className="absolute inset-0 z-0">
        {/* Animated Radial Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.1),transparent_50%)]" />
        
        {/* Tech-Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        {/* Floating "Data Particles" */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -100, 0], 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1] 
            }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity }}
            className="absolute bg-cyan-500/20 blur-xl rounded-full"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* 🔥 MAIN HERO SECTION */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col lg:flex-row items-center justify-between min-h-screen pt-20 lg:pt-0">

        {/* LEFT SIDE: COMMAND CENTER */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8 order-2 lg:order-1 pb-20 lg:pb-0">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
              Next-Gen Learning Engine Active
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
              STOP PLANNING. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                START EVOLVING.
              </span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-lg mx-auto lg:mx-0 leading-relaxed">
              FutureMe is the <span className="text-white font-medium italic">Predictive Productivity OS</span> that turns your daily habits into a masterclass of skill growth.
            </p>
          </motion.div>

          <div className="h-12 text-cyan-400 text-xl md:text-2xl font-mono flex justify-center lg:justify-start items-center">
            <span className="mr-2 text-gray-600">&gt;</span>
            <TypeAnimation
              sequence={[
                "Optimize Focus Cycles.", 1500,
                "Predict Career Trajectory.", 1500,
                "Master New Dimensions.", 1500,
                "Unlock Human Potential.", 1500,
              ]}
              speed={50}
              repeat={Infinity}
            />
          </div>

          {/* INNOVATIVE CTA BUTTON */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-6"
          >
            <Link to="/dashboard" className="relative inline-block group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <button className="relative px-10 py-5 bg-black border border-white/20 rounded-2xl font-bold flex items-center gap-4 transition-all hover:border-transparent text-lg tracking-tight">
                <Rocket className="w-6 h-6 text-cyan-400 group-hover:rotate-12 transition-transform" />
                INITIATE ASCENSION
                <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* RIGHT SIDE: THE "OS CORE" (LOTTIE) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="w-full lg:w-1/2 flex justify-center lg:justify-end order-1 lg:order-2 mt-10 lg:mt-0 relative"
        >
          {/* Reactive Glow behind Lottie */}
          <div className="absolute inset-0 bg-blue-500/10 blur-[150px] rounded-full animate-pulse" />
          
          <div className="w-80 h-80 md:w-[550px] md:h-[550px] lg:w-[650px] lg:h-[650px] drop-shadow-[0_0_80px_rgba(34,211,238,0.2)]">
            <DotLottieReact
              src="https://lottie.host/54c8632d-1074-49e3-a7b8-e60fc6d07d9c/uOpuYNoYvt.lottie"
              loop
              autoplay
            />
          </div>

          {/* Floating Feature Tags around Lottie (Responsive Hidden on Mobile) */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="hidden xl:flex absolute top-20 right-10 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl gap-3 items-center"
          >
            <Zap className="text-yellow-400" />
            <div className="text-xs font-bold uppercase tracking-tighter">Peak Focus: 98%</div>
          </motion.div>
        </motion.div>
      </div>

      <footer className="absolute bottom-0 w-full py-8 bg-gradient-to-t from-black to-transparent border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-[10px] tracking-[0.5em] font-mono uppercase">
            Designed by Shreekant Yadav — System v4.0.0
          </p>
          <div className="flex gap-8 text-gray-500 text-xs font-mono">
            <span className="hover:text-cyan-400 cursor-pointer transition">SECURITY</span>
            <span className="hover:text-cyan-400 cursor-pointer transition">ARCHITECTURE</span>
            <span className="hover:text-cyan-400 cursor-pointer transition">NEURAL_LINK</span>
          </div>
        </div>
      </footer>
    </div>
  );
};