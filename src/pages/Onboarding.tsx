import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { initializeUserProgress, seedTestDataIfNeeded } from '../data/database';
import type { PreparationLevel } from '../types';

const levels: { value: PreparationLevel; title: string; description: string; icon: string; features: string[] }[] = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'Start from fundamentals',
    icon: '◉',
    features: ['Foundational concepts', 'Easy questions', 'Basic study roadmap', 'Step-by-step guidance'],
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    description: 'Ready to level up',
    icon: '◈',
    features: ['Mixed difficulty questions', 'Scenario challenges', 'Weak area focus', 'Exam readiness tracking'],
  },
  {
    value: 'expert',
    title: 'Expert',
    description: 'Near exam-ready',
    icon: '◆',
    features: ['Advanced scenarios', 'Full exam simulations', 'Performance analytics', 'Final assessment'],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function Onboarding() {

  const [selected, setSelected] = useState<PreparationLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!selected) { alert('Please select a learning level to continue.'); return; }
    setLoading(true);
    try {
      await initializeUserProgress(selected);
      // Seed mock data in background so dashboard has content immediately
      seedTestDataIfNeeded().catch(() => {});
      const levelPaths: Record<string, string> = {
        beginner: '/learning-path/beginner',
        intermediate: '/learning-path/intermediate',
        expert: '/learning-path/expert',
      };
      navigate(levelPaths[selected]);
    } catch {
      // Initialization failed — user can retry by clicking again
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen tw-bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/[0.02] to-[#ff00e4]/[0.02]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00f0ff]/[0.015] rounded-full blur-3xl" />

      <motion.div className="max-w-4xl w-full relative" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-xl opacity-20 blur-md" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-xl opacity-40 flex items-center justify-center">
              <span className="text-2xl font-bold text-white font-mono">#</span>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tw-text-primary tracking-tight mb-2 font-mono">
            CISSP Edge
          </h1>
          <p className="text-sm tw-text-secondary font-mono">
            Your offline-first CISSP preparation system
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {levels.map(level => (
            <motion.button
              key={level.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(level.value)}
              className={`relative text-left p-5 rounded-xl border transition-all ${
                selected === level.value
                  ? 'border-[#00f0ff]/50 bg-[#00f0ff]/5'
                  : 'border-[#1e2840] bg-[#0d1222] hover:border-[#2a3654]'
              }`}
            >
              <div className={`text-2xl mb-2 ${selected === level.value ? 'text-[#00f0ff]' : 'text-white/70'}`}>{level.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1 font-mono">{level.title}</h3>
              <p className="text-[10px] text-white/70 font-mono mb-3">{level.description}</p>
              <ul className="space-y-1">
                {level.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[10px] text-[#8892a9] font-mono">
                    <span className="text-[#00f0ff]">▸</span> {f}
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="text-center">
          <motion.button
            whileHover={{ scale: selected && !loading ? 1.02 : 1 }}
            whileTap={{ scale: selected && !loading ? 0.98 : 1 }}
            onClick={handleStart}
            disabled={loading}
            className={`px-8 py-3 rounded-lg font-mono text-sm transition-all ${
              selected && !loading
                ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20'
                : 'bg-[#0d1222] text-white/70 border border-[#1e2840]'
            }`}
          >
            {loading ? 'initializing...' : selected ? '▸ Begin' : 'select a level'}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Onboarding;
