import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardSkeleton } from '../components/ui/SkeletonCard';
import { ErrorState } from '../components/ui/ErrorState';
import { getUserProgress, fetchDomainAnalytics, updateUserProgress, db } from '../data/database';
import { calculateReadinessScore, calculateConfidenceScore, estimatePassProbability, recommendExamDate } from '../utils/adaptiveTesting';
import { generateRecommendations } from '../utils/recommendations';
import { domains } from '../data/questionBank';
import type { UserProgress, LearningRecommendation } from '../types';

/* ─── Easing tokens ─────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } };

/* ─── Animation variants ─────────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const itemSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

const statCardVariant = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  visible: (i: number) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: EASE_OUT },
  }),
};

/* ─── Performance helper ──────────────────────────────────────────────────── */
function getPerformanceLabel(accuracy: number) {
  if (accuracy < 70) return { label: 'Needs Work', icon: '⚠', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/10' };
  if (accuracy < 80) return { label: 'Improving', icon: '◈', color: 'text-[#ffb800]', bg: 'bg-[#ffb800]/10' };
  return { label: 'Strong', icon: '◆', color: 'text-[#00f2fe]', bg: 'bg-[#00f2fe]/10' };
}

function getReadinessColor(score: number) {
  if (score >= 80) return '#00f2fe';
  if (score >= 60) return '#ffb800';
  if (score >= 40) return '#ff6b6b';
  return '#ff007f';
}

function getReadinessGradient(score: number) {
  if (score >= 80) return 'from-[#00f2fe] to-[#4facfe]';
  if (score >= 60) return 'from-[#ffb800] to-[#ff6b00]';
  if (score >= 40) return 'from-[#ff6b6b] to-[#ff007f]';
  return 'from-[#ff007f] to-[#ff0066]';
}

function getDomainConcepts(domainId: number): string[] {
  const map: Record<number, string[]> = {
    1: ['Risk assessment', 'Governance', 'Compliance', 'BCP', 'Policy dev'],
    2: ['Data classification', 'Asset mgmt', 'Privacy', 'Retention', 'Ownership'],
    3: ['Architecture models', 'Cryptography', 'Physical security', 'Design principles'],
    4: ['Network segmentation', 'Secure protocols', 'IDS/IPS', 'Wireless', 'Monitoring'],
    5: ['Access control', 'Authentication', 'Federation', 'PAM', 'MFA'],
    6: ['Vulnerability assess', 'Pen testing', 'Security audit', 'SIEM', 'Log analysis'],
    7: ['Incident response', 'DR planning', 'Forensics', 'BC', 'Evidence'],
    8: ['Secure SDLC', 'OWASP Top 10', 'Code review', 'DevSecOps'],
  };
  return map[domainId] || [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
export function Dashboard() {

  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [domainStats, setDomainStats] = useState<any[]>([]);
  const [testCount, setTestCount] = useState(0);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [readiness, setReadiness] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [passProb, setPassProb] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const p = await getUserProgress();
    setProgress(p);
    const analytics = await fetchDomainAnalytics();
    setDomainStats(analytics);
    setRecommendations(generateRecommendations(analytics));

    // Fetch total test sessions count
    const sessionCount = await db.testSessions.count();
    setTestCount(sessionCount);

    const r = calculateReadinessScore(analytics.map(a => ({ accuracy: a.accuracy, questionsAttempted: a.questionsAttempted })));
    setReadiness(r);

    const totalCorrect = analytics.reduce((s, a) => s + a.correctAnswers, 0);
    const totalQ = analytics.reduce((s, a) => s + a.questionsAttempted, 0);
    const totalTime = analytics.reduce((s, a) => s + a.totalTimeSpent, 0);
    const avgTime = totalQ > 0 ? totalTime / totalQ : 0;
    const c = calculateConfidenceScore(totalCorrect, totalQ, avgTime);
    setConfidence(c);

    setPassProb(estimatePassProbability(r, c));
    setExamDate(recommendExamDate(r));

    if (p) {
      const today = new Date().toISOString().split('T')[0];
      if (p.lastActiveDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = p.lastActiveDate === yesterday ? p.streak + 1 : 1;
        await updateUserProgress({ streak: newStreak, lastActiveDate: today, totalXp: p.totalXp + 5 });
        setProgress(prev => prev ? { ...prev, streak: newStreak, lastActiveDate: today, totalXp: p.totalXp + 5 } : prev);
      }
    }
      setLoading(false);
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  };

  const sortedStats = [...domainStats].sort((a: any, b: any) => a.accuracy - b.accuracy);
  const topWeak = sortedStats.filter((d: any) => d.accuracy < 80).slice(0, 3);

  const totalAttempted = domainStats.reduce((s, d) => s + d.questionsAttempted, 0);
  const totalCorrect = domainStats.reduce((s, d) => s + d.correctAnswers, 0);
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const quickActions = [
    { label: 'Quick Practice', desc: '10 random questions', icon: '⚡', path: '/test?mode=quick-practice', gradient: 'from-[#00f2fe] to-[#4facfe]' },
    { label: 'Study Coach', desc: 'Weakness analysis', icon: '◈', path: '/study-coach', gradient: 'from-[#8b5cf6] to-[#a78bfa]' },
    { label: 'Weak Area Focus', desc: 'Target weaknesses', icon: '🎯', path: '/test?mode=weak-area', gradient: 'from-[#ff007f] to-[#ff0066]' },
    { label: 'Analytics', desc: 'Track progress', icon: '📊', path: '/analytics', gradient: 'from-[#00f2fe] to-[#ff007f]' },
  ];

  /* ─── Loading Shimmer ────────────────────────────────────────────────── */
  if (loading) return <DashboardSkeleton />;
  if (loadError) return <ErrorState message={loadError.message} onRetry={loadDashboard} />;

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto pb-8 relative">          {/* Cyber-grid background */}
      <div className="absolute inset-0 dark:[background-image:linear-gradient(rgba(0,242,254,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,254,0.03)_1px,transparent_1px)] dark:[background-size:32px_32px] pointer-events-none" />
      {/* Persistent cyber-grid background */}
      <motion.div
          className="space-y-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ═══ HUD HEADER ═══ */}
          <motion.div variants={itemSlide} className="relative overflow-hidden">
            {/* Decorative glow blobs */}
            <div className="absolute -top-12 -left-12 w-48 h-48 opacity-[0.08] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-transparent rounded-full blur-3xl animate-breathe" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-36 h-36 opacity-[0.06] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-transparent rounded-full blur-3xl animate-float-delayed" />
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative">
              <div>
                <div className="flex items-center gap-3">
                  {/* HUD-style logo badge */}
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#ff007f] rounded-xl opacity-20 blur-md animate-breathe" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#4facfe] rounded-xl opacity-40 flex items-center justify-center">
                      <span className="text-lg font-bold tw-text-primary font-mono">◉</span>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl lg:text-2xl font-bold tw-text-primary tracking-tight">
                      Dashboard
                    </h1>
                    <p className="text-[11px] tw-text-secondary mt-0.5 font-mono tracking-wide">
                      <span className="text-[#00f2fe]">$</span> status <span className="tw-text-secondary">--level</span> <span className="text-[#ffb800]">{progress?.level}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* HUD chips: streak + XP */}
              <div className="flex items-center gap-2.5">
                <motion.div
                  whileHover={{ scale: 1.05, borderColor: 'rgba(255,184,0,0.4)' }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d1222]/90 backdrop-blur-sm border border-[#1e2840]/80 transition-all"
                >
                  <motion.span
                    className="text-lg text-[#ffb800]"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  >
                    ◈
                  </motion.span>
                  <span className="font-bold tw-text-primary font-mono tabular-nums text-lg">{progress?.streak || 0}</span>
                  <span className="tw-text-secondary text-[10px] font-mono">day streak</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, borderColor: 'rgba(0,242,254,0.4)' }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d1222]/90 backdrop-blur-sm border border-[#1e2840]/80 transition-all"
                >
                  <span className="text-lg text-[#00f2fe]">◆</span>
                  <span className="font-bold tw-text-primary font-mono tabular-nums text-lg">{progress?.totalXp || 0}</span>
                  <span className="tw-text-secondary text-[10px] font-mono">XP</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* ═══ STAT CARDS with animated rings ═══ */}
          <motion.div variants={itemSlide} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Readiness', value: readiness, color: getReadinessColor(readiness), gradient: getReadinessGradient(readiness) },
              { label: 'Tests', value: testCount, color: '#00f2fe', gradient: 'from-[#00f2fe] to-[#4facfe]' },
              { label: 'Pass Prob.', value: passProb, suffix: '%', color: passProb >= 70 ? '#00f2fe' : passProb >= 50 ? '#ffb800' : '#ff6b6b', gradient: passProb >= 70 ? 'from-[#00f2fe] to-[#4facfe]' : 'from-[#ffb800] to-[#ff6b00]' },
              { label: 'Questions', value: totalAttempted, sub: `${totalCorrect} correct`, color: '#ffffff', gradient: 'from-[#00f2fe] to-[#ff007f]' },
              { label: 'Accuracy', value: accuracy, suffix: '%', color: accuracy >= 70 ? '#10b981' : accuracy >= 40 ? '#ffb800' : '#ff6b6b', gradient: accuracy >= 70 ? 'from-[#10b981] to-[#34d399]' : accuracy >= 40 ? 'from-[#ffb800] to-[#ff6b00]' : 'from-[#ff6b6b] to-[#ff007f]' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={statCardVariant}
                whileHover={{ y: -4, borderColor: 'rgba(0,242,254,0.3)', transition: { duration: 0.2 } }}
                className="tw-card p-4 relative overflow-hidden group"
              >
                {/* Top gradient accent line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.gradient} opacity-50`} />

                {/* Hover glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Decorative ring glow */}
                {stat.label !== 'Questions' && (
                  <div
                    className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-[0.06] blur-xl"
                    style={{ backgroundColor: stat.color }}
                  />
                )}

                <div className="relative">
                  <p className="text-[10px] tw-text-secondary font-mono tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: stat.color }} />
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                      className="text-2xl font-bold font-mono tabular-nums"
                      style={{ color: stat.color }}
                    >
                      {stat.value}{stat.suffix || ''}
                    </motion.span>
                    {stat.label !== 'Questions' && (
                      <span className="text-[10px] tw-text-secondary font-mono">/100</span>
                    )}
                  </div>
                  {stat.sub && <p className="text-[11px] tw-text-secondary mt-1 font-mono">{stat.sub}</p>}

                  {/* Animated mini progress bar */}
                  <div className="w-full h-[3px] bg-[#1e2840] rounded-full mt-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(stat.value ?? 0, 100)}%` }}
                      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 + i * 0.1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${stat.gradient} relative`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent progress-shimmer-anim" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ═══ QUICK ACTIONS with glow cards ═══ */}
          <motion.div variants={itemSlide}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-[#00f2fe] rounded-full" />
              <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.path}
                  custom={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: EASE_OUT }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={SPRING_TAP}
                  onClick={() => navigate(action.path)}
                  className="relative p-4 rounded-xl tw-text-primary text-left overflow-hidden group"
                >
                  {/* Gradient background with glass overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-90`} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-white/10 to-transparent" />

                  {/* Hover glow ring */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <motion.div
                      className="text-xl mb-2"
                      whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {action.icon}
                    </motion.div>
                    <div className="font-semibold text-sm">{action.label}</div>
                    <div className="text-[11px] tw-text-secondary mt-0.5 font-mono">{action.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ═══ FOCUS THIS WEEK ═══ */}
          {topWeak.length > 0 && (
            <motion.div variants={itemSlide}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="tw-card p-5 overflow-hidden relative group"
                whileHover={{ borderColor: 'rgba(0,242,254,0.2)' }}
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ffb800] to-[#ff6b00] opacity-30" />

                <div className="flex items-center gap-2 mb-4">
                  <motion.span
                    className="text-lg"
                    animate={{ rotate: [0, 12, -12, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                  >
                    🎯
                  </motion.span>
                  <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Focus This Week</h2>
                  <span className="text-[10px] tw-text-secondary font-mono ml-auto">prioritize</span>
                </div>
                <div className="space-y-2">
                  {topWeak.map((d: any, idx: number) => {
                    const domain = domains.find(dm => dm.id === d.domainId);
                    const perf = getPerformanceLabel(d.accuracy);
                    return (
                      <motion.div
                        key={d.domainId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 + 0.2 }}
                        whileHover={{ x: 4, borderColor: 'rgba(0,242,254,0.25)' }}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#080b14]/80 border border-[#1e2840]/60 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <motion.span
                            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono tw-text-secondary bg-[#0d1222] border border-[#1e2840]"
                            whileHover={{ scale: 1.15, borderColor: '#00f2fe', color: '#00f2fe' }}
                          >
                            {idx + 1}
                          </motion.span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium tw-text-primary truncate">{domain?.shortName}</p>
                            <p className={`text-[11px] font-mono ${perf.color}`}>{Math.round(d.accuracy)}%</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={SPRING_TAP}
                          onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
                          className="flex-shrink-0 px-3 py-1.5 text-[11px] font-medium bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20 rounded-lg hover:bg-[#00f2fe]/20 hover:shadow-[0_0_12px_rgba(0,242,254,0.1)] transition-all font-mono"
                        >
                          ▸ Practice
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ═══ DOMAIN PERFORMANCE ═══ */}
          <motion.div variants={itemSlide} className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-[#ff007f] rounded-full" />
              <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Domain Performance</h2>
              <span className="text-[10px] tw-text-secondary font-mono ml-auto">weakest → strongest</span>
            </div>

            {sortedStats.map((d: any, idx: number) => {
              const domain = domains.find(dm => dm.id === d.domainId);
              const perf = getPerformanceLabel(d.accuracy);
              const isWeak = d.accuracy < 80;
              const concepts = getDomainConcepts(d.domainId);

              return (
                <motion.div
                  key={d.domainId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  whileHover={{
                    borderColor: isWeak ? 'rgba(0,242,254,0.25)' : 'rgba(0,242,254,0.12)',
                    y: -1,
                  }}
                  className="tw-card overflow-hidden group"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <motion.div
                            className="w-2 h-2 rounded-full relative"
                            style={{ backgroundColor: domain?.color }}
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 + idx }}
                          >
                            <div
                              className="absolute -inset-1 rounded-full opacity-40 blur-sm"
                              style={{ backgroundColor: domain?.color }}
                            />
                          </motion.div>
                          <h3 className="text-sm font-semibold tw-text-primary truncate">{domain?.shortName || `Domain ${d.domainId}`}</h3>
                          {isWeak && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20 font-mono">focus</span>
                          )}
                        </div>
                        {d.questionsAttempted > 0 && (
                          <p className="text-[11px] tw-text-secondary mt-0.5 ml-4 font-mono">
                            {d.correctAnswers}/{d.questionsAttempted} correct · {Math.round(d.totalTimeSpent / 60)}m
                          </p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 ml-3 text-lg font-bold font-mono tabular-nums ${
                        d.accuracy >= 80 ? 'text-[#00f2fe]' :
                        d.accuracy >= 70 ? 'text-[#ffb800]' :
                        d.accuracy >= 60 ? 'text-[#ff6b6b]' : 'text-[#ff007f]'
                      }`}>
                        {Math.round(d.accuracy)}%
                      </span>
                    </div>

                    {/* Progress bar with shimmer */}
                    <div className="w-full h-[3px] bg-[#1e2840] rounded-full mb-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(d.accuracy)}%` }}
                        transition={{ duration: 0.6, ease: EASE_OUT, delay: idx * 0.05 }}
                        className={`h-full rounded-full relative ${
                          d.accuracy >= 80 ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe]' :
                          d.accuracy >= 70 ? 'bg-gradient-to-r from-[#ffb800] to-[#ff6b00]' :
                          d.accuracy >= 60 ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ff007f]' : 'bg-gradient-to-r from-[#ff007f] to-[#ff0066]'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent progress-shimmer-anim" />
                      </motion.div>
                    </div>

                    {/* Performance badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium font-mono ${perf.bg} ${perf.color}`}>
                      <span>{perf.icon}</span>
                      <span>{perf.label}</span>
                    </div>

                    {/* Weak domain concept chips */}
                    {isWeak && concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {concepts.slice(0, 3).map((c: string) => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-[#080b14] tw-text-secondary border border-[#1e2840]/60 font-mono">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action button */}
                    <motion.button
                      whileHover={{ scale: 1.02, borderColor: isWeak ? 'rgba(0,242,254,0.4)' : 'rgba(0,242,254,0.15)' }}
                      whileTap={SPRING_TAP}
                      onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
                      className={`w-full mt-3 py-2 rounded-lg text-[11px] font-medium transition-all font-mono ${
                        isWeak
                          ? 'bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20 hover:bg-[#00f2fe]/20 hover:shadow-[0_0_12px_rgba(0,242,254,0.08)]'
                          : 'bg-[#080b14] tw-text-secondary border border-[#1e2840]/60 hover:text-[#8892a9]'
                      }`}
                    >
                      {isWeak ? '▸ Practice Now' : '▸ Review'}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ═══ EXAM RECOMMENDATION ═══ */}
          {examDate && (
            <motion.div variants={itemSlide}>
              <motion.div
                whileHover={{ borderColor: 'rgba(0,242,254,0.2)' }}
                className="bg-gradient-to-r from-[#00f2fe]/5 to-[#ff007f]/5 rounded-xl border border-[#00f2fe]/10 p-5 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 relative">
                  <motion.span
                    className="text-2xl"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    📅
                  </motion.span>
                  <div>
                    <p className="text-[10px] tw-text-secondary font-mono tracking-wider">Exam Recommendation</p>
                    <p className="tw-text-primary font-medium text-sm font-mono mt-0.5">{examDate}</p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="ml-auto flex items-center gap-2"
                  >
                    <span className="text-[10px] text-[#00f2fe] font-mono">◆ ready</span>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
    </div>
  );
}

export default Dashboard;
