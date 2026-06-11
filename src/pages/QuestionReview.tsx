import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../data/database';
import { questions } from '../data/questionBank';

import type { TestSession, UserAnswer } from '../types';

export function QuestionReview() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [incorrectAnswers, setIncorrectAnswers] = useState<(UserAnswer & { question: typeof questions[0] })[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const all = await db.testSessions.toArray();
    setSessions(all.sort((a, b) => b.completedAt! - a.completedAt!));
  };

  const viewSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const incorrect = session.answers
        .filter(a => !a.isCorrect)
        .map(a => ({
          ...a,
          question: questions.find(q => q.id === a.questionId)!,
        }))
        .filter(a => a.question);
      setIncorrectAnswers(incorrect);
    }
  };

  const totalIncorrect = sessions.reduce((sum, s) => sum + s.answers.filter(a => !a.isCorrect).length, 0);
  const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Question Review</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-xl border border-border p-5">
          <p className="text-sm text-text-muted mb-1">Total Tests</p>
          <p className="text-2xl font-bold text-text-primary">{sessions.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-sm text-gray-400 mb-1">Questions</p>
          <p className="text-2xl font-bold text-white">{totalQuestions}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-sm text-gray-400 mb-1">Incorrect</p>
          <p className="text-2xl font-bold text-red-400">{totalIncorrect}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-sm text-gray-400 mb-1">Accuracy</p>
          <p className={`text-2xl font-bold ${totalQuestions > 0 ? (totalQuestions - totalIncorrect) / totalQuestions * 100 >= 70 ? 'text-emerald-400' : 'text-yellow-400' : 'text-gray-500'}`}>
            {totalQuestions > 0 ? Math.round((totalQuestions - totalIncorrect) / totalQuestions * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session List */}
        <div className="lg:col-span-1 bg-surface-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-text-primary mb-4">Test History</h2>
          <div className="space-y-2">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => viewSession(s.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedSession === s.id ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white capitalize">{s.mode.replace('-', ' ')}</span>
                  <span className={`text-sm font-bold ${s.score! >= 70 ? 'text-emerald-400' : s.score! >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {s.score}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {s.correctCount}/{s.totalQuestions} correct
                  </span>
                  <span className="text-xs text-gray-500">
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No tests completed yet</p>
            )}
          </div>
        </div>

        {/* Incorrect Answers */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSession ? (
            incorrectAnswers.length > 0 ? (
              <>
                <h2 className="font-semibold text-white">Incorrect Answers ({incorrectAnswers.length})</h2>
                {incorrectAnswers.map((item, idx) => (
                  <motion.div
                    key={item.questionId + idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl border border-gray-800 p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Incorrect</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">Domain {item.question.domainId}</span>
                      <span className="text-xs text-gray-500">{item.question.type}</span>
                    </div>
                    <p className="text-white text-sm mb-3">{item.question.text}</p>
                    {item.question.scenario && (
                      <p className="text-xs text-gray-400 mb-2 italic">{item.question.scenario}</p>
                    )}
                    <div className="space-y-1.5 mb-3">
                      {item.question.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`p-2 rounded-lg text-sm ${
                            oi === item.question.correctAnswer
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : oi === item.selectedAnswer
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-gray-800/50 text-gray-400'
                          }`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                      <p className="text-xs font-medium text-indigo-400 mb-1">Explanation</p>
                      <p className="text-xs text-gray-300">{item.question.explanation}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.question.concepts.map(c => (
                        <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{c}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="text-center py-12 bg-surface-card rounded-xl border border-border">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-text-muted">Perfect score! No incorrect answers to review.</p>
              </div>
            )
          ) : (
            <div className="text-center py-12 bg-surface-card rounded-xl border border-border">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-text-muted">Select a test from the history to review your answers</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
