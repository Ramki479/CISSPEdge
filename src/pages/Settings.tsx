import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUserProgress, updateUserProgress, db } from '../data/database';
import { useTheme } from '../components/ThemeProvider';
import type { PreparationLevel, UserProgress } from '../types';

export function Settings() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await getUserProgress();
    setProgress(p);
  };

  const changeLevel = async (level: PreparationLevel) => {
    await updateUserProgress({ level });
    setProgress(prev => prev ? { ...prev, level } : prev);
  };

  const resetAllData = async () => {
    await db.progress.clear();
    await db.testSessions.clear();
    await db.flashcards.clear();
    await db.notes.clear();
    await db.studyPlans.clear();
    await db.dailyChallenges.clear();
    navigate('/onboarding');
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Settings</h1>

      {/* Profile */}
      <div className="bg-surface-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-text-primary mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted">Preparation Level</p>
            <div className="flex gap-2 mt-2">
              {(['beginner', 'intermediate', 'expert'] as PreparationLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => changeLevel(level)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    progress?.level === level
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-surface-alt text-text-muted border border-border-hover hover:border-border-hover'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-muted">Total XP</p>
              <p className="text-xl font-bold text-text-primary">{progress?.totalXp || 0}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Study Streak</p>
              <p className="text-xl font-bold text-text-primary">{progress?.streak || 0} days</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Badges Earned</p>
              <p className="text-xl font-bold text-text-primary">{progress?.badges.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Started On</p>
              <p className="text-xl font-bold text-text-primary text-sm">{formatDate(progress?.onboardingDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-surface-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-text-primary mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-primary">Theme</p>
            <p className="text-sm text-text-muted">Switch between dark and light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-surface-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-text-primary mb-4">Data Management</h2>
        <p className="text-sm text-text-muted mb-4">
          All your data is stored locally on this device. No data is sent to any server.
        </p>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/20 transition-all"
          >
            Reset All Data
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-red-400 font-medium">
              This will permanently delete all your progress, test history, notes, and flashcards. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="px-5 py-2.5 bg-surface-alt text-text-secondary rounded-xl text-sm hover:bg-surface-hover transition-all"
              >
                Cancel
              </button>
              <button
                onClick={resetAllData}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm transition-all"
              >
                Yes, Reset Everything
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* About */}
      <div className="bg-surface-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-text-primary mb-4">About</h2>
        <div className="space-y-2 text-sm text-text-muted">
          <p>CISSP Coach v1.0</p>
          <p>Offline CISSP Preparation Platform</p>
          <p>Built with React + TypeScript + Tailwind CSS</p>
          <p className="text-xs text-gray-500 mt-3">
            All data stored locally using IndexedDB. This app works completely offline.
          </p>
        </div>
      </div>
    </div>
  );
}
