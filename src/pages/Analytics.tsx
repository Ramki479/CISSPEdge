import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import { getAllDomainAnalytics } from '../data/database';
import { calculateOverallStats } from '../utils/analytics';
import { generateRecommendations } from '../utils/recommendations';
import { domains } from '../data/questionBank';
import type { DomainAnalytics, LearningRecommendation } from '../types';

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

function getPerformanceLabel(accuracy: number): { label: string; icon: string; color: string; bg: string; textClass: string } {
  if (accuracy < 70) {
    return {
      label: 'Needs Immediate Attention',
      icon: '🔴',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      textClass: 'text-red-400',
    };
  }
  if (accuracy < 80) {
    return {
      label: 'Needs Improvement',
      icon: '🟡',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      textClass: 'text-yellow-400',
    };
  }
  return {
    label: 'Strong Area',
    icon: '🟢',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
  };
}

function getReadinessStatus(score: number): { label: string; icon: string; color: string; tip: string } {
  if (score >= 80) {
    return { label: 'Exam Ready', icon: '🏆', color: 'text-emerald-400', tip: 'Great shape! Maintain with mock exams.' };
  }
  if (score >= 60) {
    return { label: 'Moderate', icon: '⚠️', color: 'text-yellow-400', tip: 'Focus on weakest 3 domains before taking full mock exams.' };
  }
  if (score >= 40) {
    return { label: 'Needs Work', icon: '📚', color: 'text-orange-400', tip: 'Build fundamentals in low-scoring domains first.' };
  }
  return { label: 'Getting Started', icon: '🌱', color: 'text-red-400', tip: 'Complete more practice questions to assess readiness.' };
}

function getDomainConcepts(domainId: number): string[] {
  const map: Record<number, string[]> = {
    1: ['Risk assessment methodologies', 'Security governance frameworks', 'Compliance and legal requirements', 'Business continuity planning', 'Policy development'],
    2: ['Data classification standards', 'Asset management lifecycle', 'Privacy controls', 'Data retention & destruction', 'Information ownership'],
    3: ['Security architecture models', 'Cryptography fundamentals', 'Physical security controls', 'System evaluation criteria', 'Secure design principles'],
    4: ['Network segmentation', 'Secure protocols (TLS, IPsec)', 'Intrusion detection/prevention', 'Wireless security', 'Network monitoring'],
    5: ['Access control models', 'Authentication mechanisms', 'Identity federation (SAML, OIDC)', 'Privileged access management', 'MFA implementation'],
    6: ['Vulnerability assessment', 'Penetration testing', 'Security audit procedures', 'SIEM and log analysis', 'Controls testing'],
    7: ['Incident response lifecycle', 'Disaster recovery planning', 'Digital forensics', 'Business continuity', 'Evidence handling'],
    8: ['Secure SDLC', 'OWASP Top 10', 'Code review practices', 'Application security testing', 'DevSecOps principles'],
  };
  return map[domainId] || [];
}

