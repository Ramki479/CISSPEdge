import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeUserProgress } from '../data/database';
import type { PreparationLevel } from '../types';

const levels: { value: PreparationLevel; title: string; description: string; icon: string; color: string; features: string[] }[] = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'New to CISSP — start from fundamentals',
    icon: '🌱',
    color: 'from-emerald-500 to-teal-600',
    features: ['Foundational concepts', 'Easy questions to start', 'Basic study roadmap', 'Step-by-step guidance'],
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    description: 'Some CISSP knowledge — ready to level up',
    icon: '📈',
    color: 'from-blue-500 to-indigo-600',
    features: ['Mixed difficulty questions', 'Scenario-based challenges', 'Targeted weak area focus', 'Exam readiness tracking'],
  },
  {
    value: 'expert',
    title: 'Expert',
    description: 'Advanced preparation — near exam-ready',
    icon: '🏆',
    color: 'from-purple-500 to-pink-600',
    features: ['Advanced scenario questions', 'Full exam simulations', 'Performance analytics', 'Final readiness assessment'],
  },
];

export function Onboarding() {
  const [selected, setSelected] = useState<PreparationLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    console.log('Selected Level:', selected);
    console.log('Begin Journey Clicked');

    if (!selected) {
      alert('Please select a learning level to continue.');
      return;
    }

    setLoading(true);
    try {
      await initializeUserProgress(selected);
      const levelPaths: Record<string, string> = {
        beginner: '/learning-path/beginner',
        intermediate: '/learning-path/intermediate',
        expert: '/learning-path/expert',
      };
      navigate(levelPaths[selected]);
    } catch (err) {
      console.error('Failed to initialize:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
            CISSP Preparation Coach
          </h1>
          <p className="text-text-muted text-lg">
            Your personalized offline guide to CISSP certification success
          </p>
        </div>

        {/* Level Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {levels.map(level => (
            <button
              key={level.value}
              onClick={() => setSelected(level.value)}
              className={`relative text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                selected === level.value
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                  : 'border-border bg-surface-card hover:border-border-hover hover:bg-surface-hover/50'
              }`}
            >
              <div className="text-3xl mb-3">{level.icon}</div>
              <h3 className="text-lg font-bold text-text-primary mb-1">{level.title}</h3>
              <p className="text-sm text-text-muted mb-4">{level.description}</p>
              <ul className="space-y-1.5">
                {level.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="text-indigo-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={loading}
            className={`px-10 py-3.5 rounded-xl font-semibold text-base transition-all active:scale-95 ${
              selected && !loading
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30 cursor-pointer'
                : 'bg-surface-alt text-text-muted hover:bg-surface-hover hover:text-text-secondary cursor-pointer'
            }`}
          >
            {loading ? 'Setting up...' : selected ? 'Begin Your Journey →' : 'Select Your Level'}
          </button>
        </div>
      </div>
    </div>
  );
}
