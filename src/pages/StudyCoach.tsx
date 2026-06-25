import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchDomainAnalytics, db } from '../data';
import { buildWeaknessReport, getHeatmapColor, getHeatmapBg, PERFORMANCE_BANDS, calculateExamReadiness } from '../utils/weaknessAnalysis';
import { downloadStudyPlanPdf } from '../utils/pdfStudyPlan';
import { fetchTopicAnalytics } from '../data';
import { domains } from '../data/domains';
import { domainContent } from '../data/learningContent';
import type { DomainAnalytics } from '../types';
import type { TopicAnalytics } from '../utils/topicMapping';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const itemSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   STUDY COACH PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export function StudyCoach() {
  const navigate = useNavigate();
  const [domainAnalytics, setDomainAnalytics] = useState<DomainAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [trendExpanded, setTrendExpanded] = useState<Record<number, boolean>>({});
  const [lastTestCount, setLastTestCount] = useState(0);

  const [topicAnalytics, setTopicAnalytics] = useState<TopicAnalytics[]>([]);

  useEffect(() => {
    Promise.all([
      fetchDomainAnalytics(),
      db.testSessions.count(),
      fetchTopicAnalytics(),
    ]).then(([analytics, sessions, topics]) => {
      setDomainAnalytics(analytics);
      setLastTestCount(sessions);
      setTopicAnalytics(topics);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const report = useMemo(() => buildWeaknessReport(domainAnalytics, topicAnalytics), [domainAnalytics, topicAnalytics]);
  const readiness = useMemo(() => calculateExamReadiness(domainAnalytics), [domainAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] opacity-40 animate-pulse" />
          <p className="text-sm text-white/70 font-mono">Analyzing performance...</p>
        </div>
      </div>
    );
  }

  const hasData = domainAnalytics.some(d => d.questionsAttempted > 0);

  if (!hasData) {
    return (
      <motion.div className="max-w-4xl mx-auto pb-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemSlide} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] opacity-30 flex items-center justify-center mb-4">
            <span className="text-2xl text-white font-mono font-bold">◈</span>
          </div>
          <h2 className="text-lg font-bold text-white font-mono mb-2">No Performance Data Yet</h2>
          <p className="text-sm text-white/50 font-mono max-w-md leading-relaxed mb-6">
            Complete practice tests to unlock personalized weakness analysis, exam readiness scoring, and study recommendations.
          </p>
          <button
            onClick={() => navigate('/test?mode=quick-practice')}
            className="px-5 py-2 bg-gradient-to-r from-[#00f0ff] to-[#ff00e4] text-white text-xs font-bold font-mono rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[#00f0ff]/20"
          >
            ▸ Start Practice
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="max-w-5xl mx-auto pb-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={itemSlide} className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-xl opacity-20 blur-md" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-xl opacity-40 flex items-center justify-center">
                <span className="text-lg font-bold text-white font-mono">◈</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Study Coach</h1>
              <p className="text-xs text-white/50 font-mono mt-0.5">AI-powered weakness analysis & personalized recommendations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadStudyPlanPdf(report)}
              className="px-3 py-1.5 rounded-lg text-[9px] font-mono border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all"
            >
              ⊘ Download PDF
            </button>
            <button
              onClick={() => navigate('/mentor')}
              className="px-3 py-1.5 rounded-lg text-[9px] font-mono border border-[#1e2840]/80 text-white/40 hover:text-white/60 transition-all"
            >
              # AI Mentor →
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ EXAM READINESS SCORE (big hero card) ═══ */}
      <motion.div variants={itemSlide} className="mb-5">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#00f0ff]/5 via-[#ff00e4]/5 to-transparent border border-[#1e2840] rounded-2xl p-6 lg:p-8">
          {/* Decorative rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-[#00f0ff]/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[#ff00e4]/8" />

          <div className="relative flex flex-col lg:flex-row items-center gap-6">
            {/* Score circle */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e2840" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#readinessGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(report.overallReadiness / 100) * 264} 264`}
                />
                <defs>
                  <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="100%" stopColor="#ff00e4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.span
                    className="text-3xl font-bold font-mono tabular-nums"
                    style={{ color: report.overallReadiness >= 75 ? '#00f0ff' : report.overallReadiness >= 50 ? '#ffb800' : '#ff6b6b' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {report.overallReadiness}
                  </motion.span>
                  <p className="text-[8px] text-white/40 font-mono uppercase tracking-wider mt-0.5">Readiness</p>
                </div>
              </div>
            </div>

            {/* Score details */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-lg font-bold text-white font-mono mb-1">Exam Readiness Score</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">{report.interpretation}</p>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {readiness.components.map(comp => (
                  <div key={comp.name} className="flex items-center gap-2 px-2.5 py-1 bg-[#0d1222]/80 border border-[#1e2840]/60 rounded-lg">
                    <span className="text-[9px] font-mono text-white/50">{comp.name}</span>
                    <motion.span
                      className="text-xs font-bold font-mono tabular-nums"
                      style={{ color: comp.score >= 70 ? '#10b981' : comp.score >= 50 ? '#ffb800' : '#ff6b6b' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {comp.score}%
                    </motion.span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ PERFORMANCE BAND LEGEND + FILTER ═══ */}
      <motion.div variants={itemSlide} className="flex flex-wrap gap-1 mb-4">
        {PERFORMANCE_BANDS.map(band => (
          <button
            key={band.band}
            onClick={() => setSelectedBand(selectedBand === band.band ? null : band.band)}
            className={`px-2 py-1 rounded-lg text-[9px] font-mono border transition-all ${
              selectedBand === band.band
                ? `${band.bg} ${band.border}`
                : 'text-white/40 border-[#1e2840]/60 hover:text-white/60'
            }`}
          >
            {band.icon} {band.label} ({band.minAccuracy}-{band.maxAccuracy}%)
          </button>
        ))}
      </motion.div>

      {/* ═══ THREE-COLUMN PERFORMANCE OVERVIEW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        {/* Critical Weaknesses */}
        <motion.div variants={itemSlide}>
          <div className="bg-[#0d1222] border border-[#ff007f]/30 rounded-xl p-4 h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#ff007f] animate-pulse" />
              <h3 className="text-xs font-semibold text-[#ff007f] font-mono tracking-wider uppercase">Critical</h3>
              <span className="text-[9px] font-mono text-[#ff007f]/60 ml-auto">{report.criticalWeaknesses.length}</span>
            </div>
            {report.criticalWeaknesses.length === 0 ? (
              <p className="text-[10px] text-white/40 font-mono">No critical weaknesses detected</p>
            ) : (
              <div className="space-y-2">
                {report.criticalWeaknesses.map(d => (
                  <div key={d.domainId} className="p-2 bg-[#ff007f]/8 border border-[#ff007f]/15 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-white/80 font-mono">{d.shortName}</span>
                      <span className="text-[10px] font-mono font-bold text-[#ff007f]">{Math.round(d.accuracy)}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1e2840] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full bg-[#ff007f]" style={{ width: `${d.accuracy}%` }} />
                    </div>
                    <button
                      onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
                      className="mt-1.5 text-[8px] font-mono text-[#ff007f]/70 hover:text-[#ff007f] transition-colors"
                    >
                      ▸ Practice this domain
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Needs Review */}
        <motion.div variants={itemSlide}>
          <div className="bg-[#0d1222] border border-[#ffb800]/30 rounded-xl p-4 h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#ffb800]" />
              <h3 className="text-xs font-semibold text-[#ffb800] font-mono tracking-wider uppercase">Needs Review</h3>
              <span className="text-[9px] font-mono text-[#ffb800]/60 ml-auto">{report.needsReview.length}</span>
            </div>
            {report.needsReview.length === 0 ? (
              <p className="text-[10px] text-white/40 font-mono">All domains at or above 70%</p>
            ) : (
              <div className="space-y-2">
                {report.needsReview.map(d => (
                  <div key={d.domainId} className="p-2 bg-[#ffb800]/8 border border-[#ffb800]/15 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-white/80 font-mono">{d.shortName}</span>
                      <span className="text-[10px] font-mono font-bold text-[#ffb800]">{Math.round(d.accuracy)}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1e2840] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full bg-[#ffb800]" style={{ width: `${d.accuracy}%` }} />
                    </div>
                    <button
                      onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
                      className="mt-1.5 text-[8px] font-mono text-[#ffb800]/70 hover:text-[#ffb800] transition-colors"
                    >
                      ▸ Practice this domain
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Strong Areas */}
        <motion.div variants={itemSlide}>
          <div className="bg-[#0d1222] border border-[#10b981]/30 rounded-xl p-4 h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
              <h3 className="text-xs font-semibold text-[#10b981] font-mono tracking-wider uppercase">Strong</h3>
              <span className="text-[9px] font-mono text-[#10b981]/60 ml-auto">{report.strongAreas.length}</span>
            </div>
            {report.strongAreas.length === 0 ? (
              <p className="text-[10px] text-white/40 font-mono">Keep practicing to build strong areas</p>
            ) : (
              <div className="space-y-2">
                {report.strongAreas.slice(0, 4).map(d => (
                  <div key={d.domainId} className="flex items-center justify-between p-2 bg-[#10b981]/8 border border-[#10b981]/15 rounded-lg">
                    <span className="text-[10px] font-medium text-white/80 font-mono">{d.shortName}</span>
                    <span className="text-[10px] font-mono font-bold text-[#10b981]">{Math.round(d.accuracy)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══ RECOMMENDED STUDY SEQUENCE ═══ */}
      {report.topRecommendedTopics.length > 0 && (
        <motion.div variants={itemSlide} className="mb-5">
          <div className="bg-gradient-to-r from-[#00f0ff]/5 to-[#ff00e4]/5 border border-[#1e2840] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg text-[#ffb800]">🎯</span>
              <h2 className="text-sm font-semibold text-white font-mono">Where Should I Focus Next?</h2>
            </div>

            <div className="space-y-2">
              {report.topRecommendedTopics.map((rec, idx) => {
                const contentDomain = domainContent.find(d => d.id === rec.domainId);
                return (
                  <motion.div
                    key={`${rec.domainId}-${rec.topicId}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className="flex items-start gap-3 p-3 bg-[#0d1222]/80 border border-[#1e2840]/60 rounded-lg hover:border-[#00f0ff]/20 transition-all group"
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold font-mono flex-shrink-0 ${
                      rec.priority === 1 ? 'bg-[#ff007f]/15 text-[#ff007f] border border-[#ff007f]/25' :
                      rec.priority === 2 ? 'bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/25' :
                      'bg-[#ffb800]/15 text-[#ffb800] border border-[#ffb800]/25'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/80 font-mono">{rec.title}</p>
                      <p className="text-[9px] text-white/50 font-mono mt-0.5">{rec.reason}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          const domain = domainContent.find(d => d.id === rec.domainId);
                          if (domain && rec.topicId) {
                            navigate(`/learn/${rec.domainId}/${rec.topicId}`);
                          } else {
                            navigate(`/test?mode=domain-wise&domain=${rec.domainId}`);
                          }
                        }}
                        className="px-2 py-1 text-[8px] font-mono bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 rounded hover:bg-[#00f0ff]/20 transition-all"
                      >
                        {rec.topicId ? 'Study' : 'Practice'}
                      </button>
                      <button
                        onClick={() => navigate(`/test?mode=domain-wise&domain=${rec.domainId}`)}
                        className="px-2 py-1 text-[8px] font-mono text-white/40 border border-[#1e2840]/80 rounded hover:text-white/60 transition-all"
                      >
                        Quiz
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Study plan summary */}
            <div className="mt-3 pt-3 border-t border-[#1e2840]/60">
              <p className="text-[9px] font-mono text-white/40">
                Estimated study time: <span className="text-[#00f0ff]">~{report.estimatedStudyHours} hours</span>
                <span className="mx-2">·</span>
                <button onClick={() => navigate('/mentor')} className="text-[#00f0ff] hover:underline">Ask AI Mentor for a detailed plan →</button>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ DOMAIN HEATMAP ═══ */}
      <motion.div variants={itemSlide} className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-[#00f0ff] to-[#ff00e4]" />
          <h2 className="text-sm font-semibold text-white font-mono">Domain Performance Heatmap</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {report.domains.map(d => (
            <motion.div
              key={d.domainId}
              whileHover={{ y: -2, borderColor: getHeatmapColor(d.accuracy) + '60' }}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                getHeatmapBg(d.accuracy)
              }`}
              style={{ borderColor: getHeatmapColor(d.accuracy) + '30' }}
              onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-white/60">{d.shortName}</span>
                <span className="text-[9px] font-mono font-bold" style={{ color: getHeatmapColor(d.accuracy) }}>
                  {Math.round(d.accuracy)}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#1e2840]/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getHeatmapColor(d.accuracy), width: `${d.accuracy}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${d.accuracy}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[8px] font-mono text-white/30 mt-1">
                {d.questionsAttempted} questions · {d.bandConfig.icon} {d.bandConfig.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ FULL DOMAIN BREAKDOWN ═══ */}
      <motion.div variants={itemSlide} className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 rounded-full bg-[#8b5cf6]" />
          <h2 className="text-sm font-semibold text-white font-mono">Full Domain Breakdown</h2>
        </div>
        <div className="space-y-2">
          {report.domains
            .sort((a, b) => a.accuracy - b.accuracy)
            .map((d, idx) => (
              <motion.div
                key={d.domainId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-[#0d1222] border border-[#1e2840]/80 rounded-xl p-4 hover:border-[#1e2840] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${d.bandConfig.bg} ${d.bandConfig.color} ${d.bandConfig.border}`}>
                      {d.bandConfig.icon}
                    </div>
                    <span className="text-xs font-semibold text-white font-mono">{d.shortName}</span>
                    <span className="text-[8px] text-white/40 font-mono">{d.examWeight}% of exam</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono tabular-nums font-bold" style={{ color: d.bandConfig.color.replace('text-', '') === '[#00f2fe]' ? '#00f2fe' : d.bandConfig.color.includes('10b981') ? '#10b981' : d.bandConfig.color.includes('ffb800') ? '#ffb800' : d.bandConfig.color.includes('ff6b6b') ? '#ff6b6b' : '#ff007f' }}>
                      {Math.round(d.accuracy)}% {d.bandConfig.label}
                    </span>
                    <button
                      onClick={() => setTrendExpanded(prev => ({ ...prev, [d.domainId]: !prev[d.domainId] }))}
                      className="text-[9px] text-white/30 hover:text-white/60 transition-colors"
                    >
                      {trendExpanded[d.domainId] ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-[#1e2840] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full relative"
                style={{ backgroundColor: getHeatmapColor(d.accuracy), width: `${d.accuracy}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${d.accuracy}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.03 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent progress-shimmer-anim" />
                  </motion.div>
                </div>

                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[8px] font-mono text-white/30">
                    {d.correctAnswers}/{d.questionsAttempted} correct
                  </span>
                  <span className="text-[8px] font-mono text-white/30">
                    ~{Math.round(d.avgTimePerQuestion)}s per question
                  </span>
                  <button
                    onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
                    className="ml-auto text-[8px] font-mono text-[#00f0ff]/70 hover:text-[#00f0ff] transition-colors"
                  >
                    ▸ Practice
                  </button>
                </div>

                {/* Expanded topic breakdown */}
                <AnimatePresence>
                  {trendExpanded[d.domainId] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-[#1e2840]/60 overflow-hidden"
                    >
                      <p className="text-[8px] font-mono text-white/30 mb-2 uppercase tracking-wider">Topic Breakdown{t.questionsAttempted > 0 ? '' : ' (no data yet)'}</p>
                      <div className="space-y-1">
                        {d.topicWeaknesses.map(t => (
                          <div key={t.topicId} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                t.questionsAttempted === 0 ? 'bg-[#1e2840]' :
                                t.accuracy >= 80 ? 'bg-[#10b981]' :
                                t.accuracy >= 60 ? 'bg-[#ffb800]' :
                                'bg-[#ff6b6b]'
                              }`} />
                              <span className="text-[9px] text-white/60 font-mono truncate">{t.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`text-[9px] font-mono font-bold ${
                                t.questionsAttempted === 0 ? 'text-[#1e2840]' :
                                t.accuracy >= 80 ? 'text-[#10b981]' :
                                t.accuracy >= 60 ? 'text-[#ffb800]' :
                                'text-[#ff6b6b]'
                              }`}>
                                {t.questionsAttempted > 0 ? `${Math.round(t.accuracy)}%` : '—'}
                              </span>
                              <button
                                onClick={() => navigate(`/learn/${d.domainId}/${t.topicId}`)}
                                className="text-[7px] font-mono text-white/30 hover:text-[#00f0ff] transition-colors"
                              >
                                Study →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* ═══ AI INSIGHTS ═══ */}
      <motion.div variants={itemSlide}>
        <div className="bg-gradient-to-r from-[#8b5cf6]/5 to-transparent border border-[#1e2840] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg text-[#8b5cf6]">#</span>
            <h2 className="text-sm font-semibold text-white font-mono">AI Coach Insights</h2>
            <span className="text-[8px] text-white/30 font-mono ml-auto">based on {lastTestCount} practice session{(lastTestCount !== 1) ? 's' : ''}</span>
          </div>
          <ul className="space-y-1.5">
            {report.criticalWeaknesses.length > 0 && (
              <li className="flex items-start gap-2 text-[10px] text-white/60 font-mono leading-relaxed">
                <span className="text-[#ff007f] mt-0.5 flex-shrink-0">⊘</span>
                <span>Critical: <strong className="text-white/80">{report.criticalWeaknesses.map(d => `${d.shortName} (${Math.round(d.accuracy)}%)`).join(', ')}</strong>. These domains need immediate attention.</span>
              </li>
            )}
            {report.needsReview.length > 0 && (
              <li className="flex items-start gap-2 text-[10px] text-white/60 font-mono leading-relaxed">
                <span className="text-[#ffb800] mt-0.5 flex-shrink-0">◐</span>
                <span>Review: <strong className="text-white/80">{report.needsReview.map(d => d.shortName).join(', ')}</strong>. Focus on these after critical gaps are addressed.</span>
              </li>
            )}
            {report.strongAreas.length > 0 && (
              <li className="flex items-start gap-2 text-[10px] text-white/60 font-mono leading-relaxed">
                <span className="text-[#10b981] mt-0.5 flex-shrink-0">◆</span>
                <span>Strengths: <strong className="text-white/80">{report.strongAreas.slice(0, 3).map(d => `${d.shortName} (${Math.round(d.accuracy)}%)`).join(', ')}</strong>. Maintain with occasional review.</span>
              </li>
            )}
            {report.topRecommendedTopics.length > 0 && (
              <li className="flex items-start gap-2 text-[10px] text-white/60 font-mono leading-relaxed">
                <span className="text-[#00f0ff] mt-0.5 flex-shrink-0">📚</span>
                <span>Study Next: <strong className="text-white/80">{report.topRecommendedTopics[0].title}</strong> — {report.topRecommendedTopics[0].reason}</span>
              </li>
            )}
            <li className="flex items-start gap-2 text-[10px] text-white/60 font-mono leading-relaxed mt-2 pt-2 border-t border-[#1e2840]/60">
              <span className="text-[#00f0ff] mt-0.5 flex-shrink-0">#</span>
              <span>Ask the <button onClick={() => navigate('/mentor')} className="text-[#00f0ff] hover:underline">AI Mentor</button> for personalized study plans, practice questions, or detailed explanations on any weak topic.</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default StudyCoach;
