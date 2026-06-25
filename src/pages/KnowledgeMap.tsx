import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { KnowledgeMapSkeleton } from '../components/ui/SkeletonCard';
import { ErrorState } from '../components/ui/ErrorState';
import { fetchDomainAnalytics } from '../data';
import { domains } from '../data/domains';
import type { DomainAnalytics } from '../types';

/* ─── Easing ─────────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;

/* ─── Domain topic map ────────────────────────────────────────────────────── */
const domainTopics: Record<number, string[]> = {
  1: ['CIA Triad', 'Security Governance', 'Risk Management', 'Compliance', 'BCP/DRP', 'Security Policies', 'Due Diligence', 'Ethics'],
  2: ['Data Classification', 'Data Ownership', 'Data Lifecycle', 'Data Retention', 'Data Destruction', 'Privacy', 'Data Sovereignty'],
  3: ['Security Models', 'Architecture Concepts', 'Cryptography', 'Physical Security', 'System Security', 'Evaluation Criteria'],
  4: ['Network Architecture', 'Secure Protocols', 'Network Attacks', 'IDS/IPS', 'VPN', 'Wireless Security', 'Network Segmentation'],
  5: ['Identity Management', 'Access Control Models', 'Authentication', 'SSO/Federation', 'MFA', 'Privileged Access', 'Provisioning'],
  6: ['Vulnerability Assessment', 'Penetration Testing', 'Security Audits', 'SIEM', 'Log Management', 'Compliance Testing'],
  7: ['Incident Response', 'Disaster Recovery', 'Forensics', 'Investigations', 'Monitoring', 'BCP', 'Evidence Handling'],
  8: ['SDLC Security', 'Secure Coding', 'Application Testing', 'OWASP Top 10', 'DevSecOps', 'Code Review'],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};
const itemSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

