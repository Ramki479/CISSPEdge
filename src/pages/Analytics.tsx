import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalyticsSkeleton } from '../components/ui/SkeletonCard';
import { ErrorState } from '../components/ui/ErrorState';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { fetchDomainAnalytics } from '../data';
import { calculateOverallStats } from '../utils/analytics';
import { generateRecommendations } from '../utils/recommendations';
import { domains } from '../data/domains';
import type { DomainAnalytics, LearningRecommendation } from '../types';

/* ─── Easing tokens ─────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } };

/* ─── Fallback sample data ───────────────────────────────────────────────── */
const FALLBACK_DATA = [
  { domain: 'Asset Security', accuracy: 85, attempted: 12, time: 18 },
  { domain: 'IAM', accuracy: 72, attempted: 8, time: 14 },
  { domain: 'Software Security', accuracy: 91, attempted: 15, time: 22 },
  { domain: 'Security & Risk', accuracy: 63, attempted: 20, time: 30 },
  { domain: 'Architecture & Eng.', accuracy: 45, attempted: 10, time: 16 },
  { domain: 'Network Security', accuracy: 78, attempted: 14, time: 20 },
  { domain: 'Assessment & Testing', accuracy: 55, attempted: 6, time: 10 },
  { domain: 'SecOps', accuracy: 69, attempted: 11, time: 17 },
];

/* ─── Animation variants ─────────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const itemSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getPerformanceLabel(accuracy: number) {
  if (accuracy < 70) return { label: 'Needs Work', icon: '⚠', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/10' };
  if (accuracy < 80) return { label: 'Improving', icon: '◈', color: 'text-[#ffb800]', bg: 'bg-[#ffb800]/10' };
  return { label: 'Strong', icon: '◆', color: 'text-[#00f2fe]', bg: 'bg-[#00f2fe]/10' };
}

function getReadinessStatus(score: number) {
  if (score >= 80) return { label: 'Exam Ready', icon: '◆', color: '#00f2fe', tip: 'Great shape! Maintain with mock exams.' };
  if (score >= 60) return { label: 'Moderate', icon: '◈', color: '#ffb800', tip: 'Focus on weakest 3 domains.' };
  if (score >= 40) return { label: 'Needs Work', icon: '⚠', color: '#ff6b6b', tip: 'Build fundamentals first.' };
  return { label: 'Getting Started', icon: '◉', color: '#ff007f', tip: 'Complete more questions to assess readiness.' };
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
   ANALYTICS
   ═══════════════════════════════════════════════════════════════════════════ */
