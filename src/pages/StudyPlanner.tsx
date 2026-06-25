import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyPlannerSkeleton } from '../components/ui/SkeletonCard';
import { ErrorState } from '../components/ui/ErrorState';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data';
import type { StudyPlan, DailyGoal } from '../types';

/* ─── Easing ─────────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const itemSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   STUDY PLANNER
   ═══════════════════════════════════════════════════════════════════════════ */
export function StudyPlanner() {

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [dailyHours, setDailyHours] = useState(2);
  const [customTask, setCustomTask] = useState('');
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  useEffect(() => { loadPlan(); }, []);

  const loadPlan = async () => {
    try {
      const plans = await db.studyPlans.toArray();
      if (plans.length > 0) setPlan(plans[0]);
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async () => {
    if (!targetDate) return;
    const newPlan: StudyPlan = {
      id: uuidv4(), title: 'CISSP Exam Preparation',
      targetDate: new Date(targetDate).getTime(),
      dailyGoals: [], weeklyPlans: [], createdAt: Date.now(),
    };
    await db.studyPlans.add(newPlan);
    setPlan(newPlan);
    setShowSetup(false);
  };

  const addDailyGoal = async () => {
    if (!plan) return;
    setShowGoalEditor(true);
  };

  const saveDailyGoal = async () => {
    if (!plan || !customTask.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    const newGoal: DailyGoal = { date: today, tasks: [customTask.trim(), 'Review weak areas', 'Practice 20 questions'], completed: false, hoursPlanned: dailyHours };
    const updated = { ...plan, dailyGoals: [...plan.dailyGoals, newGoal] };
    await db.studyPlans.update(plan.id, { dailyGoals: updated.dailyGoals });
    setPlan(updated);
    setShowGoalEditor(false);
    setCustomTask('');
  };

  const deleteGoal = async (index: number) => {
    if (!plan) return;
    const updated = { ...plan, dailyGoals: plan.dailyGoals.filter((_, i) => i !== index) };
    await db.studyPlans.update(plan.id, { dailyGoals: updated.dailyGoals });
    setPlan(updated);
  };

  const toggleGoalCompletion = async (index: number) => {
    if (!plan) return;
    const updated = { ...plan, dailyGoals: plan.dailyGoals.map((g, i) => i === index ? { ...g, completed: !g.completed } : g) };
    await db.studyPlans.update(plan.id, { dailyGoals: updated.dailyGoals });
    setPlan(updated);
  };

  const updateGoalTask = async (goalIndex: number, taskIndex: number, value: string) => {
    if (!plan) return;
    const updated = { ...plan, dailyGoals: plan.dailyGoals.map((g, i) => i === goalIndex ? { ...g, tasks: g.tasks.map((t, j) => j === taskIndex ? value : t) } : g) };
    await db.studyPlans.update(plan.id, { dailyGoals: updated.dailyGoals });
    setPlan(updated);
  };

  const deletePlan = async () => {
    if (plan) { await db.studyPlans.delete(plan.id); setPlan(null); }
  };

  const countdownDays = plan ? Math.max(0, Math.ceil((plan.targetDate - Date.now()) / (86400000))) : 0;

  if (loading) return <StudyPlannerSkeleton />;
  if (loadError) return <ErrorState message={loadError.message} onRetry={loadPlan} />;

  return (
    <div className="max-w-4xl mx-auto pb-8 relative">
      {/* Cyber-grid background */}
<div className="relative z-10">
        <motion.div
          className="space-y-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ═══ HUD HEADER ═══ */}
          <motion.div variants={itemSlide} className="relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 opacity-[0.06] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffb800] to-transparent rounded-full blur-3xl animate-float-delayed" />
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 relative">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffb800] to-[#ff6b00] rounded-xl opacity-20 blur-md animate-breathe" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffb800] to-[#ff6b00] rounded-xl opacity-40 flex items-center justify-center">
                    <span className="text-sm font-bold text-white font-mono">⊞</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold tw-text-primary tracking-tight">Study Planner</h1>
                  <p className="text-[11px] text-white/70 mt-0.5 font-mono tracking-wide">
                    <span className="text-[#ffb800]">$</span> plan <span className="text-white/70">--status</span> <span className={countdownDays > 0 ? 'text-[#00f2fe]' : 'text-white/70'}>
                      {plan ? `${countdownDays}d remaining` : 'inactive'}
                    </span>
                  </p>
                </div>
              </div>
              {plan ? (
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,107,107,0.3)' }}
                  whileTap={SPRING_TAP}
                  onClick={deletePlan}
                  className="px-3 py-1.5 bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/30 rounded-lg text-[10px] font-mono hover:bg-[#ff6b6b]/20 transition-all"
                >
                  Reset Plan
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0,242,254,0.1)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => setShowSetup(true)}
                  className="relative group px-4 py-2.5 rounded-xl text-xs font-mono font-medium overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-white flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Plan
                  </span>
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* ═══ NO PLAN STATE ═══ */}
          {!plan && !showSetup && (
            <motion.div variants={itemSlide}>
              <div className="tw-card p-12 text-center">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffb800] to-[#ff6b00] rounded-full opacity-20 blur-md animate-breathe" />
                  <span className="relative text-3xl block text-center text-white/70">⊞</span>
                </div>
                <h2 className="text-lg font-semibold tw-text-primary mb-2 font-mono tracking-wide">No Study Plan Yet</h2>
                <p className="text-white/70 text-sm mb-6 font-mono">Create a personalized plan for your CISSP exam.</p>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0,242,254,0.1)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => setShowSetup(true)}
                  className="relative group px-6 py-2.5 rounded-xl text-xs font-mono font-medium overflow-hidden inline-block"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-white">▸ Create Plan</span>
                </motion.button>
              </div>
            </motion.div>
          )}

      {/* ═══ SETUP MODAL ═══ */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="tw-card p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-5 bg-[#ffb800] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">Set Target Date</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Target Exam Date</label>
                  <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Daily Study Hours</label>
                  <input type="number" min={0.5} max={12} step={0.5} value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1e2840]/80">
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(0,242,254,0.2)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => setShowSetup(false)}
                  className="px-4 py-2.5 bg-[#080b14] text-[#8892a9] border border-[#1e2840]/80 rounded-lg text-xs font-mono hover:text-white transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 12px rgba(0,242,254,0.1)' }}
                  whileTap={SPRING_TAP}
                  onClick={createPlan}
                  className="relative group px-5 py-2.5 rounded-lg text-xs font-mono font-medium overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-white flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ GOAL EDITOR MODAL ═══ */}
      <AnimatePresence>
        {showGoalEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="tw-card p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-5 bg-[#00f2fe] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">Add Daily Goal</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Main Task</label>
                  <input value={customTask} onChange={e => setCustomTask(e.target.value)}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors" placeholder="e.g., Review Domain 3 flashcards" />
                </div>
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Planned Hours</label>
                  <input type="number" min={0.5} max={12} step={0.5} value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1e2840]/80">
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(0,242,254,0.2)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => { setShowGoalEditor(false); setCustomTask(''); }}
                  className="px-4 py-2.5 bg-[#080b14] text-[#8892a9] border border-[#1e2840]/80 rounded-lg text-xs font-mono hover:text-white transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 12px rgba(0,242,254,0.1)' }}
                  whileTap={SPRING_TAP}
                  onClick={saveDailyGoal}
                  className="relative group px-5 py-2.5 rounded-lg text-xs font-mono font-medium overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-white flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Add Goal
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* ═══ ACTIVE PLAN ═══ */}
          {plan && (
            <>
              {/* Countdown hero */}
              <motion.div variants={itemSlide}>
                <motion.div
                  whileHover={{ borderColor: 'rgba(0,242,254,0.2)' }}
                  className="bg-gradient-to-r from-[#00f2fe]/5 to-[#ff007f]/5 rounded-xl border border-[#00f2fe]/10 p-6 lg:p-8 text-center relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#ff007f] opacity-30" />

                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                      className="text-5xl lg:text-6xl font-bold font-mono tabular-nums text-white mb-2 relative inline-block"
                    >
                      {countdownDays}
                      <div className="absolute -top-2 -right-4 w-3 h-3 rounded-full bg-[#00f2fe] opacity-40 animate-pulse" />
                    </motion.div>
                    <p className="text-white/70 text-[10px] font-mono uppercase tracking-wider mb-3">Days Until Exam</p>
                    <p className="text-sm text-[#00f2fe] font-mono">
                      {new Date(plan.targetDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Two-column: Goals + Focus */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Today's Goals */}
                <motion.div variants={itemSlide}>
                  <div className="bg-[#0d1222]/90 backdrop-blur-sm rounded-xl border border-[#1e2840]/80 p-5 relative overflow-hidden h-full"
                    whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-30" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#00f2fe] rounded-full" />
                        <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Today's Goals</h2>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 8px rgba(0,242,254,0.08)' }}
                        whileTap={SPRING_TAP}
                        onClick={addDailyGoal}
                        className="relative group px-3 py-1.5 rounded-lg text-[10px] font-mono overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-80 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 text-white flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </span>
                      </motion.button>
                    </div>
                    {plan.dailyGoals.length === 0 ? (
                      <p className="text-white/70 text-xs font-mono">No goals set. Click <span className="text-[#00f2fe]">+Add</span> to create today's plan.</p>
                    ) : (
                      <ul className="space-y-2">
                        {plan.dailyGoals.slice(-8).reverse().map((goal, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-3 bg-[#080b14] rounded-lg border transition-all ${
                              goal.completed ? 'border-[#10b981]/40 bg-[#080b14]' : 'border-[#1e2840]/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => toggleGoalCompletion(plan.dailyGoals.length - 1 - i)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                    goal.completed ? 'bg-[#10b981] border-[#10b981]' : 'border-[#1e2840] hover:border-[#00f2fe]'
                                  }`}
                                >
                                  {goal.completed && <span className="text-white text-[9px]">✓</span>}
                                </motion.button>
                                <span className={`text-[10px] font-mono ${goal.completed ? 'text-white/70 line-through' : 'text-white/70'}`}>{goal.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/70 font-mono">{goal.hoursPlanned}h</span>
                                <motion.button
                                  whileHover={{ scale: 1.1, color: '#ff6b6b' }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => deleteGoal(plan.dailyGoals.length - 1 - i)}
                                  className="text-white/70 hover:text-[#ff6b6b] text-[10px] transition-colors"
                                >
                                  ✕
                                </motion.button>
                              </div>
                            </div>
                            <ul className="space-y-1">
                              {goal.tasks.slice(0, 4).map((task, j) => (
                                <li key={j} className="flex items-center gap-1.5">
                                  <span className={`text-[10px] ${goal.completed ? 'text-[#10b981]' : 'text-[#00f2fe]'}`}>▸</span>
                                  <input
                                    value={task}
                                    onChange={e => updateGoalTask(plan.dailyGoals.length - 1 - i, j, e.target.value)}
                                    className={`flex-1 bg-transparent text-xs border-none outline-none focus:text-white transition-colors ${
                                      goal.completed ? 'text-white/70 line-through' : 'text-[#8892a9]'
                                    }`}
                                  />
                                </li>
                              ))}
                            </ul>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>

                {/* Weekly Focus */}
                <motion.div variants={itemSlide}>
                  <div className="bg-[#0d1222]/90 backdrop-blur-sm rounded-xl border border-[#1e2840]/80 p-5 relative overflow-hidden h-full"
                    whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ffb800] to-[#ff6b00] opacity-30" />
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1 h-4 bg-[#ffb800] rounded-full" />
                      <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Weekly Focus</h2>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-[#ff6b6b]/10 border border-[#ff6b6b]/20">
                        <p className="text-xs font-medium text-[#ff6b6b] font-mono flex items-center gap-1.5">
                          <span>⚠</span> Critical Areas
                        </p>
                        <p className="text-[10px] text-white/70 font-mono mt-0.5">Focus on weakest domains first</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#ffb800]/10 border border-[#ffb800]/20">
                        <p className="text-xs font-medium text-[#ffb800] font-mono flex items-center gap-1.5">
                          <span>◈</span> Daily Practice
                        </p>
                        <p className="text-[10px] text-white/70 font-mono mt-0.5">Complete at least 20 questions daily</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/20">
                        <p className="text-xs font-medium text-[#00f2fe] font-mono flex items-center gap-1.5">
                          <span>◆</span> Spaced Repetition
                        </p>
                        <p className="text-[10px] text-white/70 font-mono mt-0.5">Revisit weak topics every 3 days</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Weekly Schedule */}
              <motion.div variants={itemSlide}>
                <div className="bg-[#0d1222]/90 backdrop-blur-sm rounded-xl border border-[#1e2840]/80 p-5 relative overflow-hidden"
                  whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#ff007f] opacity-20" />
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-4 bg-[#00f2fe] rounded-full" />
                    <h2 className="text-sm font-semibold text-white font-mono tracking-wide">Weekly Schedule</h2>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="p-3 bg-[#080b14] rounded-lg text-center border border-[#1e2840]/60"
                      >
                        <p className="text-[10px] text-white/70 font-mono mb-1 tracking-wide">{day}</p>
                        <p className="text-[11px] text-white font-mono tabular-nums font-semibold">{i < 5 ? `${dailyHours}h` : `${(dailyHours * 0.5)}h`}</p>
                        <div className="mt-2 w-full h-1.5 bg-[#1e2840] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${i < 5 ? 100 : 50}%` }}
                            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.1 + i * 0.04 }}
                            className="h-full bg-gradient-to-r from-[#00f2fe] to-[#ff007f] rounded-full"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default StudyPlanner;