export function Analytics() {
  const [domainStats, setDomainStats] = useState<DomainAnalytics[]>([]);
  const [overall, setOverall] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const stats = await getAllDomainAnalytics();
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

      if (!hasRealData) {
        setTrend(FALLBACK_DATA);
      } else {
        setTrend(chartData);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setTrend(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  };

  // Sort domains by accuracy ascending (weakest first)
  const sortedStats = [...domainStats].sort((a, b) => a.accuracy - b.accuracy);
  const topWeak = sortedStats.filter(d => d.accuracy < 80).slice(0, 3);
  const domainColors = domains.map(d => d.color);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="min-h-[400px] bg-surface-card rounded-2xl border border-border flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">📊</div>
            <p className="text-text-muted">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  const hasRealData = domainStats.some(d => d.questionsAttempted > 0);

  if (!hasRealData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Analytics</h1>
        <div className="bg-surface-card rounded-2xl border border-border p-8 lg:p-12 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">No Data Yet</h2>
          <p className="text-text-muted max-w-md text-sm lg:text-base">
            Complete practice questions to see your domain accuracy analytics, personalized study recommendations, and performance breakdown.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/test?mode=quick-practice')}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors cursor-pointer text-sm"
            >
              Start Quick Practice
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-6 py-3 bg-surface-alt hover:bg-surface-hover text-text-secondary rounded-xl font-medium transition-colors cursor-pointer text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        {/* Preview charts (collapsed by default) */}
        <div className="bg-surface-card rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="w-full p-4 flex items-center justify-between text-text-primary hover:bg-surface-hover/30 transition-colors"
          >
            <span className="text-sm font-medium">Sample Analytics Preview</span>
            <motion.span
              animate={{ rotate: showCharts ? 180 : 0 }}
              className="text-text-muted text-sm"
            >
              ▼
            </motion.span>
          </button>
          <AnimatePresence>
            {showCharts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-border space-y-4">
                  <span className="text-xs text-text-muted bg-surface-alt px-3 py-1 rounded-full inline-block">Sample data</span>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={FALLBACK_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="domain" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#6B7280' }} />
                      <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }} />
                      <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                        {FALLBACK_DATA.map((_entry, index) => (
                          <Cell key={index} fill={domainColors[index % domainColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-center text-xs text-text-muted">Start answering questions to see your actual performance.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Main analytics view ──
  return (
    <div className="max-w-2xl mx-auto space-y-5 lg:space-y-6 pb-8">
      <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Analytics</h1>

      {/* CISSP Readiness Card */}
      {overall && (
        <div className="bg-surface-card rounded-2xl border border-border p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide font-medium">CISSP Readiness</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl lg:text-5xl font-bold text-text-primary">{overall.readinessScore}</span>
                <span className="text-lg text-text-muted">/100</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm font-medium ${getReadinessStatus(overall.readinessScore).color}`}>
                  {getReadinessStatus(overall.readinessScore).icon} {getReadinessStatus(overall.readinessScore).label}
                </span>
              </div>
            </div>
            <div className="relative w-20 h-20 lg:w-24 lg:h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={`${overall.readinessScore} ${100 - overall.readinessScore}`}
                  strokeLinecap="round"
                  className={
                    overall.readinessScore >= 80 ? 'text-emerald-400' :
                    overall.readinessScore >= 60 ? 'text-yellow-400' :
                    overall.readinessScore >= 40 ? 'text-orange-400' : 'text-red-400'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-text-primary">{overall.readinessScore}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3 leading-relaxed">
            {getReadinessStatus(overall.readinessScore).tip}
          </p>

          {/* Mini stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{overall.totalAttempted}</p>
              <p className="text-xs text-text-muted">Questions</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{overall.totalCorrect}</p>
              <p className="text-xs text-text-muted">Correct</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${overall.overallPercentage >= 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {overall.overallPercentage}%
              </p>
              <p className="text-xs text-text-muted">Accuracy</p>
            </div>
          </div>
        </div>
      )}

      {/* Focus This Week Card */}
      {topWeak.length > 0 && (
        <div className="bg-surface-card rounded-2xl border border-border p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h2 className="text-base font-semibold text-text-primary">Focus This Week</h2>
          </div>
          <div className="space-y-3">
            {topWeak.map((d, idx) => {
              const domain = domains.find(dm => dm.id === d.domainId);
              const perf = getPerformanceLabel(d.accuracy);
              return (
                <div key={d.domainId} className="flex items-center justify-between p-3 rounded-xl bg-surface-alt/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-card flex items-center justify-center text-xs font-bold text-text-muted">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{domain?.shortName}</p>
                      <p className={`text-xs ${perf.color}`}>{Math.round(d.accuracy)}%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Practice
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranked Domain Accuracy Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary px-1">
          Domain Accuracy
          <span className="text-xs font-normal text-text-muted ml-2">Ranked weakest → strongest</span>
        </h2>

        {sortedStats.map(d => {
          const domain = domains.find(dm => dm.id === d.domainId);
          const perf = getPerformanceLabel(d.accuracy);
          const rec = recommendations.find(r => r.domainId === d.domainId);
          const isWeak = d.accuracy < 80;
          const concepts = getDomainConcepts(d.domainId);

          return (
            <motion.div
              key={d.domainId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-4 lg:p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: domain?.color }}
                      />
                      <h3 className="text-sm lg:text-base font-semibold text-text-primary truncate">
                        {domain?.shortName || `Domain ${d.domainId}`}
                      </h3>
                    </div>
                    {d.questionsAttempted > 0 && (
                      <p className="text-xs text-text-muted mt-0.5 ml-[18px]">
                        {d.correctAnswers} of {d.questionsAttempted} correct · {Math.round(d.totalTimeSpent / 60)}m spent
                      </p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 ml-3 text-xl lg:text-2xl font-bold tabular-nums ${
                    d.accuracy >= 80 ? 'text-emerald-400' :
                    d.accuracy >= 70 ? 'text-yellow-400' :
                    d.accuracy >= 60 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {Math.round(d.accuracy)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-surface-alt rounded-full h-2.5 mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(d.accuracy)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-2.5 rounded-full ${
                      d.accuracy >= 80 ? 'bg-emerald-500' :
                      d.accuracy >= 70 ? 'bg-yellow-500' :
                      d.accuracy >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                  />
                </div>

                {/* Performance label */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${perf.bg} ${perf.color} mb-3`}>
                  <span>{perf.icon}</span>
                  <span>{perf.label}</span>
                </div>

                {/* Study recommendations for weak domains */}
                {isWeak && (
                  <div className="mb-3 p-3 rounded-xl bg-surface-alt/50 border border-border">
                    <p className="text-xs font-medium text-text-secondary mb-1.5">Recommendation</p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {rec?.description || `Focus on ${domain?.shortName} concepts to improve your score.`}
                    </p>
                    {concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {concepts.slice(0, 3).map(c => (
                          <span key={c} className="text-xs px-2 py-0.5 rounded-md bg-surface-card text-text-muted">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={() => navigate(`/test?mode=domain-wise&domain=${d.domainId}`)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isWeak
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-surface-alt hover:bg-surface-hover text-text-primary border border-border'
                  }`}
                >
                  {isWeak ? 'Practice Now' : 'Review'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Strengths & Weaknesses summary */}
      {overall && (overall.strengths.length > 0 || overall.weaknesses.length > 0) && (
        <div className="bg-surface-card rounded-2xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-3">Summary</h2>
          <div className="space-y-3">
            {overall.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-400 mb-2">✅ Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {overall.strengths.map((s: string) => (
                    <span key={s} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {overall.weaknesses.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-400 mb-2">⚠️ Areas for Improvement</p>
                <div className="flex flex-wrap gap-2">
                  {overall.weaknesses.map((w: string) => (
                    <span key={w} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Detailed Charts */}
      <div className="bg-surface-card rounded-2xl border border-border overflow-hidden">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="w-full p-4 flex items-center justify-between text-text-primary hover:bg-surface-hover/30 transition-colors"
        >
          <span className="text-sm font-medium">View Detailed Analytics</span>
          <motion.span
            animate={{ rotate: showCharts ? 180 : 0 }}
            className="text-text-muted text-sm"
          >
            ▼
          </motion.span>
        </button>
        <AnimatePresence>
          {showCharts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 lg:p-5 border-t border-border space-y-5">
                {/* Radar Chart */}
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Domain Performance Radar</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={trend}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="domain" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} />
                      <Radar name="Accuracy" dataKey="accuracy" stroke="#818CF8" fill="#818CF8" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Domain Accuracy Comparison</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={trend} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="domain" tick={{ fill: '#9CA3AF', fontSize: 9 }} axisLine={{ stroke: '#374151' }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#6B7280' }} axisLine={{ stroke: '#374151' }} />
                      <Tooltip
                        contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                      />
                      <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} minPointSize={2}>
                        {trend.map((entry: any, index: number) => (
                          <Cell
                            key={index}
                            fill={entry.accuracy > 0 ? domainColors[index % domainColors.length] : '#4B5563'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Domain Breakdown Table */}
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Domain Breakdown</h3>
                  <div className="overflow-x-auto -mx-4 lg:-mx-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-xs text-text-muted font-medium">Domain</th>
                          <th className="text-center p-3 text-xs text-text-muted font-medium">Accuracy</th>
                          <th className="text-center p-3 text-xs text-text-muted font-medium">Q's</th>
                          <th className="text-center p-3 text-xs text-text-muted font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domainStats.map(d => {
                          const domain = domains.find(dm => dm.id === d.domainId);
                          return (
                            <tr key={d.domainId} className="border-b border-border/50 hover:bg-surface-hover/30">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: domain?.color }} />
                                  <span className="text-xs text-text-primary">{domain?.shortName}</span>
                                </div>
                              </td>
                              <td className="text-center p-3">
                                <span className={`text-xs font-bold ${
                                  d.accuracy >= 80 ? 'text-emerald-400' :
                                  d.accuracy >= 70 ? 'text-yellow-400' :
                                  d.accuracy >= 60 ? 'text-orange-400' : 'text-red-400'
                                }`}>
                                  {Math.round(d.accuracy)}%
                                </span>
                              </td>
                              <td className="text-center p-3 text-xs text-text-secondary">{d.questionsAttempted}</td>
                              <td className="text-center p-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  d.classification === 'strong' ? 'bg-emerald-500/20 text-emerald-400' :
                                  d.classification === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                  d.classification === 'weak' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {d.classification}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
