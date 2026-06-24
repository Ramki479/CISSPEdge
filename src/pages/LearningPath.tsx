import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserProgress, fetchDomainAnalytics } from '../data/database';
import { domainContent, getTotalLearningHours } from '../data/learningContent';
import type { PreparationLevel, UserProgress, DomainAnalytics } from '../types';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;

const DOMAIN_COLORS: Record<number, { primary: string; gradient: string; accent: string }> = {
  1: { primary: '#00f0ff', gradient: 'from-[#00f0ff] to-[#00c8d4]', accent: '#00f0ff' },
  2: { primary: '#10b981', gradient: 'from-[#10b981] to-[#34d399]', accent: '#10b981' },
  3: { primary: '#8b5cf6', gradient: 'from-[#8b5cf6] to-[#a78bfa]', accent: '#8b5cf6' },
  4: { primary: '#ff6b6b', gradient: 'from-[#ff6b6b] to-[#ff8e8e]', accent: '#ff6b6b' },
  5: { primary: '#ffb800', gradient: 'from-[#ffb800] to-[#ffcc4d]', accent: '#ffb800' },
  6: { primary: '#ff007f', gradient: 'from-[#ff007f] to-[#ff3399]', accent: '#ff007f' },
  7: { primary: '#00bcd4', gradient: 'from-[#00bcd4] to-[#26c6da]', accent: '#00bcd4' },
  8: { primary: '#ff6d00', gradient: 'from-[#ff6d00] to-[#ff9100]', accent: '#ff6d00' },
};

const levelDetails: Record<string, { title: string; icon: string; description: string }> = {
  beginner: { title: 'Beginner Path', icon: '◉', description: 'Build a strong foundation in CISSP concepts step by step.' },
  intermediate: { title: 'Intermediate Path', icon: '◈', description: 'Level up with mixed difficulty challenges and scenario learning.' },
  expert: { title: 'Expert Path', icon: '◆', description: 'Near exam-ready. Fine-tune performance with full simulations.' },
};

/* ─── Variants ───────────────────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemSlide = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   LEARNING PATH
   ═══════════════════════════════════════════════════════════════════════════ */