export function Analytics() {

  const [domainStats, setDomainStats] = useState<DomainAnalytics[]>([]);
  const [overall, setOverall] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const stats = await fetchDomainAnalytics();
      setDomainStats(stats);
      setOverall(calculateOverallStats(stats));
      setRecommendations(generateRecommendations(stats));
      const chartData = stats.map(d => ({
        domain: domains.find(dom => dom.id === d.domainId)?.shortName || '',
        accuracy: Math.round(d.accuracy),
        attempted: d.questionsAttempted,
        time: Math.round(d.totalTimeSpent / 60),
      }));
      const hasRealData = stats.some(s => s.questionsAttempted > 0);
      setTrend(hasRealData ? chartData : FALLBACK_DATA);
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const sortedStats = [...domainStats].sort((a, b) => a.accuracy - b.accuracy);
  const topWeak = sortedStats.filter(d => d.accuracy < 80).slice(0, 3);
  const domainColors = domains.map(d => d.color);
  const hasRealData = domainStats.some(d => d.questionsAttempted > 0);

  /* ─── Loading Shimmer ────────────────────────────────────────────────── */
  if (loading) return <AnalyticsSkeleton />;
  if (loadError) return <ErrorState message={loadError.message} onRetry={loadAnalytics} />;

  /* ─── Empty State (no data yet) ──────────────────────────────────────── */
  if (!hasRealData) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 relative">
        <div className="fixed inset-0 bg-[linear-gradient(rgba(0,242,254,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,254,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
        <div className="relative z-10">
          <motion.div
            className="space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemSlide}>
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#ff007f] rounded-xl opacity-20 blur-md animate-breathe" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-[#ff0066] rounded-xl opacity-40 flex items-center justify-center">
                    <span className="text-sm font-bold text-white font-mono">◈</span>
                  </div>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Analytics</h1>
              </div>
            </motion.div>

            <motion.div variants={itemSlide} className="tw-card p-8 lg:p-12 flex flex-col items-center justify-center text-center">
              <motion.div
                className="relative w-16 h-16 mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f]/20 to-[#00f2fe]/20 rounded-full blur-xl animate-breathe" />
                <span className="relative text-4xl block text-center opacity-40">◈</span>
              </motion.div>
              <h2 className="text-lg font-semibold tw-text-primary mb-2 font-mono">No Data Yet</h2>
              <p className="tw-text-secondary text-sm max-w-md leading-relaxed">
                Complete practice questions to see your domain accuracy analytics, personalized recommendations, and performance breakdown.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0,242,254,0.15)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => navigate('/test?mode=quick-practice')}
                  className="relative group px-5 py-2.5 rounded-xl text-sm font-mono overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90" />
                  <span className="relative z-10 text-white">▸ Start Quick Practice</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(0,242,254,0.3)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 tw-btn-secondary rounded-xl text-sm font-mono"
                >
                  ◁ Dashboard
                </motion.button>
              </div>
            </motion.div>

            <motion.div variants={itemSlide} className="tw-card overflow-hidden">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                onClick={() => setShowCharts(!showCharts)}
                className="w-full p-4 flex items-center justify-between text-white transition-colors"
              >
                <span className="text-sm font-medium font-mono tracking-wide">
                  <span className="text-[#00f2fe]">▸</span> Sample Preview
                </span>
                <motion.span animate={{ rotate: showCharts ? 180 : 0 }} className="text-white/70 text-xs">▼</motion.span>
              </motion.button>
              <AnimatePresence>
                {showCharts && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 lg:p-5 border-t border-[#1e2840]/80 space-y-4">
                      <span className="text-[10px] text-white/70 bg-[#080b14] px-3 py-1 rounded font-mono border border-[#1e2840]/60">sample data</span>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={FALLBACK_DATA}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e2840" />
                          <XAxis dataKey="domain" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                          <Tooltip
                            contentStyle={{
                              background: '#0d1222',
                              border: '1px solid #1e2840',
                              borderRadius: '8px',
                              color: '#e8edf5',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                            {FALLBACK_DATA.map((_entry, index) => (
                              <Cell key={index} fill={domainColors[index % domainColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: Main Analytics View
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto pb-8 relative">
      {/* Persistent cyber-grid background */}
      <div className="relative z-10">
        <motion.div
          className="space-y-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ═══ HUD HEADER ═══ */}
          <motion.div variants={itemSlide} className="flex items-center gap-3 relative overflow-hidden">
            <div className="absolute -top-8 -left-8 w-32 h-32 opacity-[0.06] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-transparent rounded-full blur-3xl animate-float-delayed" />
            </div>
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#ff007f] rounded-xl opacity-20 blur-md animate-breathe" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-[#ff0066] rounded-xl opacity-40 flex items-center justify-center">
                <span className="text-sm font-bold text-white font-mono">◈</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Analytics</h1>
              <p className="text-[11px] tw-text-secondary mt-0.5 font-mono tracking-wide">
                <span className="text-[#ff007f]">$</span> analyze <span className="text-white/70">--domains</span> <span className="text-[#00f2fe]">{domainStats.length}</span>
              </p>
            </div>
          </motion.div>

          {/* ═══ READINESS CARD with animated SVG ring ═══ */}
          {overall && (
            <motion.div
              variants={itemSlide}
              whileHover={{ borderColor: 'rgba(0,242,254,0.2)' }}
              className="tw-card p-5 relative overflow-hidden group"
            >
              {/* Decorative top line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#ff007f] opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-[10px] tw-text-secondary font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getReadinessStatus(overall.readinessScore).color }} />
                    CISSP Readiness
                  </p>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <motion.span
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE_OUT }}
                      className="text-4xl lg:text-5xl font-bold font-mono tabular-nums"
                      style={{ color: getReadinessStatus(overall.readinessScore).color }}
                    >
                      {overall.readinessScore}
                    </motion.span>
                    <span className="text-sm text-white/70 font-mono">/100</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-xs font-medium font-mono tracking-wide"
                      style={{ color: getReadinessStatus(overall.readinessScore).color }}
                    >
                      {getReadinessStatus(overall.readinessScore).icon} {getReadinessStatus(overall.readinessScore).label}
                    </span>
                    <span className="text-[10px] text-white/70 font-mono">· {getReadinessStatus(overall.readinessScore).tip}</span>
                  </div>
                </div>

                {/* Animated SVG ring */}
                <div className="relative w-20 h-20 lg:w-24 lg:h-24 flex-shrink-0">
                  {/* Glow ring behind */}
                  <div
                    className="absolute inset-0 rounded-full opacity-20 blur-xl"
                    style={{ backgroundColor: getReadinessStatus(overall.readinessScore).color }}
                  />
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e2840" strokeWidth="2.5" />
                    <motion.circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 100' }}
                      animate={{ strokeDasharray: `${overall.readinessScore} ${100 - overall.readinessScore}` }}
                      transition={{ duration: 1.2, ease: EASE_OUT }}
                      style={{ color: getReadinessStatus(overall.readinessScore).color }}
                    />
                  </svg>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 12 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-lg font-bold font-mono tabular-nums" style={{ color: getReadinessStatus(overall.readinessScore).color }}>
                      {overall.readinessScore}
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Stats grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1e2840]/80"
              >
                {[
                  { label: 'Questions', value: overall.totalAttempted, color: '#ffffff' },
                  { label: 'Correct', value: overall.totalCorrect, color: '#10b981' },
                  { label: 'Accuracy', value: `${overall.overallPercentage}%`, color: overall.overallPercentage >= 70 ? '#00f2fe' : '#ffb800' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="text-center"
                  >
                    <p className="text-lg font-bold font-mono tabular-nums" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-white/70 font-mono">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ═══ FOCUS THIS WEEK ═══ */}
          {topWeak.length > 0 && (
            <motion.div variants={itemSlide}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="tw-card p-5 relative overflow-hidden group"
                whileHover={{ borderColor: 'rgba(0,242,254,0.2)' }}
              >
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
                </div>
                <div className="space-y-2">
                  {topWeak.map((d, idx) => {
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
                            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono text-white/70 bg-[#0d1222] border border-[#1e2840]"
                            whileHover={{ scale: 1.15, borderColor: '#00f2fe', color: '#00f2fe' }}
                          >
                            {idx + 1}
                          </motion.span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{domain?.shortName}</p>
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
              <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Domain Accuracy</h2>
              <span className="text-[10px] text-white/70 font-mono ml-auto">weakest → strongest</span>
            </div>
            {sortedStats.map((d, idx) => {
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
                            <div className="absolute -inset-1 rounded-full opacity-40 blur-sm" style={{ backgroundColor: domain?.color }} />
                          </motion.div>
                          <h3 className="text-sm font-semibold tw-text-primary truncate">{domain?.shortName}</h3>
                        </div>
                        {d.questionsAttempted > 0 && (
                          <p className="text-[11px] text-white/70 mt-0.5 ml-4 font-mono">
                            {d.correctAnswers}/{d.questionsAttempted} correct · {Math.round(d.totalTimeSpent / 60)}m
                          </p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 ml-3 text-lg font-bold font-mono tabular-nums ${
                        d.accuracy >= 80 ? 'text-[#00f2fe]' : d.accuracy >= 70 ? 'text-[#ffb800]' : d.accuracy >= 60 ? 'text-[#ff6b6b]' : 'text-[#ff007f]'
                      }`}>{Math.round(d.accuracy)}%</span>
                    </div>

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

                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium font-mono ${perf.bg} ${perf.color}`}>
                      <span>{perf.icon}</span> <span>{perf.label}</span>
                    </div>

                    {isWeak && concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {concepts.slice(0, 3).map(c => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-[#080b14] text-white/70 border border-[#1e2840]/60 font-mono">{c}</span>
                        ))}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02, borderColor: isWeak ? 'rgba(0,242,254,0.4)' : 'rgba(0,242,254,0.15)' }}
                      whileTap={SPRING_TAP}
                      onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
                      className={`w-full mt-3 py-2 rounded-lg text-[11px] font-medium transition-all font-mono ${
                        isWeak
                          ? 'bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20 hover:bg-[#00f2fe]/20 hover:shadow-[0_0_12px_rgba(0,242,254,0.08)]'
                          : 'bg-[#080b14] text-white/70 border border-[#1e2840]/60 hover:text-[#8892a9]'
                      }`}
                    >
                      {isWeak ? '▸ Practice Now' : '▸ Review'}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ═══ STRENGTHS & WEAKNESSES ═══ */}
          {overall && (overall.strengths.length > 0 || overall.weaknesses.length > 0) && (
            <motion.div variants={itemSlide}>
              <div className="tw-card p-5 relative overflow-hidden group"
                whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#ff007f] opacity-20" />
                <h2 className="text-sm font-semibold tw-text-primary mb-4 font-mono tracking-wide">Summary</h2>
                <div className="space-y-4">
                  {overall.strengths.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <p className="text-xs font-medium text-[#00f2fe] mb-2 font-mono tracking-wide flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe]" />
                        Strengths
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {overall.strengths.map((s: string) => (
                          <span key={s} className="px-2.5 py-1 bg-[#00f2fe]/10 text-[#00f2fe] rounded-lg text-[11px] font-mono border border-[#00f2fe]/20">
                            ◆ {s}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {overall.weaknesses.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-xs font-medium text-[#ff6b6b] mb-2 font-mono tracking-wide flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b]" />
                        Areas to Improve
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {overall.weaknesses.map((w: string) => (
                          <span key={w} className="px-2.5 py-1 bg-[#ff6b6b]/10 text-[#ff6b6b] rounded-lg text-[11px] font-mono border border-[#ff6b6b]/20">
                            ⚠ {w}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ DETAILED CHARTS (collapsible) ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card overflow-hidden">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
                onClick={() => setShowCharts(!showCharts)}
                className="w-full p-4 flex items-center justify-between text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#00f2fe] rounded-full" />
                  <span className="text-sm font-medium font-mono tracking-wide">Detailed Charts</span>
                </div>
                <motion.span animate={{ rotate: showCharts ? 180 : 0 }} className="text-white/70 text-xs">▼</motion.span>
              </motion.button>
              <AnimatePresence>
                {showCharts && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 lg:p-5 border-t border-[#1e2840]/80 space-y-6">
                      {/* Radar chart */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h3 className="text-[10px] font-semibold text-white/70 uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                          <span className="w-1 h-3 rounded-full bg-[#00f2fe]" />
                          Performance Radar
                        </h3>
                        <div className="bg-[#080b14]/50 rounded-xl p-4">
                          <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={trend}>
                              <PolarGrid stroke="#1e2840" strokeOpacity={0.5} />
                              <PolarAngleAxis dataKey="domain" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 9 }} />
                              <Radar name="Accuracy" dataKey="accuracy" stroke="#00f2fe" fill="#00f2fe" fillOpacity={0.12} strokeWidth={1.5} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>

                      {/* Bar chart */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h3 className="text-[10px] font-semibold text-white/70 uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                          <span className="w-1 h-3 rounded-full bg-[#ff007f]" />
                          Accuracy Comparison
                        </h3>
                        <div className="bg-[#080b14]/50 rounded-xl p-4">
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={trend} barCategoryGap="20%">
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e2840" strokeOpacity={0.5} />
                              <XAxis dataKey="domain" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 9 }} axisLine={{ stroke: '#1e2840' }} />
                              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.7)' }} axisLine={{ stroke: '#1e2840' }} />
                              <Tooltip
                                contentStyle={{
                                  background: '#0d1222',
                                  border: '1px solid #1e2840',
                                  borderRadius: '8px',
                                  color: '#e8edf5',
                                  fontSize: '12px',
                                }}
                                cursor={{ fill: 'rgba(0,242,254,0.05)' }}
                              />
                              <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} minPointSize={2}>
                                {trend.map((_entry: any, index: number) => (
                                  <Cell key={index} fill={domainColors[index % domainColors.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>

                      {/* Domain breakdown table */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h3 className="text-[10px] font-semibold text-white/70 uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                          <span className="w-1 h-3 rounded-full bg-[#ffb800]" />
                          Domain Breakdown
                        </h3>
                        <div className="bg-[#080b14]/50 rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-[#1e2840]/80">
                                  <th className="text-left p-3 text-[10px] text-white/70 font-medium font-mono tracking-wider">Domain</th>
                                  <th className="text-center p-3 text-[10px] text-white/70 font-medium font-mono tracking-wider">Accuracy</th>
                                  <th className="text-center p-3 text-[10px] text-white/70 font-medium font-mono tracking-wider">Q's</th>
                                  <th className="text-center p-3 text-[10px] text-white/70 font-medium font-mono tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {domainStats.map((d, i) => {
                                  const domain = domains.find(dm => dm.id === d.domainId);
                                  const statusColor = d.classification === 'strong' ? '#00f2fe' : d.classification === 'moderate' ? '#ffb800' : d.classification === 'weak' ? '#ff6b6b' : '#ff007f';
                                  return (
                                    <motion.tr
                                      key={d.domainId}
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.03 }}
                                      className="border-b border-[#1e2840]/50 hover:bg-white/[0.015] transition-colors"
                                    >
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          <motion.div
                                            className="w-2 h-2 rounded-full relative"
                                            style={{ backgroundColor: domain?.color }}
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: i }}
                                          >
                                            <div className="absolute -inset-1 rounded-full opacity-30 blur-sm" style={{ backgroundColor: domain?.color }} />
                                          </motion.div>
                                          <span className="text-xs tw-text-primary font-medium">{domain?.shortName}</span>
                                        </div>
                                      </td>
                                      <td className="text-center p-3">
                                        <span className={`text-xs font-bold font-mono tabular-nums ${
                                          d.accuracy >= 80 ? 'text-[#00f2fe]' : d.accuracy >= 70 ? 'text-[#ffb800]' : d.accuracy >= 60 ? 'text-[#ff6b6b]' : 'text-[#ff007f]'
                                        }`}>{Math.round(d.accuracy)}%</span>
                                      </td>
                                      <td className="text-center p-3 text-xs text-white/70 font-mono tabular-nums">{d.questionsAttempted}</td>
                                      <td className="text-center p-3">
                                        <span
                                          className="text-[10px] px-2 py-0.5 rounded font-mono border"
                                          style={{
                                            backgroundColor: `${statusColor}15`,
                                            color: statusColor,
                                            borderColor: `${statusColor}25`,
                                          }}
                                        >
                                          {d.classification}
                                        </span>
                                      </td>
                                    </motion.tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Analytics;
