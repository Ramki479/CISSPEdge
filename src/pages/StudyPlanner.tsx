import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/database';
import type { StudyPlan, DailyGoal } from '../types';

export function StudyPlanner() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [dailyHours, setDailyHours] = useState(2);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    const plans = await db.studyPlans.toArray();
    if (plans.length > 0) setPlan(plans[0]);
  };

  const createPlan = async () => {
    if (!targetDate) return;
    const newPlan: StudyPlan = {
      id: uuidv4(),
      title: 'CISSP Exam Preparation',
      targetDate: new Date(targetDate).getTime(),
      dailyGoals: [],
      weeklyPlans: [],
      createdAt: Date.now(),
    };
    await db.studyPlans.add(newPlan);
    setPlan(newPlan);
    setShowSetup(false);
  };

  const addDailyGoal = async () => {
    if (!plan) return;
    const today = new Date().toISOString().split('T')[0];
    const newGoal: DailyGoal = {
      date: today,
      tasks: ['Review weak areas', 'Practice 20 questions', 'Study flashcards'],
      completed: false,
      hoursPlanned: dailyHours,
    };
    const updated = {
      ...plan,
      dailyGoals: [...plan.dailyGoals, newGoal],
    };
    await db.studyPlans.update(plan.id, { dailyGoals: updated.dailyGoals });
    setPlan(updated);
  };

  const deletePlan = async () => {
    if (plan) {
      await db.studyPlans.delete(plan.id);
      setPlan(null);
    }
  };

  const countdownDays = plan
    ? Math.max(0, Math.ceil((plan.targetDate - Date.now()) / (86400000)))
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Study Planner</h1>
        {plan ? (
          <button
            onClick={deletePlan}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/20 transition-all"
          >
            Reset Plan
          </button>
        ) : (
          <button
            onClick={() => setShowSetup(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
          >
            Create Plan
          </button>
        )}
      </div>

      {!plan && !showSetup && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">No Study Plan Yet</h2>
          <p className="text-text-muted mb-6">Create a personalized study plan to prepare for your CISSP exam.</p>
          <button
            onClick={() => setShowSetup(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
          >
            Create Study Plan
          </button>
        </div>
      )}

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card rounded-2xl border border-border p-6 w-full max-w-md"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Set Your Exam Date</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Target Exam Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Daily Study Hours</label>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={dailyHours}
                  onChange={e => setDailyHours(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSetup(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createPlan}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
              >
                Create Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {plan && (
        <>
          {/* Countdown */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-6 text-center">
            <div className="text-5xl font-bold text-white mb-2">{countdownDays}</div>
            <p className="text-gray-400">Days Until Exam</p>
            <p className="text-sm text-indigo-400 mt-2">
              Target: {new Date(plan.targetDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Goals */}
            <div className="bg-surface-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text-primary">Today's Goals</h2>
                <button
                  onClick={addDailyGoal}
                  className="text-sm px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-all"
                >
                  + Add
                </button>
              </div>
              {plan.dailyGoals.length === 0 ? (
                <p className="text-text-muted text-sm">No daily goals set. Click +Add to create today's study plan.</p>
              ) : (
                <ul className="space-y-3">
                  {plan.dailyGoals.slice(-5).reverse().map((goal, i) => (
                    <li key={i} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{goal.date}</span>
                        <span className="text-xs text-gray-500">{goal.hoursPlanned}h planned</span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {goal.tasks.slice(0, 3).map((task, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm text-text-secondary">
                            <span className="text-indigo-400">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Weekly Focus */}
            <div className="bg-surface-card rounded-xl border border-border p-5">
              <h2 className="font-semibold text-text-primary mb-4">Recommended Weekly Focus</h2>
              <div className="space-y-3">
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm font-medium text-red-400">Priority: Critical Areas</p>
                  <p className="text-xs text-text-muted mt-1">Focus on weakest domains first</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-400">Consistency: Daily Practice</p>
                  <p className="text-xs text-gray-400 mt-1">Complete at least 20 questions daily</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-400">Review: Spaced Repetition</p>
                  <p className="text-xs text-gray-400 mt-1">Revisit weak topics every 3 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="font-semibold text-white mb-4">Suggested Study Schedule</h2>
            <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="p-3 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-xs text-gray-400 mb-1">{day}</p>
                  <p className="text-xs text-gray-500">
                    {i < 5 ? `${dailyHours}h` : `${(dailyHours * 0.5)}h`}
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1.5 bg-gray-700 rounded-full">
                      <div
                        className="h-1.5 bg-indigo-500 rounded-full"
                        style={{ width: `${i < 5 ? 100 : 50}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
