import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAllDomainAnalytics } from '../data/database';
import { domains } from '../data/questionBank';
import type { DomainAnalytics } from '../types';

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

export function KnowledgeMap() {
  const [domainStats, setDomainStats] = useState<DomainAnalytics[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const stats = await getAllDomainAnalytics();
    setDomainStats(stats);
  };

  const getDomainStatus = (domainId: number) => {
    const stat = domainStats.find(d => d.domainId === domainId);
    if (!stat || stat.questionsAttempted === 0) return 'not-started';
    if (stat.accuracy >= 80) return 'mastered';
    if (stat.accuracy >= 40) return 'in-progress';
    return 'in-progress';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered': return 'bg-emerald-500';
      case 'in-progress': return 'bg-yellow-500';
      default: return 'bg-gray-700';
    }
  };

  const getTopicStatus = (domainId: number, topicIdx: number) => {
    const stat = domainStats.find(d => d.domainId === domainId);
    if (!stat || stat.questionsAttempted === 0) return 'pending';
    if (stat.accuracy >= 80 && topicIdx < 4) return 'completed';
    if (stat.accuracy >= 60) return 'completed';
    if (stat.accuracy >= 40 && topicIdx < 6) return 'completed';
    return 'pending';
  };

  const getTopicColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'weak': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-800 text-gray-500 border-gray-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Knowledge Map</h1>
      <p className="text-text-muted">Visual overview of your CISSP domain coverage and topic mastery</p>

      {/* Main Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {domains.map(domain => {
          const status = getDomainStatus(domain.id);
          const topics = domainTopics[domain.id] || [];
          const stat = domainStats.find(d => d.domainId === domain.id);

          return (
            <motion.div
              key={domain.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-surface-card rounded-xl border p-5 cursor-pointer transition-all ${
                selectedDomain === domain.id ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-border hover:border-border-hover'
              }`}
              onClick={() => setSelectedDomain(selectedDomain === domain.id ? null : domain.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                  <h3 className="font-semibold text-white text-sm">{domain.shortName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    status === 'mastered' ? 'bg-emerald-500/20 text-emerald-400' :
                    status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {status}
                  </span>
                  {stat && (
                    <span className="text-xs text-gray-500">
                      {Math.round(stat.accuracy)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Overall progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                <div
                  className={`h-1.5 rounded-full ${status === 'mastered' ? 'bg-emerald-500' : status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-600'}`}
                  style={{ width: stat ? `${Math.max(5, stat.accuracy)}%` : '5%' }}
                />
              </div>

              {/* Topics */}
              <div className="flex flex-wrap gap-1.5">
                {topics.map((topic, idx) => {
                  const tStatus = getTopicStatus(domain.id, idx);
                  return (
                    <span
                      key={topic}
                      className={`text-xs px-2 py-0.5 rounded-full border ${getTopicColor(tStatus)}`}
                    >
                      {topic}
                    </span>
                  );
                })}
              </div>

              {/* Expanded stats */}
              {selectedDomain === domain.id && stat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-800"
                >
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400">Questions</p>
                      <p className="text-white font-medium">{stat.questionsAttempted}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Correct</p>
                      <p className="text-white font-medium">{stat.correctAnswers}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Accuracy</p>
                      <p className="text-white font-medium">{Math.round(stat.accuracy)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Time Spent</p>
                      <p className="text-white font-medium">{Math.round(stat.totalTimeSpent / 60)}m</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-surface-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-gray-400">Mastered (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-700" />
            <span className="text-gray-400">Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">topic</span>
            <span className="text-gray-400">Completed Topic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">topic</span>
            <span className="text-gray-400">Pending Topic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
