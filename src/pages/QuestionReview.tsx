import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { QuestionReviewSkeleton } from '../components/ui/SkeletonCard';
import { ErrorState } from '../components/ui/ErrorState';
import { db, getSessionAnswers } from '../data/database';
import { loadQuestions } from '../data/questionLoader';
import type { Question, TestSession, UserAnswer } from '../types';

/* ─── Easing ─────────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const itemSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   QUESTION REVIEW
   ═══════════════════════════════════════════════════════════════════════════ */
export function QuestionReview() {

  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<(UserAnswer & { question: Question })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [allSessions, questions] = await Promise.all([
        db.testSessions.toArray(),
        loadQuestions(),
      ]);
      setSessions(allSessions.sort((a, b) => b.completedAt! - a.completedAt!));
      setAllQuestions(questions);
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const viewSession = async (sessionId: string) => {
    setSelectedSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const sessionAnswers = await getSessionAnswers(session.id);
      const incorrect = sessionAnswers.filter(a => !a.isCorrect)
        .map(a => ({ ...a, question: allQuestions.find(q => q.id === a.questionId)! }))
        .filter(a => a.question);
      setIncorrectAnswers(incorrect);
    }
  };

  const [totalStats, setTotalStats] = useState({ totalIncorrect: 0, totalQuestions: 0, overallAccuracy: 0 });

  useEffect(() => {
    loadTotalStats();
  }, [sessions]);

  const loadTotalStats = async () => {
    let totalIncorrect = 0;
    let totalQuestions = 0;
    for (const s of sessions) {
      totalQuestions += s.totalQuestions;
      const sessionAnswers = await getSessionAnswers(s.id);
      totalIncorrect += sessionAnswers.filter(a => !a.isCorrect).length;
    }
    const overallAccuracy = totalQuestions > 0 ? Math.round(((totalQuestions - totalIncorrect) / totalQuestions) * 100) : 0;
    setTotalStats({ totalIncorrect, totalQuestions, overallAccuracy });
  };

  if (loading) return <QuestionReviewSkeleton />;
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
            <div className="absolute -top-10 -left-10 w-36 h-36 opacity-[0.06] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] to-transparent rounded-full blur-3xl animate-float-delayed" />
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 relative">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] to-[#ff007f] rounded-xl opacity-20 blur-md animate-breathe" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] to-[#ff007f] rounded-xl opacity-40 flex items-center justify-center">
                    <span className="text-sm font-bold text-white font-mono">◎</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold tw-text-primary tracking-tight">Question Review</h1>
                  <p className="text-[11px] text-white/70 mt-0.5 font-mono tracking-wide">
                    <span className="text-[#ff6b6b]">$</span> review <span className="text-white/70">--history</span> <span className="text-[#00f2fe]">{sessions.length}</span> <span className="text-white/70">--incorrect</span> <span className="text-[#ff6b6b]">{totalStats.totalIncorrect}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ STAT CARDS ═══ */}
          <motion.div variants={itemSlide} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Tests', value: sessions.length, color: '#ffffff', gradient: 'from-[#00f2fe] to-[#4facfe]' },
              { label: 'Questions', value: totalStats.totalQuestions, color: '#ffffff', gradient: 'from-[#00f2fe] to-[#ff007f]' },
              { label: 'Incorrect', value: totalStats.totalIncorrect, color: '#ff6b6b', gradient: 'from-[#ff6b6b] to-[#ff007f]' },
              { label: 'Accuracy', value: `${totalStats.overallAccuracy}%`, color: totalStats.overallAccuracy >= 70 ? '#00f2fe' : totalStats.overallAccuracy >= 50 ? '#ffb800' : '#ff6b6b', gradient: totalStats.overallAccuracy >= 70 ? 'from-[#00f2fe] to-[#4facfe]' : 'from-[#ffb800] to-[#ff6b00]' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease: EASE_OUT }}
                whileHover={{ y: -3, borderColor: 'rgba(0,242,254,0.2)' }}
                className="tw-card p-4 relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.gradient} opacity-40`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <p className="text-[10px] text-white/70 font-mono mb-1 relative">{stat.label}</p>
                <p className="text-xl font-bold font-mono tabular-nums relative" style={{ color: stat.color }}>{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ═══ MAIN LAYOUT: Sidebar + Content ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Test History Sidebar */}
            <motion.div variants={itemSlide} className="lg:col-span-1">
              <div className="tw-card p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#ff007f] opacity-20" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-4 bg-[#ff6b6b] rounded-full" />
                  <h2 className="text-xs font-semibold tw-text-primary font-mono tracking-wide">Test History</h2>
                </div>
                <div className="space-y-1.5">
                  {sessions.map(s => (
                    <motion.button
                      key={s.id}
                      whileHover={{ x: 2 }}
                      whileTap={SPRING_TAP}
                      onClick={() => viewSession(s.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedSession === s.id
                          ? 'bg-[#00f2fe]/10 border border-[#00f2fe]/25 shadow-[0_0_8px_rgba(0,242,254,0.06)]'
                          : 'bg-[#080b14]/80 border border-transparent hover:bg-[#0d1222]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white font-mono capitalize tracking-wide">{s.mode.replace('-', ' ')}</span>
                        <span className={`text-xs font-bold font-mono tabular-nums ${
                          s.score! >= 70 ? 'text-[#00f2fe]' : s.score! >= 50 ? 'text-[#ffb800]' : 'text-[#ff6b6b]'
                        }`}>{s.score}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-white/70 font-mono">{s.correctCount}/{s.totalQuestions} correct</span>
                        <span className="text-[10px] text-white/70 font-mono">·</span>
                        <span className="text-[10px] text-white/70 font-mono">{s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ''}</span>
                      </div>
                    </motion.button>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-white/70 text-xs font-mono text-center py-6">No tests completed yet</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Answer Review Content */}
            <motion.div variants={itemSlide} className="lg:col-span-2 space-y-3">
              {selectedSession ? (
                incorrectAnswers.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1 h-4 bg-[#ff6b6b] rounded-full" />
                      <h2 className="text-xs font-semibold text-white font-mono tracking-wide">
                        Incorrect Answers <span className="text-white/70 font-normal">({incorrectAnswers.length})</span>
                      </h2>
                    </div>
                    {incorrectAnswers.map((item, idx) => {
                      const questionId = item.question?.id || item.questionId;
                      return (
                        <motion.div
                          key={`${questionId}-${idx}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="tw-card p-5 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff6b6b] to-[#ff007f] opacity-30" />

                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/25 font-mono">Incorrect</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/25 font-mono">D{item.question.domainId}</span>
                            {item.question.difficulty && (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                                item.question.difficulty === 'easy' ? 'bg-[#10b981]/12 text-[#10b981] border-[#10b981]/25' :
                                item.question.difficulty === 'medium' ? 'bg-[#ffb800]/12 text-[#ffb800] border-[#ffb800]/25' : 'bg-[#ff6b6b]/12 text-[#ff6b6b] border-[#ff6b6b]/25'
                              }`}>{item.question.difficulty}</span>
                            )}
                          </div>

                          <p className="text-sm text-white mb-3 leading-relaxed">{item.question.text}</p>
                          {item.question.scenario && (
                            <p className="text-[10px] text-white/70 mb-3 italic font-mono border-l-2 border-[#1e2840] pl-3">{item.question.scenario}</p>
                          )}

                          {/* Options */}
                          <div className="space-y-1 mb-3">
                            {item.question.options.map((opt, oi) => {
                              const isCorrect = oi === item.question.correctAnswer;
                              const isUserChoice = oi === item.selectedAnswer;
                              return (
                                <div key={oi} className={`p-2.5 rounded-lg text-xs border ${
                                  isCorrect
                                    ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                                    : isUserChoice
                                      ? 'bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/30'
                                      : 'bg-[#080b14] text-white/70 border-[#1e2840]/60'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold font-mono ${
                                      isCorrect ? 'bg-[#10b981] text-white' : isUserChoice ? 'bg-[#ff6b6b] text-white' : 'bg-[#1e2840] text-white/70'
                                    }`}>
                                      {isCorrect ? '✓' : isUserChoice ? '✕' : String.fromCharCode(65 + oi)}
                                    </span>
                                    <span className={isCorrect || isUserChoice ? 'text-white' : ''}>{opt}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          <div className="p-3.5 bg-[#00f2fe]/5 rounded-lg border border-[#00f2fe]/15">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-medium text-[#00f2fe] font-mono tracking-wider uppercase">Explanation</span>
                            </div>
                            <p className="text-xs text-[#8892a9] leading-relaxed">{item.question.explanation}</p>
                          </div>

                          {/* Concepts */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.question.concepts.map(c => (
                              <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-[#080b14] text-white/70 border border-[#1e2840]/60 font-mono">{c}</span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </>
                ) : (
                  <div className="tw-card p-12 text-center">
                    <div className="relative w-14 h-14 mx-auto mb-3">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#10b981] to-[#34d399] rounded-full opacity-20 blur-xl animate-breathe" />
                      <span className="relative text-3xl block text-center">🎉</span>
                    </div>
                    <p className="text-[#00f2fe] text-sm font-mono">Perfect score! No incorrect answers.</p>
                  </div>
                )
              ) : (
                <div className="tw-card p-12 text-center">
                  <div className="relative w-12 h-12 mx-auto mb-3">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] to-[#ff007f] rounded-full opacity-20 blur-md animate-breathe" />
                    <span className="relative text-2xl block text-center text-white/70">◎</span>
                  </div>
                  <p className="text-white/70 text-xs font-mono">Select a test to review answers</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default QuestionReview;
