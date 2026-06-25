import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchDomainAnalytics } from '../data';
import { ErrorState } from '../components/ui/ErrorState';
import { generateRecommendations, generateStudySequence } from '../utils/recommendations';
import { domains } from '../data/domains';
import type { LearningRecommendation } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export function Recommendations() {

  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [studySequence, setStudySequence] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => { loadRecommendations(); }, []);

  const loadRecommendations = async () => {
    try {
      const analytics = await fetchDomainAnalytics();
      const recs = generateRecommendations(analytics);
      setRecommendations(recs);
      setStudySequence(generateStudySequence(recs));
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');

  if (loadError) {
    return <ErrorState message={loadError.message} onRetry={() => { setLoadError(null); loadRecommendations(); }} />;
  }

  return (
    <motion.div className="max-w-4xl mx-auto space-y-6 pb-8" variants={containerVariants} initial="hidden" animate="visible">
      <motion.h1 variants={itemVariants} className="text-xl lg:text-2xl font-bold text-white tracking-tight font-mono">
        <span className="text-[#ff00e4]">◆</span> Learning Coach
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-white/70 font-mono">Personalized recommendations based on your performance</motion.p>

      {studySequence.length > 0 && (
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#00f0ff]/5 to-[#ff00e4]/5 rounded-xl border border-[#00f0ff]/10 p-5">
          <h2 className="text-xs font-semibold text-white mb-3 font-mono">Study Sequence</h2>
          <div className="flex flex-wrap gap-2">
            {studySequence.map((name, idx) => (
              <div key={name} className="flex items-center gap-1">
                <span className="text-[10px] px-2 py-1 bg-[#00f0ff]/10 text-[#00f0ff] rounded font-mono">{idx + 1}. {name.split(' ').slice(0, 3).join(' ')}</span>
                {idx < studySequence.length - 1 && <span className="text-white/70">→</span>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex gap-2">
        <button onClick={() => navigate('/test?mode=weak-area')} className="px-4 py-2 bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/30 rounded-lg text-[10px] font-mono hover:bg-[#ff6b6b]/20 transition-all">
          ⚠ Weak Areas
        </button>
        <button onClick={() => navigate('/test?mode=adaptive')} className="px-4 py-2 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 rounded-lg text-[10px] font-mono hover:bg-[#00f0ff]/20 transition-all">
          ◆ Adaptive
        </button>
      </motion.div>

      {highPriority.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold tw-text-primary mb-3 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b]" /> High Priority
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {highPriority.map(rec => <RecommendationCard key={rec.id} rec={rec} priority="high" onPractice={navigate} />)}
          </div>
        </div>
      )}

      {mediumPriority.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold tw-text-primary mb-3 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800]" /> Moderate Priority
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {mediumPriority.map(rec => <RecommendationCard key={rec.id} rec={rec} priority="medium" onPractice={navigate} />)}
          </div>
        </div>
      )}

      {lowPriority.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold tw-text-primary mb-3 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Maintain
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {lowPriority.map(rec => <RecommendationCard key={rec.id} rec={rec} priority="low" onPractice={navigate} />)}
          </div>
        </div>
      )}

      {recommendations.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-16">
          <div className="text-4xl mb-4 opacity-50">◆</div>
          <h2 className="text-lg font-semibold text-white mb-2 font-mono">Start Practicing!</h2>
          <p className="text-white/70 text-xs font-mono">Complete practice tests to get personalized recommendations.</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function RecommendationCard({ rec, priority, onPractice }: { rec: LearningRecommendation; priority: string; onPractice: (path: string) => void }) {
  const colors = priority === 'high' ? 'border-[#ff6b6b]/20' : priority === 'medium' ? 'border-[#ffb800]/20' : 'border-[#10b981]/20';
  const domain = domains.find(d => d.id === rec.domainId);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`tw-card p-4 ${colors}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold tw-text-primary">{rec.title}</h3>
          <p className="text-xs tw-text-secondary mt-1">{rec.description}</p>
        </div>
        <button onClick={() => onPractice(`/test?mode=domain-wise&domain=${rec.domainId}`)}
          className="px-3 py-1 bg-[#00f0ff]/10 text-[#00f0ff] rounded text-[10px] font-mono hover:bg-[#00f0ff]/20 transition-all whitespace-nowrap">
          D{rec.domainId}
        </button>
      </div>
      {rec.conceptsToReview.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] tw-text-secondary font-mono mb-1.5">Concepts to review:</p>
          <div className="flex flex-wrap gap-1">
            {rec.conceptsToReview.map(c => (
              <span key={c} className="text-[10px] px-2 py-0.5 bg-[#080b14] text-[#8892a9] border border-[#1e2840] rounded font-mono">{c}</span>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-white/70 font-mono">
        <span>D{rec.domainId}: {domain?.shortName}</span>
        <span>·</span>
        <span>{rec.suggestedQuestionCount} questions</span>
      </div>
    </motion.div>
  );
}

export default Recommendations;