function getStatusColor(status: string) {
  switch (status) {
    case 'mastered': return { dot: '#10b981', bg: 'bg-[#10b981]/20', text: 'text-[#10b981]', border: 'border-[#10b981]/30' };
    case 'in-progress': return { dot: '#ffb800', bg: 'bg-[#ffb800]/20', text: 'text-[#ffb800]', border: 'border-[#ffb800]/30' };
    default: return { dot: '#1e2840', bg: 'bg-[#080b14]', text: 'text-white/70', border: 'border-[#1e2840]/60' };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   KNOWLEDGE MAP
   ═══════════════════════════════════════════════════════════════════════════ */
export function KnowledgeMap() {

  const [domainStats, setDomainStats] = useState<DomainAnalytics[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const stats = await fetchDomainAnalytics();
      setDomainStats(stats);
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const getDomainStatus = (domainId: number) => {
    const stat = domainStats.find(d => d.domainId === domainId);
    if (!stat || stat.questionsAttempted === 0) return 'not-started';
    if (stat.accuracy >= 80) return 'mastered';
    return 'in-progress';
  };

  const getTopicStatus = (domainId: number, topicIdx: number) => {
    const stat = domainStats.find(d => d.domainId === domainId);
    if (!stat || stat.questionsAttempted === 0) return 'pending';
    if (stat.accuracy >= 80 && topicIdx < 4) return 'completed';
    if (stat.accuracy >= 60) return 'completed';
    if (stat.accuracy >= 40 && topicIdx < 6) return 'completed';
    return 'pending';
  };

  const masterCount = domains.filter(d => getDomainStatus(d.id) === 'mastered').length;
  const inProgCount = domains.filter(d => getDomainStatus(d.id) === 'in-progress').length;

  if (loading) return <KnowledgeMapSkeleton />;
  if (loadError) return <ErrorState message={loadError.message} onRetry={loadData} />;

  return (
    <div className="max-w-5xl mx-auto pb-8 relative">
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
            <div className="absolute -top-10 -right-10 w-36 h-36 opacity-[0.06] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-transparent rounded-full blur-3xl animate-float-delayed" />
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 relative">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-[#ff0066] rounded-xl opacity-20 blur-md animate-breathe" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-[#ff0066] rounded-xl opacity-40 flex items-center justify-center">
                    <span className="text-sm font-bold text-white font-mono">⊕</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold tw-text-primary tracking-tight">Knowledge Map</h1>
                  <p className="text-[11px] text-white/70 mt-0.5 font-mono tracking-wide">
                    <span className="text-[#ff007f]">$</span> knowledge <span className="text-white/70">--domains</span> <span className="text-[#00f2fe]">{domains.length}</span> <span className="text-white/70">--coverage</span> <span className="text-[#10b981]">{masterCount}</span><span className="text-white/70">/</span><span className="text-[#ffb800]">{inProgCount}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ DOMAIN GRID ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {domains.map(domain => {
              const status = getDomainStatus(domain.id);
              const statusInfo = getStatusColor(status);
              const topics = domainTopics[domain.id] || [];
              const stat = domainStats.find(d => d.domainId === domain.id);
              const isSelected = selectedDomain === domain.id;

              return (
                <motion.div
                  key={domain.id}
                  variants={itemSlide}
                  whileHover={{ y: -2, borderColor: isSelected ? 'rgba(0,242,254,0.5)' : 'rgba(0,242,254,0.15)' }}
                  onClick={() => setSelectedDomain(isSelected ? null : domain.id)}
                  className={`tw-card p-5 cursor-pointer transition-all relative overflow-hidden group ${
                    isSelected ? 'border-[#00f2fe]/50' : ''
                  }`}
                >
                  {/* Gradient accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-40 ${
                    status === 'mastered' ? 'from-[#10b981] to-[#34d399]' :
                    status === 'in-progress' ? 'from-[#ffb800] to-[#ff6b00]' : 'from-[#1e2840] to-[#2a3654]'
                  }`} />

                  <div className="flex items-center justify-between mb-3 relative">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full relative"
                        style={{ backgroundColor: statusInfo.dot }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      >
                        <div className="absolute -inset-1 rounded-full opacity-40 blur-sm" style={{ backgroundColor: statusInfo.dot }} />
                      </motion.div>
                      <h3 className="font-semibold tw-text-primary text-sm">{domain.shortName}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                        {status === 'mastered' ? '◆ Mastered' : status === 'in-progress' ? '◈ In Progress' : '◯ Not Started'}
                      </span>
                      {stat && (
                        <span className={`text-[10px] font-mono tabular-nums ${
                          stat.accuracy >= 80 ? 'text-[#00f2fe]' : stat.accuracy >= 60 ? 'text-[#ffb800]' : 'text-[#ff6b6b]'
                        }`}>{Math.round(stat.accuracy)}%</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#1e2840] rounded-full h-1.5 mb-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: stat ? `${Math.max(5, stat.accuracy)}%` : '5%' }}
                      transition={{ duration: 0.6, ease: EASE_OUT }}
                      className={`h-1.5 rounded-full relative ${
                        status === 'mastered' ? 'bg-gradient-to-r from-[#10b981] to-[#34d399]' :
                        status === 'in-progress' ? 'bg-gradient-to-r from-[#ffb800] to-[#ff6b00]' : 'bg-[#1e2840]'
                      }`}
                    >
                      {stat && stat.accuracy > 20 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent progress-shimmer-anim" />
                      )}
                    </motion.div>
                  </div>

                  {/* Topic chips */}
                  <div className="flex flex-wrap gap-1">
                    {topics.map((topic, idx) => {
                      const tStatus = getTopicStatus(domain.id, idx);
                      return (
                        <span key={topic} className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-all ${
                          tStatus === 'completed' ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/25' :
                          'bg-[#080b14] text-white/70 border-[#1e2840]/60'
                        }`}>{topic}</span>
                      );
                    })}
                  </div>

                  {/* Expanded stats */}
                  {isSelected && stat && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="mt-4 pt-4 border-t border-[#1e2840]/80 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Questions', value: stat.questionsAttempted, color: '#ffffff' },
                          { label: 'Correct', value: stat.correctAnswers, color: '#10b981' },
                          { label: 'Accuracy', value: `${Math.round(stat.accuracy)}%`, color: stat.accuracy >= 80 ? '#00f2fe' : stat.accuracy >= 60 ? '#ffb800' : '#ff6b6b' },
                          { label: 'Time', value: `${Math.round(stat.totalTimeSpent / 60)}m`, color: '#8892a9' },
                        ].map((s, i) => (
                          <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <p className="text-[10px] text-white/70 font-mono">{s.label}</p>
                            <p className="text-white font-medium font-mono tabular-nums" style={{ color: s.color }}>{s.value}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* ═══ LEGEND ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card p-4">
              <div className="flex flex-wrap gap-4 text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <motion.div className="w-2.5 h-2.5 rounded-full bg-[#10b981] relative"
                    animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}>
                    <div className="absolute -inset-1 rounded-full bg-[#10b981]/30 blur-sm" />
                  </motion.div>
                  <span className="text-white/70">Mastered</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div className="w-2.5 h-2.5 rounded-full bg-[#ffb800] relative"
                    animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}>
                    <div className="absolute -inset-1 rounded-full bg-[#ffb800]/30 blur-sm" />
                  </motion.div>
                  <span className="text-white/70">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1e2840]" />
                  <span className="text-white/70">Not Started</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 font-mono">topic</span>
                  <span className="text-white/70">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#080b14] text-white/70 border border-[#1e2840]/60 font-mono">topic</span>
                  <span className="text-white/70">Pending</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default KnowledgeMap;
