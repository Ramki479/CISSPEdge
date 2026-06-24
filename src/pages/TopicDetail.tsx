import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { domainContent, getTopic } from '../data/learningContent';
import type { LearningTopic } from '../data/learningContent';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;

/* ─── Animated progress bar ──────────────────────────────────────────────── */
function SectionProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-mono">
      <span className="text-white/40 whitespace-nowrap">
        Progress: <span className="text-[#00f0ff]">{current + 1}</span> of {total} Topics
      </span>
      <div className="flex-1 h-1.5 bg-[#1e2840] rounded-full overflow-hidden max-w-[200px]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ff00e4] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((current + 1) / total) * 100}%` }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>
      <span className="text-white/30 text-[10px]">
        {Math.round(((current + 1) / total) * 100)}%
      </span>
    </div>
  );
}

/* ─── Bookmark button ────────────────────────────────────────────────────── */
function BookmarkButton({ bookmarked, onToggle }: { bookmarked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all ${
        bookmarked
          ? 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/25'
          : 'text-white/40 border-[#1e2840]/80 hover:text-white/60 hover:border-[#1e2840]'
      }`}
    >
      {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
    </button>
  );
}

/* ─── Notes popover ──────────────────────────────────────────────────────── */
function NotesPopover({ topicId, onSave }: { topicId: string; onSave: (note: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(`note-${topicId}`) || ''; } catch { return ''; }
  });

  const handleSave = () => {
    try { localStorage.setItem(`note-${topicId}`, text); } catch {}
    onSave(text);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) handleSave(); }}
        className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-[#1e2840]/80 text-white/40 hover:text-white/60 hover:border-[#1e2840] transition-all"
      >
        {text ? '◇ Notes' : '◇ Add Note'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-2 w-72 z-50"
          >
            <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-3 shadow-xl">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write your notes here..."
                className="w-full h-24 bg-[#080b14] border border-[#1e2840]/60 rounded-lg p-2 text-xs text-white/70 font-mono resize-none focus:outline-none focus:border-[#00f0ff]/30 placeholder:text-white/20"
              />
              <button
                onClick={() => { handleSave(); setOpen(false); }}
                className="mt-2 w-full px-2 py-1.5 bg-[#00f0ff]/15 text-[#00f0ff] text-[10px] font-mono rounded-lg border border-[#00f0ff]/20 hover:bg-[#00f0ff]/20 transition-all"
              >
                Save Note
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOPIC DETAIL PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export function TopicDetail() {
  const { domainId: domainIdParam, topicId } = useParams<{ domainId: string; topicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionParam = searchParams.get('section');

  const domainId = Number(domainIdParam || 0);
  const topic = useMemo(() => getTopic(domainId, topicId || ''), [domainId, topicId]);

  /* ─── Section navigation ─────────────────────────────────────────────── */
  const sections = useMemo(() => {
    if (!topic) return [];
    return [
      { id: 'overview', label: 'Overview', icon: '◉' },
      { id: 'whyItMatters', label: 'Why It Matters', icon: '◆' },
      { id: 'cisspFocus', label: 'CISSP Focus', icon: '◈' },
      { id: 'keyConcepts', label: 'Key Concepts', icon: '⊕' },
      { id: 'examples', label: 'Examples', icon: '▸' },
      { id: 'commonMistakes', label: 'Common Mistakes', icon: '⊘' },
      { id: 'examTips', label: 'Exam Tips', icon: '◐' },
      { id: 'keyTakeaways', label: 'Key Takeaways', icon: '◎' },
      { id: 'knowledgeCheck', label: 'Knowledge Check', icon: '◇' },
    ];
  }, [topic]);

  const [currentSection, setCurrentSection] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  const domain = useMemo(() => domainContent.find(d => d.id === domainId), [domainId]);
  const currentTopicIndex = useMemo(() => {
    if (!domain || !topic) return -1;
    return domain.topics.findIndex(t => t.id === topic.id);
  }, [domain, topic]);
  const prevTopic = useMemo(() => {
    if (!domain || currentTopicIndex <= 0) return null;
    return domain.topics[currentTopicIndex - 1];
  }, [domain, currentTopicIndex]);
  const nextTopic = useMemo(() => {
    if (!domain || currentTopicIndex < 0 || currentTopicIndex >= domain.topics.length - 1) return null;
    return domain.topics[currentTopicIndex + 1];
  }, [domain, currentTopicIndex]);

  /* ─── Redirect if invalid ────────────────────────────────────────────── */
  useEffect(() => {
    if (!topic && domainId) { navigate('/learn', { replace: true }); }
  }, [topic, domainId]);

  /* ─── Section param override ─────────────────────────────────────────── */
  useEffect(() => {
    if (sectionParam) {
      const idx = sections.findIndex(s => s.id === sectionParam);
      if (idx >= 0) setCurrentSection(idx);
    }
  }, [sectionParam, sections]);

  /* ─── Bookmark persistence ───────────────────────────────────────────── */
  useEffect(() => {
    if (!topic) return;
    try {
      const stored = localStorage.getItem(`bookmark-${topic.id}`);
      setBookmarked(stored === 'true');
    } catch {}
  }, [topic?.id]);

  const toggleBookmark = useCallback(() => {
    if (!topic) return;
    const next = !bookmarked;
    setBookmarked(next);
    try { localStorage.setItem(`bookmark-${topic.id}`, String(next)); } catch {}
  }, [bookmarked, topic?.id]);

  /* ─── Quiz handlers ──────────────────────────────────────────────────── */
  const handleQuizAnswer = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const quizScore = useMemo(() => {
    if (!topic || !quizSubmitted) return null;
    const total = topic.knowledgeCheck.length;
    const correct = topic.knowledgeCheck.filter((q, i) => quizAnswers[i] === q.correctAnswer).length;
    return { total, correct, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }, [topic, quizAnswers, quizSubmitted]);

  /* ─── Flashcard data ─────────────────────────────────────────────────── */
  const flashcards = useMemo(() => {
    if (!topic) return [];
    return [
      ...topic.keyConcepts.map((c, i) => ({ front: `Key Concept ${i + 1}`, back: c })),
      ...topic.examTips.map((t, i) => ({ front: `Exam Tip ${i + 1}`, back: t })),
      ...topic.keyTakeaways.map((t, i) => ({ front: `Takeaway ${i + 1}`, back: t })),
    ];
  }, [topic]);

  /* ─── Loading / Not Found ────────────────────────────────────────────── */
  if (!topic) {
    return (
      <div className="min-h-screen bg-[#080b14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-white/70 font-mono">Topic not found</p>
          <button onClick={() => navigate('/learn')} className="mt-4 px-4 py-2 bg-[#00f0ff]/15 text-[#00f0ff] text-xs font-mono rounded-lg border border-[#00f0ff]/20">
            ← Back to Learning Path
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ═══ HEADER ═══ */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 mb-3">
          <button onClick={() => navigate('/learn')} className="hover:text-white/60 transition-colors">Learn</button>
          <span>/</span>
          <button onClick={() => navigate('/learn')} className="hover:text-white/60 transition-colors">{domain?.shortName || `Domain ${domainId}`}</button>
          <span>/</span>
          <span className="text-white/60 truncate max-w-[200px]">{topic.title}</span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight break-words leading-tight max-w-full">{topic.title}</h1>
            <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/50 font-mono mt-2">
              {topic.subtopics.map((s, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <BookmarkButton bookmarked={bookmarked} onToggle={toggleBookmark} />
            <NotesPopover topicId={topic.id} onSave={() => {}} />
            <button
              onClick={() => setFlashcardMode(!flashcardMode)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all ${
                flashcardMode
                  ? 'bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/25'
                  : 'text-white/40 border-[#1e2840]/80 hover:text-white/60'
              }`}
            >
              {flashcardMode ? '◐ Exit Flashcards' : '◐ Flashcards'}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 mb-2">
          <SectionProgress current={currentSection} total={sections.length} />
        </div>
      </div>

      {/* ═══ FLASHCARD MODE (overlay) ═══ */}
      <AnimatePresence>
        {flashcardMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-white/80 font-mono">Flashcards</h2>
                <span className="text-[10px] font-mono text-white/40">{flashcardIndex + 1}/{flashcards.length}</span>
              </div>

              {flashcards.length > 0 ? (
                <>
                  {/* Card */}
                  <motion.div
                    className="relative cursor-pointer min-h-[160px] flex items-center justify-center"
                    onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div
                      className={`w-full min-h-[140px] rounded-xl flex items-center justify-center p-6 transition-all duration-300 ${
                        flashcardFlipped
                          ? 'bg-gradient-to-br from-[#8b5cf6]/10 to-[#a78bfa]/5 border border-[#8b5cf6]/20'
                          : 'bg-gradient-to-br from-[#00f0ff]/5 to-[#ff00e4]/5 border border-[#1e2840]'
                      }`}
                    >
                      <p className="text-sm text-white/80 text-center leading-relaxed max-w-lg">
                        {flashcardFlipped ? flashcards[flashcardIndex].back : flashcards[flashcardIndex].front}
                      </p>
                    </div>
                    <div className="absolute bottom-3 right-3 text-[8px] text-white/20 font-mono">
                      {flashcardFlipped ? 'Answer' : 'Question'} · Click to flip
                    </div>
                  </motion.div>

                  {/* Navigation */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                      onClick={() => { setFlashcardIndex(Math.max(0, flashcardIndex - 1)); setFlashcardFlipped(false); }}
                      disabled={flashcardIndex === 0}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-[#1e2840]/80 text-white/40 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                      className="px-4 py-1.5 rounded-lg bg-[#8b5cf6]/15 text-[#8b5cf6] text-[10px] font-mono border border-[#8b5cf6]/20 hover:bg-[#8b5cf6]/20 transition-all"
                    >
                      {flashcardFlipped ? '◐ Show Question' : '◐ Show Answer'}
                    </button>
                    <button
                      onClick={() => { setFlashcardIndex(Math.min(flashcards.length - 1, flashcardIndex + 1)); setFlashcardFlipped(false); }}
                      disabled={flashcardIndex === flashcards.length - 1}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-[#1e2840]/80 text-white/40 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next →
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-xs text-white/40 font-mono py-8">No flashcards available for this topic.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION TABS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-6">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => setCurrentSection(idx)}
            className={`px-3 py-2 rounded-lg text-[10px] font-mono border transition-all text-left ${
              idx === currentSection
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/25'
                : 'text-white/50 border-[#1e2840]/60 hover:text-white/70 hover:border-[#1e2840]'
            }`}
          >
            <span className="inline-block min-w-[12px]">{section.icon}</span>{' '}
            <span className="break-words">{section.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ CONTENT SECTIONS ═══ */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            {/* ─── Overview ─────────────────────────────────────────────── */}
            {currentSection === 0 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#00f0ff]">◉</span>
                  <h2 className="text-sm font-semibold text-white font-mono">Topic Overview</h2>
                </div>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{topic.overview}</p>
              </div>
            )}

            {/* ─── Why It Matters ────────────────────────────────────────── */}
            {currentSection === 1 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#ffb800]">◆</span>
                  <h2 className="text-sm font-semibold text-white font-mono">Why It Matters</h2>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{topic.whyItMatters}</p>
              </div>
            )}

            {/* ─── CISSP Focus ───────────────────────────────────────────── */}
            {currentSection === 2 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#8b5cf6]">◈</span>
                  <h2 className="text-sm font-semibold text-white font-mono">CISSP Exam Focus</h2>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{topic.cisspFocus}</p>
              </div>
            )}

            {/* ─── Key Concepts ─────────────────────────────────────────── */}
            {currentSection === 3 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#00bcd4]">⊕</span>
                  <h2 className="text-sm font-semibold text-white font-mono">Key Concepts</h2>
                </div>
                <ul className="space-y-2">
                  {topic.keyConcepts.map((concept, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-start gap-3 text-sm text-white/70 leading-relaxed"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#00bcd4]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[8px] text-[#00bcd4] font-mono">{idx + 1}</span>
                      </span>
                      {concept}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* ─── Examples ─────────────────────────────────────────────── */}
            {currentSection === 4 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#10b981]">▸</span>
                  <h2 className="text-sm font-semibold text-white font-mono">Real-World Examples</h2>
                </div>
                <div className="space-y-4">
                  {topic.examples.map((example, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-[#10b981]/5 border border-[#10b981]/15 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-[#10b981] font-bold">EXAMPLE {idx + 1}</span>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">{example}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Common Mistakes ──────────────────────────────────────── */}
            {currentSection === 5 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#ff6b6b]">⊘</span>
                  <h2 className="text-sm font-semibold text-white font-mono">Common Mistakes</h2>
                </div>
                <ul className="space-y-3">
                  {topic.commonMistakes.map((mistake, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex items-start gap-3 text-sm text-white/70 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-lg bg-[#ff6b6b]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] text-[#ff6b6b] font-bold">✕</span>
                      </span>
                      {mistake}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* ─── Exam Tips ────────────────────────────────────────────── */}
            {currentSection === 6 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#ffb800]">◐</span>
                  <h2 className="text-sm font-semibold text-white font-mono">CISSP Exam Tips</h2>
                </div>
                <div className="space-y-3">
                  {topic.examTips.map((tip, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.06 }}
                      className="p-3 bg-[#ffb800]/5 border border-[#ffb800]/15 rounded-xl flex items-start gap-3"
                    >
                      <span className="text-[#ffb800] text-sm flex-shrink-0 mt-0.5">◐</span>
                      <p className="text-sm text-white/70 leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Key Takeaways ────────────────────────────────────────── */}
            {currentSection === 7 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#8b5cf6]">◎</span>
                  <h2 className="text-sm font-semibold text-white font-mono">Key Takeaways</h2>
                </div>
                <div className="space-y-2">
                  {topic.keyTakeaways.map((takeaway, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#8b5cf6]/5 to-transparent border-l-2 border-[#8b5cf6]/30 rounded-r-xl"
                    >
                      <span className="text-[#8b5cf6] text-sm flex-shrink-0 mt-0.5">◎</span>
                      <p className="text-sm text-white/70 leading-relaxed">{takeaway}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Knowledge Check ──────────────────────────────────────── */}
            {currentSection === 8 && (
              <div className="bg-[#0d1222] border border-[#1e2840] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg text-[#00f0ff]">◇</span>
                  <h2 className="text-sm font-semibold text-white font-mono">Knowledge Check</h2>
                  {quizScore && (
                    <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded border ${
                      quizScore.percentage >= 80 ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/25' :
                      quizScore.percentage >= 50 ? 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/25' :
                      'bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/25'
                    }`}>
                      {quizScore.correct}/{quizScore.total}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  {topic.knowledgeCheck.map((question, qIdx) => (
                    <motion.div
                      key={qIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: qIdx * 0.08 }}
                      className="p-4 bg-[#080b14] border border-[#1e2840]/60 rounded-xl"
                    >
                      <p className="text-sm text-white/80 font-medium mb-3">
                        <span className="text-[#00f0ff] font-mono text-[10px]">Q{qIdx + 1}.</span>{' '}
                        {question.question}
                      </p>
                      <div className="space-y-1.5">
                        {question.options.map((option, oIdx) => {
                          const isSelected = quizAnswers[qIdx] === oIdx;
                          const isCorrect = question.correctAnswer === oIdx;
                          const showResult = quizSubmitted;

                          let optionStyle = 'bg-[#0d1222] border-[#1e2840]/60 text-white/70';
                          let indicator = '';
                          if (showResult && isCorrect) {
                            optionStyle = 'bg-[#10b981]/10 border-[#10b981]/40 text-[#10b981]';
                            indicator = '✓';
                          } else if (showResult && isSelected && !isCorrect) {
                            optionStyle = 'bg-[#ff6b6b]/10 border-[#ff6b6b]/40 text-[#ff6b6b]';
                            indicator = '✕';
                          } else if (isSelected && !showResult) {
                            optionStyle = 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleQuizAnswer(qIdx, oIdx)}
                              disabled={quizSubmitted}
                              className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                                optionStyle
                              } ${
                                !quizSubmitted ? 'hover:border-[#00f0ff]/20 hover:bg-[#00f0ff]/5' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex-1">{option}</span>
                                {indicator && (
                                  <span className={`text-xs font-bold ${
                                    indicator === '✓' ? 'text-[#10b981]' : 'text-[#ff6b6b]'
                                  }`}>{indicator}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation after submission */}
                      {quizSubmitted && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-3 bg-[#00f0ff]/5 border border-[#00f0ff]/15 rounded-lg"
                        >
                          <p className="text-[10px] font-mono text-[#00f0ff] mb-1">Explanation:</p>
                          <p className="text-xs text-white/60 leading-relaxed">{question.explanation}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Quiz actions */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#1e2840]/80">
                  {!quizSubmitted ? (
                    <button
                      onClick={submitQuiz}
                      disabled={Object.keys(quizAnswers).length < topic.knowledgeCheck.length}
                      className="px-4 py-2 bg-[#00f0ff]/15 text-[#00f0ff] text-[10px] font-mono rounded-lg border border-[#00f0ff]/20 hover:bg-[#00f0ff]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ◇ Submit Answers ({Object.keys(quizAnswers).length}/{topic.knowledgeCheck.length})
                    </button>
                  ) : (
                    <>
                      <button onClick={resetQuiz} className="px-4 py-2 text-[10px] font-mono text-white/50 border border-[#1e2840]/80 rounded-lg hover:text-white/70 transition-all">
                        ◇ Reset Quiz
                      </button>
                      {quizScore && quizScore.percentage < 80 && (
                        <button
                          onClick={() => { setCurrentSection(0); resetQuiz(); }}
                          className="px-4 py-2 text-[10px] font-mono text-[#ffb800] border border-[#ffb800]/20 rounded-lg hover:bg-[#ffb800]/10 transition-all"
                        >
                          ◐ Review Topic
                        </button>
                      )}
                    </>
                  )}
                  {quizScore && (
                    <span className={`ml-auto text-[10px] font-mono ${
                      quizScore.percentage >= 80 ? 'text-[#10b981]' : quizScore.percentage >= 50 ? 'text-[#ffb800]' : 'text-[#ff6b6b]'
                    }`}>
                      Score: {quizScore.percentage}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ SECTION NAVIGATION CONTROLS ═══ */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1e2840]/80">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-[#1e2840]/80 text-white/40 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Previous Section
          </button>
          <button
            onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
            disabled={currentSection === sections.length - 1}
            className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-[#1e2840]/80 text-white/40 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next Section →
          </button>
        </div>

        <div className="flex gap-2">
          {/* Topic navigation */}
          {prevTopic && (
            <button
              onClick={() => navigate(`/learn/${domainId}/${prevTopic.id}`)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-[#1e2840]/80 text-white/40 hover:text-white/60 transition-all"
            >
              ← Prev Topic
            </button>
          )}
          {nextTopic && (
            <button
              onClick={() => navigate(`/learn/${domainId}/${nextTopic.id}`)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-[#1e2840]/80 text-white/40 hover:text-white/60 transition-all"
            >
              Next Topic →
            </button>
          )}
        </div>
      </div>

      {/* ═══ PRACTICE CTA ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-5 bg-gradient-to-br from-[#00f0ff]/5 to-[#ff00e4]/5 border border-[#1e2840] rounded-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono">Ready to test your knowledge?</h3>
            <p className="text-xs text-white/50 font-mono mt-1">Take a practice quiz on {domain?.shortName || 'this domain'}</p>
          </div>
          <button
            onClick={() => navigate(`/test?domain=${domainId}`)}
            className="px-5 py-2 bg-gradient-to-r from-[#00f0ff] to-[#ff00e4] text-white text-xs font-bold font-mono rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[#00f0ff]/20"
          >
            ▸ Practice Questions
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TopicDetail;