export function LearningPath() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [domainStats, setDomainStats] = useState<DomainAnalytics[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [mindMapOpen, setMindMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const details = level ? levelDetails[level] : null;

  useEffect(() => {
    if (level && !details) { navigate('/dashboard', { replace: true }); return; }
    Promise.all([
      getUserProgress().then(p => setProgress(p)).catch(() => {}),
      fetchDomainAnalytics().then(s => setDomainStats(s)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [level]);

  /* ─── Derived stats ──────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalTopics = domainContent.reduce((s, d) => s + d.topics.length, 0);
    const completedDomains = domainContent.filter(d => {
      const stat = domainStats.find(s => s.domainId === d.id);
      return stat && stat.questionsAttempted >= 5 && stat.accuracy >= 80;
    }).length;
    return { totalTopics, completedDomains, totalDomains: domainContent.length };
  }, [domainStats]);

  const getDomainStatus = (domainId: number) => {
    const stat = domainStats.find(d => d.domainId === domainId);
    if (!stat || stat.questionsAttempted === 0) return 'not-started';
    if (stat.accuracy >= 80) return 'mastered';
    return 'in-progress';
  };

  const totalHours = getTotalLearningHours();

  /* ─── Render ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] opacity-40 animate-pulse" />
          <p className="text-sm text-white/70 font-mono">Loading learning path...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-5xl mx-auto pb-8 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ═══ HERO ═══ */}
      <motion.div variants={itemSlide} className="relative overflow-hidden mb-6">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-[#00f0ff]/[0.04] to-[#ff00e4]/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-xl opacity-20 blur-md" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-xl opacity-40 flex items-center justify-center">
                <span className="text-lg font-bold text-white font-mono">⊕</span>
              </div>
            </div>
            <div>
              {details ? (
                <>
                  <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{details.title}</h1>
                  <p className="text-sm text-white/70 mt-0.5">{details.description}</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Learning Path</h1>
                  <p className="text-sm text-white/70 mt-0.5">Master all 8 CISSP domains with structured study content</p>
                </>
              )}
            </div>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 bg-[#0d1222]/80 border border-[#1e2840] rounded-lg text-[10px] font-mono">
              <span className="text-white/50">Domains </span>
              <span className="text-[#00f0ff]">{stats.completedDomains}/{stats.totalDomains}</span>
            </div>
            <div className="px-3 py-1.5 bg-[#0d1222]/80 border border-[#1e2840] rounded-lg text-[10px] font-mono">
              <span className="text-white/50">Topics </span>
              <span className="text-[#ffb800]">{stats.totalTopics}</span>
            </div>
            <div className="px-3 py-1.5 bg-[#0d1222]/80 border border-[#1e2840] rounded-lg text-[10px] font-mono">
              <span className="text-white/50">Study Time </span>
              <span className="text-[#10b981]">~{totalHours}h</span>
            </div>
            {progress && (
              <div className="px-3 py-1.5 bg-[#0d1222]/80 border border-[#1e2840] rounded-lg text-[10px] font-mono">
                <span className="text-white/50">XP </span>
                <span className="text-[#ff007f]">{progress.totalXp}</span>
              </div>
            )}
          </div>
        </div>

        {details && progress && (
          <div className="flex items-center gap-3 mt-4">
            <div className="px-3 py-1 bg-[#0d1222]/60 rounded text-[10px] font-mono text-[#ffb800]">◆ {progress.totalXp} XP</div>
            <div className="px-3 py-1 bg-[#0d1222]/60 rounded text-[10px] font-mono text-[#00f0ff]">◉ {progress.streak}d streak</div>
          </div>
        )}
      </motion.div>

      {/* ═══ GLOBAL PROGRESS BAR ═══ */}
      <motion.div variants={itemSlide} className="mb-6 p-5 bg-[#0d1222] border border-[#1e2840] rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-white/80 font-mono tracking-wider uppercase">Overall Progress</h2>
          <span className="text-[10px] font-mono text-white/50">{Math.round((stats.completedDomains / stats.totalDomains) * 100)}% complete</span>
        </div>
        <div className="w-full h-2 bg-[#1e2840] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(stats.completedDomains / stats.totalDomains) * 100}%` }}
            transition={{ duration: 1, ease: EASE_OUT }}
            className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] to-[#ff00e4] relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent progress-shimmer-anim" />
          </motion.div>
        </div>
        <div className="flex justify-between mt-2 text-[9px] font-mono text-white/40">
          <span>⊕ {stats.completedDomains} domains mastered</span>
          <span>◆ {stats.totalDomains - stats.completedDomains} remaining</span>
        </div>
      </motion.div>

      {/* ═══ DOMAIN GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {domainContent.map(domain => {
          const status = getDomainStatus(domain.id);
          const colors = DOMAIN_COLORS[domain.id];
          const isSelected = selectedDomain === domain.id;
          const stat = domainStats.find(d => d.domainId === domain.id);

          return (
            <motion.div key={domain.id} variants={itemSlide}>
              <div
                onClick={() => setSelectedDomain(isSelected ? null : domain.id)}
                className={`bg-[#0d1222] border rounded-xl p-5 cursor-pointer transition-all relative overflow-hidden group ${
                  isSelected ? 'border-[#00f0ff]/40' : 'border-[#1e2840]/80 hover:border-[#1e2840]'
                }`}
              >
                {/* Top color accent */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${colors.gradient} opacity-60`} />

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary, borderColor: `${colors.primary}30`, borderWidth: 1 }}
                    >
                      {domain.id}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-tight">{domain.shortName}</h3>
                      <p className="text-[10px] text-white/50 font-mono mt-0.5">{domain.examWeight}% of exam</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono border ${
                    status === 'mastered' ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/25' :
                    status === 'in-progress' ? 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/25' :
                    'bg-[#080b14] text-white/50 border-[#1e2840]/60'
                  }`}>
                    {status === 'mastered' ? '◆ Mastered' : status === 'in-progress' ? '◈ In Progress' : '◯ Not Started'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-white/60 mb-3 leading-relaxed line-clamp-2">{domain.description}</p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#1e2840] rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: stat ? `${Math.max(5, stat.accuracy)}%` : '3%' }}
                    transition={{ duration: 0.6, ease: EASE_OUT }}
                    className="h-full rounded-full relative"
                    style={{ background: stat ? (stat.accuracy >= 80 ? 'linear-gradient(to right, #10b981, #34d399)' : stat.accuracy >= 40 ? 'linear-gradient(to right, #ffb800, #ff6b00)' : colors.gradient) : '#1e2840' }}
                  >
                    {stat && stat.accuracy > 15 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent progress-shimmer-anim" />
                    )}
                  </motion.div>
                </div>

                {/* Topic chips — always visible */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {domain.topics.slice(0, 5).map(topic => (
                    <span
                      key={topic.id}
                      className="text-[9px] px-1.5 py-0.5 rounded border font-mono bg-[#080b14] text-white/60 border-[#1e2840]/60 hover:text-white/80 transition-colors cursor-pointer"
                      onClick={e => { e.stopPropagation(); navigate(`/learn/${domain.id}/${topic.id}`); }}
                    >
                      {topic.title.length > 20 ? topic.title.slice(0, 18) + '…' : topic.title}
                    </span>
                  ))}
                  {domain.topics.length > 5 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono text-white/40 border border-dashed border-[#1e2840]/40">
                      +{domain.topics.length - 5}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/learn/${domain.id}/${domain.topics[0].id}`); }}
                    className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-mono font-medium transition-all"
                    style={{ backgroundColor: `${colors.primary}15`, color: colors.primary, borderColor: `${colors.primary}30`, borderWidth: 1 }}
                  >
                    {status === 'not-started' ? 'Start Learning' : 'Continue →'}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/test?domain=${domain.id}`); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-mono text-white/50 hover:text-white/70 border border-[#1e2840]/80 hover:border-[#1e2840] transition-all"
                  >
                    Practice
                  </button>
                </div>

                {/* Expanded view */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="mt-4 pt-4 border-t border-[#1e2840]/80 overflow-hidden"
                    >
                      <h4 className="text-[10px] font-semibold text-white/60 font-mono uppercase tracking-wider mb-3">All Topics</h4>
                      <div className="space-y-1">
                        {domain.topics.map((topic, idx) => (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/learn/${domain.id}/${topic.id}`); }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1e2840]/40 transition-all text-left group/topic"
                            >
                              <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono bg-[#1e2840]/60 text-white/50 group-hover/topic:bg-[#1e2840] transition-colors">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-white/70 group-hover/topic:text-white/90 transition-colors block truncate">
                                  {topic.title}
                                </span>
                                <span className="text-[9px] text-white/40 font-mono">{topic.subtopics.length} subtopics · {topic.knowledgeCheck.length} questions</span>
                              </div>
                              <span className="text-white/20 group-hover/topic:text-white/60 transition-colors text-xs">→</span>
                            </button>
                          </motion.div>
                        ))}
                      </div>

                      {/* Domain stats */}
                      {stat && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="bg-[#080b14] rounded-lg p-2 text-center">
                            <p className="text-[9px] text-white/40 font-mono">Questions</p>
                            <p className="text-xs font-mono text-white font-bold">{stat.questionsAttempted}</p>
                          </div>
                          <div className="bg-[#080b14] rounded-lg p-2 text-center">
                            <p className="text-[9px] text-white/40 font-mono">Accuracy</p>
                            <p className="text-xs font-mono font-bold" style={{ color: stat.accuracy >= 80 ? '#10b981' : stat.accuracy >= 40 ? '#ffb800' : '#ff6b6b' }}>
                              {Math.round(stat.accuracy)}%
                            </p>
                          </div>
                          <div className="bg-[#080b14] rounded-lg p-2 text-center">
                            <p className="text-[9px] text-white/40 font-mono">Time</p>
                            <p className="text-xs font-mono text-white font-bold">{Math.round(stat.totalTimeSpent / 60)}m</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ MIND MAP TOGGLE ═══ */}
      <motion.div variants={itemSlide} className="mt-6">
        <button
          onClick={() => setMindMapOpen(!mindMapOpen)}
          className="w-full p-4 bg-[#0d1222] border border-[#1e2840]/80 rounded-xl text-left hover:border-[#1e2840] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg text-white/40 group-hover:text-[#00f0ff] transition-colors">⊕</span>
              <div>
                <h3 className="text-sm font-semibold text-white font-mono">Domain Mind Map</h3>
                <p className="text-[10px] text-white/50 font-mono mt-0.5">Interactive visualization of all CISSP domains and topics</p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: mindMapOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/40 text-xs"
            >▼</motion.span>
          </div>
        </button>

        <AnimatePresence>
          {mindMapOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-5 bg-[#0d1222] border border-[#1e2840]/80 rounded-xl">
                <div className="relative min-h-[420px] sm:min-h-[440px] overflow-hidden">
                  {/* Central node */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] flex items-center justify-center shadow-lg shadow-[#00f0ff]/20">
                      <div className="text-center">
                        <div className="text-[9px] sm:text-[10px] font-bold text-white font-mono">CISSP</div>
                        <div className="text-[6px] sm:text-[7px] text-white/70 font-mono">8 Domains</div>
                      </div>
                    </div>
                  </div>

                  {/* Domain nodes arranged in a circle — responsive radius */}
                  {(() => {
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                    const radius = isMobile ? 100 : 150;
                    const nodeSize = isMobile ? 'w-12 h-12' : 'w-14 h-14';
                    const fontSize = isMobile ? 'text-[10px]' : 'text-xs';
                    const labelSize = isMobile ? 'text-[5px]' : 'text-[6px]';
                    return domainContent.map((domain, idx) => {
                      const angle = (idx / domainContent.length) * 2 * Math.PI - Math.PI / 2;
                      // Use percentage-based positioning relative to container center
                      const pctX = 50 + (radius * Math.cos(angle)) / 3.2;
                      const pctY = 50 + (radius * Math.sin(angle)) / 3.2;
                      const colors = DOMAIN_COLORS[domain.id];
                      const status = getDomainStatus(domain.id);

                      return (
                        <div
                          key={domain.id}
                          className="absolute cursor-pointer group/node"
                          style={{ left: `${pctX}%`, top: `${pctY}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.08, duration: 0.3, ease: 'easeOut' }}
                            onClick={() => navigate(`/learn/${domain.id}/${domain.topics[0].id}`)}
                            className={`${nodeSize} rounded-xl flex items-center justify-center border-2 transition-all hover:scale-110 hover:shadow-lg`}
                            style={{
                              backgroundColor: status === 'mastered' ? '#10b98120' : `${colors.primary}15`,
                              borderColor: status === 'mastered' ? '#10b98160' : `${colors.primary}40`,
                            }}
                          >
                            <div className="text-center">
                              <div className={`${fontSize} font-bold font-mono`} style={{ color: colors.primary }}>{domain.id}</div>
                              <div className={`${labelSize} text-white/70 font-mono mt-0.5 leading-tight px-0.5 truncate max-w-[40px]`}>{domain.shortName.split(' ')[0]}</div>
                            </div>
                          </motion.div>
                          {/* Mastered indicator */}
                          {status === 'mastered' && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-[#0d1222]" />
                          )}
                          {/* Topic count */}
                          <div className="text-[6px] sm:text-[7px] text-white/40 font-mono text-center mt-0.5 sm:mt-1">{domain.topics.length} topics</div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#1e2840]/80 text-[9px] font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span className="text-white/60">Mastered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffb800]" />
                    <span className="text-white/60">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1e2840]" />
                    <span className="text-white/60">Not Started</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ RECOMMENDED LEARNING FLOW ═══ */}
      <motion.div variants={itemSlide} className="mt-6">
        <h2 className="text-xs font-semibold text-white/80 font-mono tracking-wider uppercase mb-3">Recommended Study Sequence</h2>
        <div className="bg-[#0d1222] border border-[#1e2840]/80 rounded-xl p-5">
          <p className="text-xs text-white/60 leading-relaxed mb-4">
            CISSP domains build on each other. For best results, study in the recommended order below.
            Each domain includes detailed topics, knowledge checks, and practice questions.
          </p>
          <div className="flex flex-wrap gap-2">
            {domainContent.map((domain, idx) => {
              const colors = DOMAIN_COLORS[domain.id];
              return (
                <button
                  key={domain.id}
                  onClick={() => navigate(`/learn/${domain.id}/${domain.topics[0].id}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }}
                >
                  <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                    {idx + 1}
                  </span>
                  <span className="text-[10px] text-white/70 font-mono">{domain.shortName}</span>
                  {idx < domainContent.length - 1 && (
                    <span className="text-white/20 text-[8px]">→</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default LearningPath;
