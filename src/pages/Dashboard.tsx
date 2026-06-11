import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUserProgress, getAllDomainAnalytics, updateUserProgress } from '../data/database';
import { calculateReadinessScore, calculateConfidenceScore, estimatePassProbability, recommendExamDate } from '../utils/adaptiveTesting';
import { generateRecommendations } from '../utils/recommendations';
import { domains } from '../data/questionBank';
import type { UserProgress, LearningRecommendation } from '../types';

export function Dashboard() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [domainStats, setDomainStats] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [readiness, setReadiness] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [passProb, setPassProb] = useState(0);
  const [examDate, setExamDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const p = await getUserProgress();
    setProgress(p);
    const analytics = await getAllDomainAnalytics();
    setDomainStats(analytics);
    setRecommendations(generateRecommendations(analytics));

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

    // Check streak
    if (p) {
      const today = new Date().toISOString().split('T')[0];
      if (p.lastActiveDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = p.lastActiveDate === yesterday ? p.streak + 1 : 1;
        await updateUserProgress({ streak: newStreak, lastActiveDate: today, totalXp: p.totalXp + 5 });
        setProgress(prev => prev ? { ...prev, streak: newStreak, lastActiveDate: today, totalXp: p.totalXp + 5 } : prev);
      }
    }
  };

  const sortedStats = [...domainStats].sort((a: any, b: any) => a.accuracy - b.accuracy);
  const topWeak = sortedStats.filter((d: any) => d.accuracy < 80).slice(0, 3);

  function getPerformanceLabel(accuracy: number): { label: string; icon: string; color: string; bg: string } {
    if (accuracy < 70) {
      return { label: 'Needs Immediate Attention', icon: '🔴', color: 'text-red-400', bg: 'bg-red-500/10' };
    }
    if (accuracy < 80) {
      return { label: 'Needs Improvement', icon: '🟡', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    }
    return { label: 'Strong Area', icon: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
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

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getReadinessBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const totalAttempted = domainStats.reduce((s, d) => s + d.questionsAttempted, 0);
  const totalCorrect = domainStats.reduce((s, d) => s + d.correctAnswers, 0);

  const quickActions = [
    { label: 'Quick Practice', desc: '10 random questions', icon: '⚡', path: '/test?mode=quick-practice', color: 'from-yellow-500 to-orange-500' },
    { label: 'Weak Area Focus', desc: 'Target your weaknesses', icon: '🎯', path: '/test?mode=weak-area', color: 'from-red-500 to-pink-500' },
    { label: 'Full Exam', desc: 'Simulate the real exam', icon: '📝', path: '/test?mode=full-exam', color: 'from-indigo-500 to-purple-500' },
    { label: 'View Analytics', desc: 'Track your progress', icon: '📊', path: '/analytics', color: 'from-cyan-500 to-blue-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome + Quick Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            Dashboard
          </h1>
          <p className="text-text-muted mt-1">
            {progress?.level === 'beginner' ? 'Building foundations' :
             progress?.level === 'intermediate' ? 'Advancing your knowledge' :
             'Near exam-ready!'} · Level: <span className="text-indigo-400 capitalize">{progress?.level}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-card rounded-xl border border-border">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-text-primary">{progress?.streak || 0}</span>
            <span className="text-text-muted text-sm">day streak</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-card rounded-xl border border-border">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-text-primary">{progress?.totalXp || 0}</span>
            <span className="text-text-muted text-sm">XP</span>
          </div>
        </div>
      </div>

      {/* Readiness Score */}
      <div className="bg-surface-card rounded-2xl border border-border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-sm text-text-muted mb-2">Readiness Score</div>
            <div className={`text-4xl font-bold ${getReadinessColor(readiness)}`}>
              {readiness}
            </div>
            <div className="w-full bg-surface-alt rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${getReadinessBg(readiness)} transition-all duration-500`}
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-text-muted mb-2">Confidence Score</div>
            <div className="text-4xl font-bold text-blue-400">{confidence}</div>
            <div className="w-full bg-surface-alt rounded-full h-2 mt-2">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-text-muted mb-2">Pass Probability</div>
            <div className={`text-4xl font-bold ${passProb >= 70 ? 'text-emerald-400' : passProb >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {passProb}%
            </div>
          </div>
          <div className="text-center lg:border-l border-border lg:pl-6">
            <div className="text-sm text-text-muted mb-2">Questions Answered</div>
            <div className="text-4xl font-bold text-text-primary">{totalAttempted}</div>
            <div className="text-text-muted text-sm mt-1">
              {totalCorrect} correct ({Math.round(totalAttempted > 0 ? totalCorrect/totalAttempted*100 : 0)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <motion.button
              key={action.path}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className={`relative p-5 rounded-xl bg-gradient-to-br ${action.color} text-white text-left overflow-hidden`}
            >
              <div className="relative z-10">
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="font-semibold">{action.label}</div>
                <div className="text-xs opacity-80 mt-1">{action.desc}</div>
              </div>
              <div className="absolute inset-0 bg-black/10" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Focus This Week */}
      {topWeak.length > 0 && (
        <div className="bg-surface-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h2 className="text-base font-semibold text-text-primary">Focus This Week</h2>
          </div>
          <div className="space-y-3">
            {topWeak.map((d: any, idx: number) => {
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
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Domain Performance
          <span className="text-xs font-normal text-text-muted ml-2">Ranked weakest → strongest</span>
        </h2>

        {sortedStats.map((d: any) => {
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
                        {concepts.slice(0, 3).map((c: string) => (
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

      {/* Exam Recommendation */}
      {examDate && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-sm text-gray-400">Exam Recommendation</p>
              <p className="text-white font-medium">{examDate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
