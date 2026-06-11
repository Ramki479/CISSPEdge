import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUserProgress } from '../data/database';
import type { PreparationLevel, UserProgress } from '../types';

const levelDetails: Record<PreparationLevel, {
  title: string;
  emoji: string;
  gradient: string;
  description: string;
  milestones: string[];
}> = {
  beginner: {
    title: 'Beginner Learning Path',
    emoji: '🌱',
    gradient: 'from-emerald-500 to-teal-600',
    description: 'Start from the ground up. Build a strong foundation in CISSP concepts with step-by-step guidance.',
    milestones: [
      'Understand core security concepts',
      'Master the 8 CISSP domains',
      'Complete foundational practice questions',
      'Build a consistent study habit',
    ],
  },
  intermediate: {
    title: 'Intermediate Learning Path',
    emoji: '📈',
    gradient: 'from-blue-500 to-indigo-600',
    description: 'Level up your knowledge with mixed difficulty challenges and scenario-based learning.',
    milestones: [
      'Tackle scenario-based questions',
      'Identify and strengthen weak areas',
      'Practice with mixed-difficulty exams',
      'Track readiness and improve scores',
    ],
  },
  expert: {
    title: 'Expert Learning Path',
    emoji: '🏆',
    gradient: 'from-purple-500 to-pink-600',
    description: 'Near exam-ready. Simulate the real CISSP exam and fine-tune your performance.',
    milestones: [
      'Complete full exam simulations',
      'Achieve consistent 80%+ scores',
      'Master advanced scenario questions',
      'Final readiness assessment',
    ],
  },
};

export function LearningPath() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const details = levelDetails[level as PreparationLevel];

  useEffect(() => {
    if (!details) {
      navigate('/dashboard', { replace: true });
      return;
    }
    getUserProgress()
      .then(p => setProgress(p))
      .catch(() => console.warn('Failed to load user progress'));
  }, [level]);

  if (!details) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero banner */}
      <div className={`bg-gradient-to-br ${details.gradient} px-6 py-12 lg:py-16`}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <span className="text-4xl">{details.emoji}</span>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                {details.title}
              </h1>
              <p className="text-white/80 mt-1">{details.description}</p>
            </div>
          </motion.div>

          {/* Quick stats */}
          {progress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 mt-4"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                <span>⭐</span>
                <span className="text-white font-semibold">{progress.totalXp} XP</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                <span>🔥</span>
                <span className="text-white font-semibold">{progress.streak} day streak</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-text-primary mb-4">Your Milestones</h2>
          <div className="space-y-3">
            {details.milestones.map((milestone, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-surface-card border border-border rounded-xl p-4"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {i + 1}
                </div>
                <span className="text-text-secondary">{milestone}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="p-5 bg-surface-card border border-border rounded-xl text-left hover:border-border-hover transition-all"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold text-text-primary">Go to Dashboard</div>
            <div className="text-sm text-text-muted mt-1">Track your progress and continue learning</div>
          </button>
          <button
            onClick={() => navigate('/test')}
            className="p-5 bg-surface-card border border-border rounded-xl text-left hover:border-border-hover transition-all"
          >
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-semibold text-text-primary">Start Practicing</div>
            <div className="text-sm text-text-muted mt-1">Take questions and test your knowledge</div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
