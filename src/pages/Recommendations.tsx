import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllDomainAnalytics } from '../data/database';
import { generateRecommendations, generateStudySequence } from '../utils/recommendations';
import { domains } from '../data/questionBank';
import type { LearningRecommendation } from '../types';

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [studySequence, setStudySequence] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    const analytics = await getAllDomainAnalytics();
    const recs = generateRecommendations(analytics);
    setRecommendations(recs);
    setStudySequence(generateStudySequence(recs));
  };

  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');

  return (
    <div className="max-w-4xl mx-auto space-y-6">        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">AI Learning Coach</h1>
      <p className="text-text-muted">Personalized recommendations based on your performance</p>

      {/* Study Sequence */}
      {studySequence.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-5">
          <h2 className="font-semibold text-text-primary mb-3">Recommended Study Sequence</h2>
          <div className="flex flex-wrap gap-2">
            {studySequence.map((name, idx) => (
              <div key={name} className="flex items-center gap-1">
                <span className="text-xs px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  {idx + 1}. {name.split(' ').slice(0, 3).join(' ')}
                </span>
                {idx < studySequence.length - 1 && <span className="text-gray-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Practice */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/test?mode=weak-area')}
          className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/20 transition-all"
        >
          🔄 Practice Weak Areas
        </button>
        <button
          onClick={() => navigate('/test?mode=adaptive')}
          className="px-5 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm hover:bg-indigo-500/20 transition-all"
        >
          🧠 Adaptive Learning
        </button>
      </div>

      {/* High Priority */}
      {highPriority.length > 0 && (
        <div>
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            High Priority
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {highPriority.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} priority="high" onPractice={navigate} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority */}
      {mediumPriority.length > 0 && (
        <div>
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Moderate Priority
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {mediumPriority.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} priority="medium" onPractice={navigate} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority */}
      {lowPriority.length > 0 && (
        <div>
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Maintain
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {lowPriority.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} priority="low" onPractice={navigate} />
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 && (
        <div className="text-center py-16 bg-surface-card rounded-xl border border-border">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Start Practicing!</h2>
          <p className="text-text-muted">Complete some practice tests to get personalized recommendations.</p>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ rec, priority, onPractice }: {
  rec: LearningRecommendation;
  priority: string;
  onPractice: (path: string) => void;
}) {
  const colors = priority === 'high' ? 'border-red-500/20 bg-red-500/[0.02]' :
                 priority === 'medium' ? 'border-yellow-500/20 bg-yellow-500/[0.02]' :
                 'border-emerald-500/20 bg-emerald-500/[0.02]';

  const domain = domains.find(d => d.id === rec.domainId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface-card rounded-xl border p-5 ${colors}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-text-primary">{rec.title}</h3>
          <p className="text-sm text-text-muted mt-1">{rec.description}</p>
        </div>
        <button
          onClick={() => onPractice(`/test?mode=domain-wise&domain=${rec.domainId}`)}
          className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm hover:bg-indigo-500/30 transition-all whitespace-nowrap"
        >
          Practice Domain {rec.domainId}
        </button>
      </div>

      {rec.conceptsToReview.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Concepts to review:</p>
          <div className="flex flex-wrap gap-1.5">
            {rec.conceptsToReview.map(c => (
              <span key={c} className="text-xs px-2 py-0.5 bg-surface-alt text-text-secondary rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span>Domain {rec.domainId}: {domain?.shortName}</span>
        <span>•</span>
        <span>Suggested: {rec.suggestedQuestionCount} questions</span>
      </div>
    </motion.div>
  );
}
