import { motion } from "framer-motion";
import {
  UserPlus,
  ListTodo,
  CheckCircle2,
  BarChart3,
  Sparkles,
  Rocket,
  Flame
} from "lucide-react";

export const Whattodo = () => {
  const steps = [
    {
      icon: <UserPlus size={28} />,
      title: "1. Set Your Goal",
      desc: "Choose your target role and define your daily available learning hours to initialize your growth journey.",
    },
    {
      icon: <ListTodo size={28} />,
      title: "2. Create Daily Tasks",
      desc: "Add structured tasks with difficulty level, estimated hours, and planned date for smart productivity tracking.",
    },
    {
      icon: <CheckCircle2 size={28} />,
      title: "3. Complete & Earn XP",
      desc: "Mark tasks as completed to gain XP, level up, and maintain your daily streak consistency.",
    },
    {
      icon: <BarChart3 size={28} />,
      title: "4. Track Analytics",
      desc: "Visualize your day-wise productivity, XP growth, and task performance through dynamic charts.",
    },
    {
      icon: <Sparkles size={28} />,
      title: "5. Generate AI Roadmap",
      desc: "Let AI create a personalized 7-day plan based on your progress, weaknesses, and available time.",
    },
    {
      icon: <Rocket size={28} />,
      title: "6. Level Up Continuously",
      desc: "Use gamification — XP, streaks, levels — to continuously improve and stay motivated.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-6 py-16">

      {/* HEADER */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Your Growth Blueprint
        </h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          Follow these intelligent steps to transform your daily efforts into measurable growth.
        </p>
      </div>

      {/* STEPS GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">

        {steps.map((step, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.04 }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative overflow-hidden group"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition duration-500 blur-2xl"></div>

            <div className="relative z-10">

              <div className="text-cyan-400 mb-6">
                {step.icon}
              </div>

              <h3 className="text-xl font-semibold mb-4">
                {step.title}
              </h3>

              <p className="text-gray-400 leading-relaxed text-sm">
                {step.desc}
              </p>

            </div>
          </motion.div>
        ))}

      </div>

      {/* MOTIVATION SECTION */}
      <div className="mt-24 text-center">
        <div className="flex justify-center items-center gap-3 text-orange-400 text-lg font-semibold">
          <Flame />
          Stay Consistent. Build Momentum.
        </div>
        <p className="text-gray-500 mt-2">
          Small disciplined actions compound into massive success.
        </p>
      </div>

    </div>
  );
};