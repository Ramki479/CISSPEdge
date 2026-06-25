import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { getUserProgress, db, updateUserProgress } from '../data';
import { loadQuestions } from '../data/questionLoader';
import {
  getAdaptiveConfig,
  calculateDynamicDifficulty,
  shuffleArray,
  createPositionStats,
  shuffleOptionsWithTracking,
  buildAdaptiveQuestionPool,
  generateAdaptiveInsights,
  type AdaptiveDifficulty,
  type AdaptiveInsight,
  type AnswerPositionStats,
} from '../utils/adaptiveTesting';
import { calculateXpForAnswer, calculateTestBonus } from '../utils/gamification';
import { playCorrect } from '../utils/sounds';
import { useAsyncError } from '../hooks/useAsyncError';
import { DragDropQuestion } from '../components/DragDropQuestion';
import { domains } from '../data/domains';
import { getAnswerMetadata } from '../utils/topicMapping';
import type { Question, TestSession, UserAnswer, TestMode, DragReorderAnswer, MatchFollowingAnswer } from '../types';

interface ShuffledQuestionOptions {
  shuffledOptions: string[];
  correctDisplayIdx: number;
  /** Maps displayed option index → original option index (for optionExplanations) */
  displayToOriginal: number[];
}

/* ─── Easing tokens (impeccable) ─────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
const SPRING_BOUNCE = { type: 'spring' as const, stiffness: 300, damping: 20 };
const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } };

/* ─── Confetti burst (delight moment) ────────────────────────────────────── */
function ConfettiBurst({ count = 24 }: { count?: number }) {
  const colors = ['#00f2fe', '#ff007f', '#ffb800', '#10b981', '#ff6b6b', '#7c3aed'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: '50%', y: '50%', scale: 0, opacity: 1 }}
          animate={{
            x: `${20 + Math.random() * 60}%`,
            y: `${10 + Math.random() * 70}%`,
            scale: [0, 1.3, 0],
            opacity: [1, 1, 0],
            rotate: Math.random() * 720,
          }}
          transition={{ duration: 1.4 + Math.random() * 0.8, delay: Math.random() * 0.4, ease: EASE_OUT_QUINT }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 60}%`,
            top: `${Math.random() * 60}%`,
            boxShadow: `0 0 4px ${colors[i % colors.length]}40`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Timer HUD display ──────────────────────────────────────────────────── */
function TimerHUD({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const formatted = `${m}:${sec.toString().padStart(2, '0')}`;
  const isUrgent = seconds < 60;
  const isCritical = seconds < 30;
  const pct = Math.max(0, Math.min(100, (seconds / 600) * 100));

  return (
    <div className="flex items-center gap-2">
      {/* Mini ring indicator */}
      <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8.5" fill="none" stroke="#1e2840" strokeWidth="1.5" />
        <circle
          cx="10" cy="10" r="8.5" fill="none"
          stroke={isCritical ? '#ff007f' : isUrgent ? '#ff6b6b' : '#00f2fe'}
          strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray={`${pct} ${100 - pct}`}
          className="transition-all duration-500"
        />
      </svg>
      <motion.span
        className={`text-sm font-mono tabular-nums tracking-wider ${
          isCritical ? 'text-[#ff007f]' : isUrgent ? 'text-[#ff6b6b]' : 'text-[#8892a9]'
        }`}
        animate={isCritical ? { opacity: [1, 0.4, 1] } : isUrgent ? { opacity: [1, 0.6, 1] } : {}}
        transition={isCritical ? { duration: 0.6, repeat: Infinity } : isUrgent ? { duration: 1.2, repeat: Infinity } : {}}
      >
        {formatted}
      </motion.span>
      {isUrgent && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/30 font-mono"
        >
          {isCritical ? 'CRITICAL' : 'LOW'}
        </motion.span>
      )}
    </div>
  );
}

/* ─── Segmented Progress Bar ──────────────────────────────────────────────── */
function SegmentedProgress({ current, total }: { current: number; total: number }) {
  const segments = 12; // max visible segments
  const segCount = Math.min(total, segments);
  const filledSegs = Math.round((current / total) * segCount);

  return (
    <div className="flex gap-[2px] w-full">
      {Array.from({ length: segCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-[3px] rounded-full flex-1 transition-all duration-300 ${
            i < filledSegs
              ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe]'
              : 'bg-[#1e2840]'
          }`}
          style={i === filledSegs - 1 ? { boxShadow: '0 0 6px rgba(0,242,254,0.3)' } : {}}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: i * 0.03, duration: 0.2, ease: EASE_OUT }}
        />
      ))}
    </div>
  );
}

/* ─── Option Card component ──────────────────────────────────────────────── */
function OptionCard({
  label,
  text,
  idx,
  isSelected,
  isCorrectOption,
  isWrongSelection,
  showExplanation,
  onSelect,
}: {
  label: string;
  text: string;
  idx: number;
  isSelected: boolean;
  isCorrectOption: boolean;
  isWrongSelection: boolean;
  showExplanation: boolean;
  onSelect: () => void;
}) {
  const stateClass = showExplanation
    ? isCorrectOption
      ? 'border-[#10b981]/50 bg-[#10b981]/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
      : isWrongSelection
        ? 'border-[#ff007f]/50 bg-[#ff007f]/10 shadow-[0_0_15px_rgba(255,0,127,0.1)]'
        : 'border-[#1e2840]/60 bg-[#0d1222]/80 opacity-60'
    : isSelected
      ? 'border-[#00f2fe]/60 bg-[#00f2fe]/8 shadow-[0_0_20px_rgba(0,242,254,0.1)]'
      : 'border-[#1e2840]/60 bg-[#0d1222]/80 hover:border-[#00f2fe]/30 hover:bg-[#00f2fe]/3';

  const badgeClass = showExplanation
    ? isCorrectOption
      ? 'bg-[#10b981] text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
      : isWrongSelection
        ? 'bg-[#ff007f] text-white shadow-[0_0_8px_rgba(255,0,127,0.3)]'
        : 'bg-[#1e2840] text-white/70'
    : isSelected
      ? 'bg-[#00f2fe] text-[#080b14] shadow-[0_0_10px_rgba(0,242,254,0.3)]'
      : 'bg-[#1e2840] text-white/70 group-hover:bg-[#2a3654] group-hover:text-[#8892a9]';

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, x: -12 },
        visible: (i: number) => ({
          opacity: 1, x: 0,
          transition: { delay: i * 0.05, duration: 0.3, ease: EASE_OUT },
        }),
      }}
      custom={idx}
      onClick={onSelect}
      whileHover={!showExplanation ? { x: 6, borderColor: 'rgba(0,242,254,0.4)' } : {}}
      whileTap={!showExplanation ? SPRING_TAP : {}}
      className={`group relative w-full text-left p-4 rounded-xl border transition-all duration-200 min-h-[52px] overflow-hidden ${stateClass}`}
      aria-label={`Option ${label}: ${text}`}
    >
      {/* Animated glow overlay on hover/select */}
      {isSelected && !showExplanation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-[#00f2fe]/5 to-transparent pointer-events-none"
        />
      )}

      <div className="relative flex items-start gap-3 z-10">
        <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold font-mono transition-all duration-200 ${badgeClass}`}>
          {showExplanation && isCorrectOption ? '✓' : showExplanation && isWrongSelection ? '✕' : label}
        </span>
        <span className={`text-sm leading-relaxed pt-1 ${
          showExplanation && !isCorrectOption && !isWrongSelection
            ? 'text-white/70'
            : 'text-[#c8ced8] group-hover:text-white transition-colors'
        }`}>
          {text}
        </span>
        {isSelected && !showExplanation && (
          <span className="ml-auto mt-1 text-[#00f2fe]/60">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
    </motion.button>
  );
}

/* ─── Main Test Engine ────────────────────────────────────────────────────── */
export function TestEngine() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = (searchParams.get('mode') || 'quick-practice') as TestMode;

  // ─── Core state ──────────────────────────────────────────────────────────
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<AdaptiveDifficulty>('medium');
  const [caseStudyPart, setCaseStudyPart] = useState(0);
  const [caseStudyAnswers, setCaseStudyAnswers] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const { throwError } = useAsyncError();

  const questionStartTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Answer position tracking for balanced distribution ──────────────────
  const [positionStats, setPositionStats] = useState<AnswerPositionStats>(() => createPositionStats(6));
  // Stores shuffled options for each question (questionId → shuffled data)
  const questionShufflesRef = useRef<Map<string, ShuffledQuestionOptions>>(new Map());

  // ─── Analytics data for completion screen (computed after test finishes) ─
  const [domainPerformance, setDomainPerformance] = useState<{ domainId: number; name: string; color: string; accuracy: number; correct: number; total: number }[]>([]);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState<{ difficulty: string; accuracy: number; correct: number; total: number }[]>([]);
  const [adaptiveInsights, setAdaptiveInsights] = useState<AdaptiveInsight[]>([]);

  // ─── Drag-drop / match state ─────────────────────────────────────────────
  const [dragReorderAnswer, setDragReorderAnswer] = useState<DragReorderAnswer | null>(null);
  const [matchAnswer, setMatchAnswer] = useState<MatchFollowingAnswer | null>(null);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);

  // ─── Derived question-local values ───────────────────────────────────────
  const currentQuestion = sessionQuestions[currentIndex];
  const optionExplanations = currentQuestion?.optionExplanations;
  const isLastQuestion = currentIndex === sessionQuestions.length - 1;

  // ─── Mark for Review ────────────────────────────────────────────────────
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());

  const toggleMarkForReview = useCallback(() => {
    if (!currentQuestion) return;
    setMarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  }, [currentQuestion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ─── Start Test ────────────────────────────────────────────────────────── */
  const startTest = useCallback(async () => {
    try {
      const progress = await getUserProgress();
      const config = getAdaptiveConfig(progress?.level || 'intermediate');
      setCurrentDifficulty(config.initialDifficulty);

    // Reset position stats from previous session — create fresh so we don't
    // read the stale state value from the closure (React state is async)
    const freshStats = createPositionStats(6);
    setPositionStats(freshStats);
    questionShufflesRef.current = new Map();

    const allQ = await loadQuestions();
    let selectedQuestions: Question[];
    const filtered = allQ.filter(q => q.type !== 'case-study');

    switch (mode) {
      case 'adaptive': {
        // Use the new CISSP-style weighted selection algorithm
        const allAnswers = await db.answers.toArray();

        // Compute per-domain performance from all past answers
        const domainPerfMap = new Map<number, { correct: number; total: number }>();
        for (const a of allAnswers) {
          const q = allQ.find(q => q.id === a.questionId);
          if (!q) continue;
          const d = domainPerfMap.get(q.domainId) || { correct: 0, total: 0 };
          d.total++;
          if (a.isCorrect) d.correct++;
          domainPerfMap.set(q.domainId, d);
        }

        const domainPerformance = Array.from(domainPerfMap.entries()).map(([id, data]) => ({
          domainId: id,
          accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 50,
          questionsAttempted: data.total,
          correctAnswers: data.correct,
        }));

        const recentIds = new Set(allAnswers.slice(-20).map(a => a.questionId));
        selectedQuestions = buildAdaptiveQuestionPool(
          allQ,
          domainPerformance,
          config.initialDifficulty,
          10,
          recentIds,
        );
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(600);
        break;
      }
      case 'quick-practice':
        selectedQuestions = shuffleArray(filtered).slice(0, 10);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(600);
        break;
      case 'full-exam':
        selectedQuestions = shuffleArray(filtered).slice(0, 50);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(7200);
        break;
      case 'exam-simulation':
        selectedQuestions = shuffleArray(filtered).slice(0, 25);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(3600);
        break;
      case 'weak-area':
        const allAnswers = await db.answers.toArray();
        const wrongAnswerIds = new Set<string>();
        for (const a of allAnswers) {
          if (!a.isCorrect) wrongAnswerIds.add(a.questionId);
        }
        selectedQuestions = wrongAnswerIds.size > 0
          ? shuffleArray(filtered.filter(q => wrongAnswerIds.has(q.id))).slice(0, 15)
          : shuffleArray(filtered).slice(0, 15);
        if (selectedQuestions.length < 5) selectedQuestions = shuffleArray(filtered).slice(0, 15);
        setTimeLeft(900);
        break;
      case 'domain-wise':
        const domainId = parseInt(searchParams.get('domain') || '1');
        selectedQuestions = shuffleArray(filtered.filter(q => q.domainId === domainId)).slice(0, 15);
        setTimeLeft(900);
        break;
      default:
        selectedQuestions = shuffleArray(filtered).slice(0, 10);
        setTimeLeft(600);
        break;
    }

    // Shuffle answer options with balanced position tracking for all regular questions
    let currentStats = freshStats;
    for (const q of selectedQuestions) {
      if (q.type === 'case-study' || q.type === 'drag-drop' || q.type === 'match-following') continue;
      if (q.options.length <= 1) continue;

      const result = shuffleOptionsWithTracking(q.options, q.correctAnswer as number, currentStats);
      questionShufflesRef.current.set(q.id, {
        shuffledOptions: result.shuffledOptions,
        correctDisplayIdx: result.newCorrectIdx,
        displayToOriginal: result.displayToOriginal,
      });
      currentStats = result.updatedStats;
    }
    setPositionStats(currentStats);

    // Shuffle the questions themselves
    selectedQuestions = shuffleArray(selectedQuestions);

    setSessionQuestions(selectedQuestions);
    setIsStarted(true);
      questionStartTime.current = Date.now();
    } catch (err) {
      throwError(err);
    }
  }, [mode, searchParams]);

  /* ─── Timer effect ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted]);

  /* ─── Check current answer: determines correctness, saves answer, shows explanation ─ */
  const checkCurrentAnswer = useCallback((
    answerOverride?: number | number[] | null,
    overrideCSAnswers?: number[],
    overrideCSPart?: number,
  ) => {
    if (!currentQuestion) return;

    const effectiveAnswer = answerOverride !== undefined ? answerOverride : selectedAnswer;
    const effectiveDragReorder = dragReorderAnswer;
    const effectiveMatch = matchAnswer;
    const effectiveCSA = overrideCSAnswers ?? caseStudyAnswers;
    const effectiveCSP = overrideCSPart ?? caseStudyPart;

    // Validate answer exists based on question type
    if (currentQuestion.type === 'drag-drop' && !effectiveDragReorder) return;
    if (currentQuestion.type === 'match-following' && !effectiveMatch) return;
    if (currentQuestion.type !== 'drag-drop' && currentQuestion.type !== 'match-following' && effectiveAnswer === null) return;

    const timeSpent = (Date.now() - questionStartTime.current) / 1000;

    // Determine correctness
    let isCorrect: boolean;
    if (currentQuestion.type === 'case-study') {
      const parts = currentQuestion.caseStudy?.parts || [];
      isCorrect = effectiveCSA[effectiveCSP] === parts[effectiveCSP]?.correctAnswer;
    } else if (currentQuestion.type === 'drag-drop' && effectiveDragReorder && currentQuestion.dragItems) {
      const correctOrder = currentQuestion.correctAnswer as number[];
      const userOrder = effectiveDragReorder.orderedIds;
      const expectedIds = correctOrder.map(i => currentQuestion.dragItems![i].id);
      isCorrect = userOrder.length === expectedIds.length && userOrder.every((id, i) => id === expectedIds[i]);
    } else if (currentQuestion.type === 'match-following' && effectiveMatch && currentQuestion.matchPairs) {
      const correctRightIds = currentQuestion.matchPairs.map((_p, i) => `r-${i}`);
      const correctMatches = currentQuestion.matchPairs.map(p => p.left);
      isCorrect = correctMatches.every((left, idx) => {
        const userRightId = effectiveMatch.matches[left];
        return userRightId === correctRightIds[idx];
      });
    } else {
      // Compare against shuffled correct answer display index
      const shuffleData = questionShufflesRef.current.get(currentQuestion.id);
      const correctIndex = shuffleData ? shuffleData.correctDisplayIdx : (currentQuestion.correctAnswer as number);
      isCorrect = effectiveAnswer === correctIndex;
    }

    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: effectiveAnswer,
      isCorrect,
      timeSpent,
      timestamp: Date.now(),
      testSessionId: 'session-' + Date.now(),
      ...getAnswerMetadata(currentQuestion),
    };

    // Save answer
    setAnswers(prev => [...prev, answer]);

    // Show feedback immediately
    if (isCorrect) playCorrect().catch(() => {});
    setFeedbackType(isCorrect ? 'correct' : 'incorrect');
    setShowExplanation(true);
  }, [currentQuestion, selectedAnswer, dragReorderAnswer, matchAnswer, caseStudyAnswers, caseStudyPart]);

  /* ─── Navigation handlers ────────────────────────────────────────────────── */
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setFeedbackType(null);
      setDragReorderAnswer(null);
      setMatchAnswer(null);
      setCaseStudyPart(0);
      setCaseStudyAnswers([]);
      questionStartTime.current = Date.now();
    }
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (showExplanation) return;
    if (currentQuestion?.type === 'case-study') {
      const newAnswers = [...caseStudyAnswers];
      newAnswers[caseStudyPart] = optionIndex;
      setCaseStudyAnswers(newAnswers);
      setSelectedAnswer(optionIndex);
      // Auto-check case-study parts on selection (pass updated answers to avoid stale closure)
      checkCurrentAnswer(optionIndex, newAnswers, caseStudyPart);
    } else if (currentQuestion?.type === 'drag-drop' || currentQuestion?.type === 'match-following') {
      return;
    } else {
      // For regular questions, set selected answer then immediately show explanation
      setSelectedAnswer(optionIndex);
      checkCurrentAnswer(optionIndex);
    }
  };

  /* ─── Advance to next question (manual only, no auto-advance) ──────────────── */
  const advanceToNext = useCallback(() => {
    if (currentQuestion?.type === 'case-study') {
      const parts = currentQuestion.caseStudy?.parts || [];
      if (caseStudyPart < parts.length - 1) {
        setCaseStudyPart(prev => prev + 1);
        setSelectedAnswer(caseStudyAnswers[caseStudyPart + 1] ?? null);
        setShowExplanation(false);
        setFeedbackType(null);
        questionStartTime.current = Date.now();
        return;
      }
    }
    if (isLastQuestion) {
      handleFinishTest();
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setFeedbackType(null);
      setDragReorderAnswer(null);
      setMatchAnswer(null);
      setCaseStudyPart(0);
      setCaseStudyAnswers([]);
      questionStartTime.current = Date.now();
      // Recalculate difficulty after each question using adaptive logic
      // (applies to all modes, but especially adaptive mode)
      (async () => {
        const p = await getUserProgress();
        const config = getAdaptiveConfig(p?.level || 'intermediate');
        const newDifficulty = calculateDynamicDifficulty(answers, currentDifficulty, config);
        setCurrentDifficulty(newDifficulty);
      })();
    }
  }, [currentQuestion, caseStudyPart, isLastQuestion, currentIndex, mode, currentDifficulty, answers, caseStudyAnswers]);

  /* ─── Handle Next — only advances manually when explanation is visible ──────── */
  const handleNext = () => {
    if (!currentQuestion) return;

    // If explanation is already showing, advance to next question
    if (showExplanation) {
      advanceToNext();
      return;
    }

    // For drag-drop / match-following: check on first click, advance on second
    if (currentQuestion.type === 'drag-drop' || currentQuestion.type === 'match-following') {
      if (currentQuestion.type === 'drag-drop' && !dragReorderAnswer) return;
      if (currentQuestion.type === 'match-following' && !matchAnswer) return;
      checkCurrentAnswer();
      return;
    }
  };

  /* ─── Finish Test ────────────────────────────────────────────────────────── */
  const handleFinishTest = async (finalAnswers?: UserAnswer[]) => {
    try {
    const allAnswers = finalAnswers || answers;
    const sessionId = 'session-' + Date.now();
    const correctCount = allAnswers.filter(a => a.isCorrect).length;
    const total = sessionQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);

    const session: Omit<TestSession, 'answers'> = {
      id: sessionId,
      mode,
      questions: sessionQuestions.map(q => q.id),
      startedAt: Date.now() - allAnswers.reduce((s, a) => s + a.timeSpent, 0) * 1000,
      completedAt: Date.now(),
      score: percentage,
      totalQuestions: total,
      correctCount,
    };

    // Write session and answers in a single transaction
    const answersWithSessionId = allAnswers.map(a => ({ ...a, testSessionId: sessionId }));
    await db.transaction('rw', [db.testSessions, db.answers], async () => {
      await db.testSessions.add(session);
      // Use bulkPut instead of bulkAdd to prevent ConstraintError
      // when records may already exist (e.g., retry, timer + manual finish)
      await db.answers.bulkPut(answersWithSessionId);
    });

    const progress = await getUserProgress();
    if (progress) {
      const xpGained = allAnswers.reduce((s, a) => s + calculateXpForAnswer(a.isCorrect), 0) + calculateTestBonus(percentage);
      const premiumBonus = sessionQuestions.filter(q => q.type === 'drag-drop' || q.type === 'match-following').length * 5;
      await updateUserProgress({ totalXp: progress.totalXp + xpGained + premiumBonus });
    }

      // Compute domain performance breakdown
      const domainMap = new Map<number, { correct: number; total: number }>();
      allAnswers.forEach((a, i) => {
        const q = sessionQuestions[i];
        if (!q) return;
        const d = domainMap.get(q.domainId) || { correct: 0, total: 0 };
        d.total++;
        if (a.isCorrect) d.correct++;
        domainMap.set(q.domainId, d);
      });
      const domainPerfData = Array.from(domainMap.entries()).map(([id, data]) => ({
        domainId: id,
        name: domains.find(d => d.id === id)?.shortName || `Domain ${id}`,
        color: domains.find(d => d.id === id)?.color || '#6366F1',
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        correct: data.correct,
        total: data.total,
      })).sort((a, b) => b.accuracy - a.accuracy);
      setDomainPerformance(domainPerfData);

      // Compute difficulty analysis
      const diffMap = new Map<string, { correct: number; total: number }>();
      allAnswers.forEach((a, i) => {
        const q = sessionQuestions[i];
        if (!q) return;
        const d = diffMap.get(q.difficulty) || { correct: 0, total: 0 };
        d.total++;
        if (a.isCorrect) d.correct++;
        diffMap.set(q.difficulty, d);
      });
      const diffData = Array.from(diffMap.entries()).map(([diff, data]) => ({
        difficulty: diff,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        correct: data.correct,
        total: data.total,
      }));
      setDifficultyAnalysis(diffData);

      // Generate adaptive learning insights from the computed data
      const insights = generateAdaptiveInsights(domainPerfData, diffData);
      setAdaptiveInsights(insights);

      setScore(percentage);
      if (percentage >= 80) setShowConfetti(true);
      setIsCompleted(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      throwError(err);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: Start Screen
     ═══════════════════════════════════════════════════════════════════════ */
  if (!isStarted) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[65vh] relative">
        {/* Cyber-grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,254,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,254,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="relative"
        >
          {/* Glowing emblem */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#ff007f] rounded-2xl opacity-20 blur-2xl animate-pulse" />
            <div className="absolute -inset-3 bg-gradient-to-br from-[#00f2fe]/5 to-[#ff007f]/5 rounded-full blur-2xl animate-spin-slow" />
            <div className="absolute inset-0 bg-[#0d1222] rounded-2xl border border-[#1e2840] flex items-center justify-center backdrop-blur-xl">
              <span className="text-2xl font-bold text-white font-mono bg-gradient-to-br from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent">#</span>
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-white mb-2 capitalize tracking-tight font-mono text-center"
          >
            {mode.replace('-', ' ')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/70 text-sm text-center mb-8 max-w-sm font-mono leading-relaxed"
          >
            {mode === 'exam-simulation' ? 'Simulate the real CISSP exam experience with timed questions across all domains.' :
             mode === 'full-exam' ? 'A comprehensive full-length CISSP mock exam covering all 8 domains.' :
             mode === 'weak-area' ? 'Focus on questions from your weakest areas to improve efficiently.' :
             mode === 'domain-wise' ? 'Practice questions from a specific domain to build mastery.' :
             mode === 'adaptive' ? 'Adaptive test that adjusts difficulty based on your performance.' :
             'Quick 10-question practice session to keep your skills sharp.'}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(0,242,254,0.2)' }}
            whileTap={SPRING_TAP}
            onClick={startTest}
            className="relative group px-8 py-3 rounded-xl text-sm font-mono font-medium overflow-hidden mx-auto block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <span className="relative z-10 text-white">▸ Start Test</span>
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/70 text-[10px] font-mono mt-6 text-center"
          >
            ◉ offline · end-to-end encrypted · {sessionQuestions.length || '—'} questions
          </motion.p>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: Completion Screen — Modern Analytics Dashboard
     ═══════════════════════════════════════════════════════════════════════ */
  if (isCompleted) {
    const passThreshold = score >= 70;
    const gradeMessage = score >= 90 ? 'Outstanding!' : score >= 70 ? 'Great Job!' : score >= 50 ? 'Keep Going!' : 'Keep Practicing!';
    const gradeColor = score >= 90 ? '#10b981' : score >= 70 ? '#00f2fe' : score >= 50 ? '#ffb800' : '#ff007f';
    const percentage = score;

    // Time analysis
    const avgTime = answers.length > 0
      ? Math.round(answers.reduce((s, a) => s + a.timeSpent, 0) / answers.length)
      : 0;
    const totalTimeMin = Math.round(answers.reduce((s, a) => s + a.timeSpent, 0) / 60);
    const fastestQ = answers.length > 0 ? Math.round(Math.min(...answers.map(a => a.timeSpent))) : 0;
    const slowestQ = answers.length > 0 ? Math.round(Math.max(...answers.map(a => a.timeSpent))) : 0;

    // Strengths & Weaknesses
    const strengths = domainPerformance.filter(d => d.accuracy >= 80);
    const weaknesses = domainPerformance.filter(d => d.accuracy < 70 && d.total > 0);

    // Correct count (used in score header + stats grid)
    const correctCount = answers.filter(a => a.isCorrect).length;

    // Radar chart data — domain performance
    const radarData = domainPerformance.length > 0
      ? domainPerformance
          .filter(d => d.total > 0)
          .map(d => ({
            domain: d.name.length > 14 ? d.name.slice(0, 12) + '…' : d.name,
            accuracy: d.accuracy,
            color: d.color,
          }))
      : [];

    return (
      <div className="max-w-4xl mx-auto pb-8 relative">
        {showConfetti && <ConfettiBurst count={36} />}

        <motion.div
          className="space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
        >
          {/* ═══ SCORE HEADER ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="tw-card p-6 lg:p-8 relative overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--color-accent)]/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${gradeColor}, ${gradeColor}88)` }} />

            {/* Score ring */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full opacity-20 blur-xl" style={{ backgroundColor: gradeColor }} />
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth="2.5" />
                <motion.circle
                  cx="18" cy="18" r="15.5" fill="none" stroke={gradeColor} strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 100' }}
                  animate={{ strokeDasharray: `${percentage} ${100 - percentage}` }}
                  transition={{ duration: 1.2, ease: EASE_OUT }}
                />
              </svg>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-2xl font-bold font-mono tabular-nums" style={{ color: gradeColor }}>{percentage}%</span>
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold mb-1 font-mono"
              style={{ color: gradeColor }}
            >{gradeMessage}</motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="tw-text-secondary text-sm font-mono mb-4"
            >
              {correctCount} / {sessionQuestions.length} correct · {mode.replace('-', ' ')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono ${
                passThreshold
                  ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25'
                  : 'bg-[#ff007f]/15 text-[#ff007f] border border-[#ff007f]/25'
              }`}
            >
              {passThreshold ? '◆ PASSED' : '◈ NEEDS IMPROVEMENT'}
            </motion.div>
          </motion.div>

          {/* ═══ STATS GRID ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {[
              { label: 'Accuracy', value: `${percentage}%`, color: gradeColor, sub: `${correctCount}/${sessionQuestions.length}` },
              { label: 'Avg Time/Question', value: `${avgTime}s`, color: '#00f2fe', sub: `${totalTimeMin}m total` },
              { label: 'Fastest Answer', value: `${fastestQ}s`, color: '#10b981', sub: 'quickest response' },
              { label: 'Slowest Answer', value: `${slowestQ}s`, color: '#ffb800', sub: 'took longest' },
            ].map((stat, i) => (
              <div key={stat.label} className="tw-card p-4 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${stat.color}, ${stat.color}44)`, opacity: 0.5 }} />
                <p className="text-[10px] tw-text-secondary font-mono tracking-wider mb-1">{stat.label}</p>
                <p className="text-xl font-bold font-mono tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[11px] tw-text-secondary font-mono mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* ═══ PIE CHART + PERF CHART ROW ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar chart — domain skills spider */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="tw-card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#6366F1] rounded-full" />
                <h3 className="text-xs font-semibold tw-text-primary font-mono tracking-wide">Skills Radar</h3>
                <span className="text-[10px] tw-text-muted font-mono ml-auto">domain accuracy</span>
              </div>
              <div className="flex items-center justify-center" style={{ minHeight: 240 }}>
                {radarData.length >= 3 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1e2840" strokeOpacity={0.5} />
                      <PolarAngleAxis
                        dataKey="domain"
                        tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 9, fontFamily: 'monospace' }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8, fontFamily: 'monospace' }}
                      />
                      <Radar
                        name="Accuracy"
                        dataKey="accuracy"
                        stroke="#00f2fe"
                        fill="#00f2fe"
                        fillOpacity={0.12}
                        strokeWidth={1.5}
                        animationDuration={800}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <p className="text-2xl mb-2">📡</p>
                      <p className="text-[11px] tw-text-secondary font-mono">Complete more domains to show radar</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Mini domain color legend */}
              {radarData.length >= 3 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
                  {radarData.map(d => (
                    <div key={d.domain} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[9px] tw-text-muted font-mono truncate max-w-[80px]">{d.domain}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Difficulty breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="tw-card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#ffb800] rounded-full" />
                <h3 className="text-xs font-semibold tw-text-primary font-mono tracking-wide">Difficulty Analysis</h3>
              </div>
              <div className="space-y-3">
                {difficultyAnalysis.length > 0 ? difficultyAnalysis.map(d => (
                  <div key={d.difficulty}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono capitalize tw-text-secondary">{d.difficulty}</span>
                      <span className="text-[11px] font-mono tabular-nums" style={{
                        color: d.accuracy >= 80 ? '#10b981' : d.accuracy >= 60 ? '#ffb800' : '#ff6b6b',
                      }}>{d.accuracy}%</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-border-light)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.accuracy}%` }}
                        transition={{ duration: 0.8, ease: EASE_OUT }}
                        className="h-full rounded-full"
                        style={{
                          background: d.accuracy >= 80
                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                            : d.accuracy >= 60
                              ? 'linear-gradient(90deg, #ffb800, #ff6b00)'
                              : 'linear-gradient(90deg, #ff6b6b, #ff007f)',
                        }}
                      />
                    </div>
                    <p className="text-[10px] tw-text-muted font-mono mt-0.5">{d.correct}/{d.total} correct</p>
                  </div>
                )) : (
                  <p className="text-[11px] tw-text-secondary font-mono">No difficulty data available</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* ═══ DOMAIN PERFORMANCE BARS ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="tw-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 bg-[#6366F1] rounded-full" />
              <h3 className="text-xs font-semibold tw-text-primary font-mono tracking-wide">Domain Performance</h3>
              <span className="text-[10px] tw-text-muted font-mono ml-auto">sorted by accuracy</span>
            </div>
            <div className="space-y-3">
              {domainPerformance.map((d, i) => (
                <motion.div
                  key={d.domainId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] font-mono tw-text-primary truncate">{d.name}</span>
                      {d.total === 0 && <span className="text-[9px] tw-text-muted font-mono">—</span>}
                    </div>
                    <span className="text-[11px] font-mono tabular-nums flex-shrink-0 ml-2" style={{
                      color: d.accuracy >= 80 ? '#10b981' : d.accuracy >= 60 ? '#ffb800' : '#ff6b6b',
                    }}>
                      {d.total > 0 ? `${d.accuracy}%` : '—'}
                    </span>
                  </div>
                  {d.total > 0 && (
                    <div className="w-full h-2 bg-[var(--color-border-light)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.accuracy}%` }}
                        transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.03 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${d.color}, ${d.color}88)` }}
                      />
                    </div>
                  )}
                  <p className="text-[10px] tw-text-muted font-mono mt-0.5">{d.correct}/{d.total} correct</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ═══ STRENGTHS & WEAKNESSES ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {strengths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="tw-card p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-4 bg-[#10b981] rounded-full" />
                  <h3 className="text-xs font-semibold tw-text-primary font-mono tracking-wide">Strengths</h3>
                </div>
                <div className="space-y-2">
                  {strengths.map(s => (
                    <div key={s.domainId} className="flex items-center gap-2 p-2 rounded-lg bg-[#10b981]/5 border border-[#10b981]/15">
                      <span className="text-sm text-[#10b981]">◆</span>
                      <span className="text-[11px] font-mono tw-text-primary">{s.name}</span>
                      <span className="ml-auto text-[11px] font-mono text-[#10b981]">{s.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {weaknesses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="tw-card p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-4 bg-[#ff6b6b] rounded-full" />
                  <h3 className="text-xs font-semibold tw-text-primary font-mono tracking-wide">Areas to Improve</h3>
                </div>
                <div className="space-y-2">
                  {weaknesses.map(w => (
                    <div key={w.domainId} className="flex items-center gap-2 p-2 rounded-lg bg-[#ff6b6b]/5 border border-[#ff6b6b]/15">
                      <span className="text-sm text-[#ff6b6b]">⚠</span>
                      <span className="text-[11px] font-mono tw-text-primary">{w.name}</span>
                      <span className="ml-auto text-[11px] font-mono text-[#ff6b6b]">{w.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ═══ PERSONALIZED RECOMMENDATIONS ═══ */}
          {weaknesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="tw-card p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#ff007f] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🎯</span>
                <h3 className="text-xs font-semibold tw-text-primary font-mono tracking-wide">Recommendations</h3>
              </div>
              <div className="space-y-2">
                {weaknesses.slice(0, 3).map((w, i) => (
                  <motion.div
                    key={w.domainId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)]"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-lg bg-[#00f2fe]/10 flex items-center justify-center text-[10px] font-bold font-mono text-[#00f2fe]">{i + 1}</span>
                    <div>
                      <p className="text-[11px] font-medium tw-text-primary font-mono">Focus on {w.name}</p>
                      <p className="text-[10px] tw-text-secondary font-mono mt-0.5">
                        {w.accuracy < 50
                          ? 'Review fundamental concepts and take domain-specific practice tests to build a strong foundation.'
                          : 'Continue practicing with scenario-based questions to strengthen your understanding.'}
                      </p>
                      <button
                        onClick={() => navigate(`/test?mode=domain-wise&domain=${w.domainId}`)}
                        className="mt-1.5 text-[10px] font-mono text-[#00f2fe] hover:underline"
                      >
                        ▸ Practice {w.name} →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ ADAPTIVE LEARNING INSIGHTS ═══ */}
          {adaptiveInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.47 }}
              className="tw-card p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#6366F1] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🧠</span>
                <h3 className="text-xs font-semibold tw-text-primary font-mono tracking-wide">Adaptive Learning Insights</h3>
              </div>
              <div className="space-y-2">
                {adaptiveInsights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className={`flex items-start gap-3 p-3 rounded-lg text-xs ${
                      insight.type === 'strength'
                        ? 'bg-[#10b981]/5 border border-[#10b981]/15'
                        : insight.type === 'weakness'
                          ? 'bg-[#ff6b6b]/5 border border-[#ff6b6b]/15'
                          : insight.type === 'trend'
                            ? 'bg-[#6366F1]/5 border border-[#6366F1]/15'
                            : 'bg-[#00f2fe]/5 border border-[#00f2fe]/15'
                    }`}
                  >
                    <span className="flex-shrink-0 text-sm">
                      {insight.type === 'strength' ? '✓' : insight.type === 'weakness' ? '⚠' : insight.type === 'trend' ? '◈' : '💡'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] tw-text-primary font-mono leading-relaxed">{insight.message}</p>
                      {insight.domainId && (
                        <button
                          onClick={() => navigate(`/test?mode=domain-wise&domain=${insight.domainId}`)}
                          className="mt-1 text-[10px] font-mono text-[#00f2fe] hover:underline"
                        >
                          ▸ Practice this domain →
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ ACTION BUTTONS ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-3 justify-center pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={SPRING_TAP}
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 tw-btn-secondary rounded-xl text-xs font-mono"
            >
              ◁ Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 12px rgba(0,242,254,0.15)' }}
              whileTap={SPRING_TAP}
              onClick={() => navigate('/review')}
              className="px-5 py-2.5 bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/25 rounded-xl text-xs font-mono hover:bg-[#00f2fe]/20 transition-all"
            >
              ◆ Review Answers
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={SPRING_TAP}
              onClick={() => navigate('/analytics')}
              className="px-5 py-2.5 bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/25 rounded-xl text-xs font-mono hover:bg-[#6366F1]/20 transition-all"
            >
              ◈ Full Analytics
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 12px rgba(16,185,129,0.15)' }}
              whileTap={SPRING_TAP}
              onClick={startTest}
              className="px-5 py-2.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/25 rounded-xl text-xs font-mono hover:bg-[#10b981]/20 transition-all"
            >
              ▸ Retry
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: Active Test
     ═══════════════════════════════════════════════════════════════════════ */
  if (!currentQuestion) return null;

  const isRegularQuestion = currentQuestion.type !== 'drag-drop' && currentQuestion.type !== 'match-following';
  const hasAnswer = selectedAnswer !== null || dragReorderAnswer !== null || matchAnswer !== null;
  // For regular questions: auto-check happens on selection, so 'canCheck' is always false
  // For drag-drop/match: show 'Check' button when answer is selected but not yet checked
  const canCheckAnswer = !isRegularQuestion && hasAnswer && !showExplanation;
  // Next is enabled only when explanation is shown
  const canProceed = showExplanation;

  // Compute options for current question (use shuffled version when available)
  const shuffleData = currentQuestion.type !== 'case-study'
    ? questionShufflesRef.current.get(currentQuestion.id)
    : undefined;
  const options = currentQuestion.type === 'case-study' && currentQuestion.caseStudy
    ? currentQuestion.caseStudy.parts[caseStudyPart].options
    : shuffleData
      ? shuffleData.shuffledOptions
      : currentQuestion.options;

  // Case study data
  const caseStudy = currentQuestion.type === 'case-study' ? currentQuestion.caseStudy : null;

  return (
    <div className="max-w-4xl mx-auto pb-28 relative">
      {/* Persistent cyber-grid background */}
<div className="relative z-10">
        {/* ═══ HUD HEADER: Segmented Progress + Timer ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5"
        >
          {/* Top row: Q counter + timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/70 font-mono tabular-nums tracking-wider">
                <span className="text-[#00f2fe] font-semibold">Q</span>{' '}
                <motion.span
                  key={currentIndex}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white font-semibold"
                >
                  {String(currentIndex + 1).padStart(2, '0')}
                </motion.span>
                <span className="text-white/70"> / {String(sessionQuestions.length).padStart(2, '0')}</span>
              </span>

              {/* Difficulty badge — 5-level system */}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                currentDifficulty === 'beginner' ? 'border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]' :
                currentDifficulty === 'easy' ? 'border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]' :
                currentDifficulty === 'medium' ? 'border-[#ffb800]/30 bg-[#ffb800]/10 text-[#ffb800]' :
                currentDifficulty === 'hard' ? 'border-[#ff6b6b]/30 bg-[#ff6b6b]/10 text-[#ff6b6b]' :
                'border-[#ff007f]/30 bg-[#ff007f]/10 text-[#ff007f]'
              }`}>
                {currentDifficulty === 'beginner' ? 'Beginner' :
                 currentDifficulty === 'easy' ? 'Easy' :
                 currentDifficulty === 'medium' ? 'Medium' :
                 currentDifficulty === 'hard' ? 'Hard' : 'Expert'}
              </span>

              {/* Question type badge */}
              {currentQuestion.type !== 'multiple-choice' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 capitalize">
                  {currentQuestion.type.replace('-', ' ')}
                </span>
              )}
            </div>

            {timeLeft > 0 && <TimerHUD seconds={timeLeft} />}
          </div>

          {/* Segmented progress bar */}
          <SegmentedProgress current={currentIndex + 1} total={sessionQuestions.length} />

          {/* Urgency warning */}
          <AnimatePresence>
            {timeLeft > 0 && timeLeft < 60 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-end mt-1.5"
              >
                <span className="text-[10px] text-[#ff007f] font-mono flex items-center gap-1">
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>⚠</motion.span>
                  Time running low — prioritize remaining questions
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══ FEEDBACK BANNER ═══ */}
        <AnimatePresence>
          {feedbackType && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className={`mb-4 p-3.5 rounded-xl text-center font-mono text-xs relative overflow-hidden border ${
                feedbackType === 'correct'
                  ? 'bg-[#10b981]/12 text-[#10b981] border-[#10b981]/25'
                  : 'bg-[#ff007f]/12 text-[#ff007f] border-[#ff007f]/25'
              }`}
            >
              {/* Shimmer sweep for correct */}
              {feedbackType === 'correct' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                />
              )}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={SPRING_BOUNCE}
                className="inline-block mr-1"
              >
                {feedbackType === 'correct' ? '◆' : '◈'}
              </motion.span>
              {feedbackType === 'correct' ? 'Correct!' : 'Incorrect'}
              
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ QUESTION CARD ═══ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id + (currentQuestion.type === 'case-study' ? `-cs-${caseStudyPart}` : '')}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
            className="bg-[#0d1222]/90 backdrop-blur-sm rounded-2xl border border-[#1e2840]/80 p-6 lg:p-8"
          >
            {/* Domain tag */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#00f2fe]/8 text-[#00f2fe] border border-[#00f2fe]/20 font-mono">
                D{currentQuestion.domainId}
              </span>
              <span className="text-[10px] text-white/70 font-mono">
                {currentQuestion.difficulty}
              </span>
              {currentQuestion.concepts.slice(0, 2).map(c => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-[#080b14] text-white/70 border border-[#1e2840] font-mono hidden sm:inline">
                  {c}
                </span>
              ))}
              {/* Mark for Review toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMarkForReview}
                className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all ${
                  markedQuestions.has(currentQuestion.id)
                    ? 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/30'
                    : 'bg-[#0d1222] text-white/50 border-[#1e2840] hover:border-[#ffb800]/30 hover:text-white/80'
                }`}
                aria-label={markedQuestions.has(currentQuestion.id) ? 'Marked for review' : 'Mark for review'}
              >
                <span className={`text-xs transition-transform ${markedQuestions.has(currentQuestion.id) ? 'scale-110' : ''}`}>
                  {markedQuestions.has(currentQuestion.id) ? '★' : '☆'}
                </span>
                <span>{markedQuestions.has(currentQuestion.id) ? 'Marked' : 'Review'}</span>
              </motion.button>
            </div>

            {/* ═══ CASE STUDY SPLIT PANE ═══ */}
            {caseStudy && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mb-6 rounded-xl border border-[#00f2fe]/15 bg-[#080b14] overflow-hidden"
              >
                {/* Case study header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#00f2fe]/5 border-b border-[#00f2fe]/10">
                  <span className="text-[10px] font-mono text-[#00f2fe]">◈ CASE STUDY</span>
                  <span className="text-[10px] font-mono text-white/70">
                    Part {caseStudyPart + 1} of {caseStudy.parts.length}
                  </span>
                  <div className="ml-auto flex gap-1">
                    {caseStudy.parts.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === caseStudyPart ? 'bg-[#00f2fe]' :
                          caseStudyAnswers[i] !== undefined ? 'bg-[#10b981]' : 'bg-[#1e2840]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Case study intro text */}
                <div className="p-4 border-b border-[#1e2840]/50">
                  <p className="text-sm text-[#8892a9] leading-relaxed font-mono text-[13px]">
                    {caseStudy.intro}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Scenario block */}
            {currentQuestion.type === 'scenario' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 }}
                className="mb-5 p-4 rounded-xl bg-[#00f2fe]/3 border border-[#00f2fe]/10"
              >
                <p className="text-[10px] text-[#00f2fe] font-mono mb-1.5 tracking-wider uppercase">Scenario</p>
                <p className="text-sm text-[#8892a9] leading-relaxed">{currentQuestion.text}</p>
              </motion.div>
            )}

            {/* Question text */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-base lg:text-lg font-medium text-white mb-6 leading-relaxed tracking-[0.01em]"
            >
              {currentQuestion.type === 'case-study' && caseStudy
                ? caseStudy.parts[caseStudyPart].question
                : currentQuestion.type !== 'scenario'
                  ? currentQuestion.text
                  : null
              }
              {currentQuestion.type === 'case-study' && !caseStudy && currentQuestion.text}
            </motion.h2>

            {/* Drag-drop / Match */}
            {currentQuestion.type === 'drag-drop' && currentQuestion.dragItems && (
              <div className="mb-4">
                <div className="mb-4 p-3 rounded-xl bg-[#00f2fe]/5 border border-[#00f2fe]/15">
                  <p className="text-xs text-[#00f2fe] font-mono">
                    <span className="mr-1">↕</span> Drag to reorder: Arrange the items in the correct sequence.
                  </p>
                </div>
                <DragDropQuestion type="drag-drop" dragItems={currentQuestion.dragItems}
                  onAnswer={(answer) => { setDragReorderAnswer(answer as DragReorderAnswer); setShowExplanation(false); }}
                  disabled={showExplanation} />
              </div>
            )}
            {currentQuestion.type === 'match-following' && currentQuestion.matchPairs && (
              <div className="mb-4">
                <div className="mb-4 p-3 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/15">
                  <p className="text-xs text-[#a78bfa] font-mono">
                    <span className="mr-1">🔗</span> Match the following: Click a left item, then its match on the right.
                  </p>
                </div>
                <DragDropQuestion type="match-following" matchPairs={currentQuestion.matchPairs}
                  onAnswer={(answer) => { setMatchAnswer(answer as MatchFollowingAnswer); setShowExplanation(false); }}
                  disabled={showExplanation} />
              </div>
            )}

            {/* ═══ OPTION CARDS ═══ */}
            {currentQuestion.type !== 'drag-drop' && currentQuestion.type !== 'match-following' && (
              <div className="space-y-2.5">
                {options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrectOption = showExplanation && (
                    (currentQuestion.type === 'case-study' && caseStudy
                      ? caseStudy.parts[caseStudyPart].correctAnswer
                      : currentQuestion.correctAnswer
                    ) === idx
                  );
                  const isWrongSelection = showExplanation && isSelected && !isCorrectOption;

                  return (
                    <OptionCard
                      key={idx}
                      label={String.fromCharCode(65 + idx)}
                      text={option}
                      idx={idx}
                      isSelected={isSelected}
                      isCorrectOption={isCorrectOption}
                      isWrongSelection={isWrongSelection}
                      showExplanation={showExplanation}
                      onSelect={() => handleSelectAnswer(idx)}
                    />
                  );
                })}
              </div>
            )}

            {/* ═══ EXPLANATION PANEL ═══ */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.3, ease: EASE_OUT }}
                className="mt-5 rounded-xl bg-[#080b14] border border-[#1e2840] overflow-hidden"
              >
                {/* Main explanation */}
                <div className="p-5 border-b border-[#1e2840]/60">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-[#00f2fe] font-mono tracking-wider uppercase">Explanation</span>
                    <span className="text-[10px] text-white/70 font-mono">
                      {answers.length > 0 && `· ${answers[answers.length - 1].timeSpent.toFixed(1)}s`}
                    </span>
                    {feedbackType === 'correct' && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 font-mono">✓ Correct</span>
                    )}
                    {feedbackType === 'incorrect' && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#ff007f]/15 text-[#ff007f] border border-[#ff007f]/25 font-mono">✕ Incorrect</span>
                    )}
                  </div>
                  <p className="text-sm text-[#c8ced8] leading-relaxed">{currentQuestion.explanation}</p>
                </div>

                {/* Per-option detailed explanations */}
                {optionExplanations && optionExplanations.length > 0 && (
                  <div className="p-5 border-b border-[#1e2840]/60">
                    <span className="text-[10px] font-semibold text-[#6366F1] font-mono tracking-wider uppercase mb-3 block">Option Analysis</span>
                    <div className="space-y-3">
                      {optionExplanations.map((optExp, originalIdx) => {
                        // Map displayed option index back to original index for explanations
                        const shuffledForQ = questionShufflesRef.current.get(currentQuestion.id);
                        const displayIdx = shuffledForQ
                          ? shuffledForQ.displayToOriginal.indexOf(originalIdx)
                          : originalIdx;
                        const isCorrectAnswer = shuffledForQ
                          ? shuffledForQ.correctDisplayIdx === displayIdx
                          : currentQuestion.correctAnswer === originalIdx;
                        const isUserChoice = selectedAnswer === displayIdx;
                        return (
                        <div
                          key={originalIdx}
                          className={`p-3 rounded-lg text-xs border ${
                              isCorrectAnswer
                                ? 'bg-[#10b981]/8 border-[#10b981]/25'
                                : isUserChoice && !isCorrectAnswer
                                  ? 'bg-[#ff007f]/8 border-[#ff007f]/25'
                                  : 'bg-[#0d1222]/80 border-[#1e2840]/60'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold font-mono ${
                                isCorrectAnswer ? 'bg-[#10b981] text-white' : isUserChoice ? 'bg-[#ff007f] text-white' : 'bg-[#1e2840] text-white/70'
                              }`}>
                                {isCorrectAnswer ? '✓' : isUserChoice ? '✕' : String.fromCharCode(65 + (displayIdx >= 0 ? displayIdx : originalIdx))}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] leading-relaxed mb-1 ${isCorrectAnswer || isUserChoice ? 'text-white' : 'text-[#8892a9]'}`}>
                                  {optExp.text}
                                </p>
                                <p className={`text-[10px] leading-relaxed ${isCorrectAnswer ? 'text-[#10b981]/80' : 'text-white/70'}`}>
                                  {optExp.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Concepts */}
                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5">
                    {currentQuestion.concepts.map((c, i) => (
                      <motion.span
                        key={c}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + i * 0.04 }}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d1222] text-white/70 border border-[#1e2840] font-mono"
                      >
                        {c}
                      </motion.span>
                    ))}
                    {/* Skill area badges */}
                    {(currentQuestion.skillAreas as string[] | undefined)?.map((sa: string) => (
                      <span key={sa} className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 font-mono">
                        ◆ {sa.length > 20 ? sa.slice(0, 20) + '…' : sa}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Running score */}
            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-[10px] text-white/70 font-mono tabular-nums">
                <span className="text-[#10b981]">{answers.filter(a => a.isCorrect).length}</span>
                <span className="text-white/70"> correct · </span>
                <span className="text-[#8892a9]">{answers.length}</span>
                <span className="text-white/70"> answered</span>
                {answers.length > 0 && (
                  <span className="text-white/70">
                    {' · '}
                    <span className={Math.round(answers.filter(a => a.isCorrect).length / answers.length * 100) >= 70 ? 'text-[#00f2fe]' : 'text-[#ffb800]'}>
                      {Math.round(answers.filter(a => a.isCorrect).length / answers.length * 100)}%
                    </span>
                    <span className="text-white/70"> accuracy</span>
                  </span>
                )}
              </span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ BOTTOM NAVIGATION ═══ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-[#1e2840]/80"
      >
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-3.5 flex items-center justify-between gap-3">
          {/* Prev button */}
          <motion.button
            whileHover={currentIndex > 0 ? { x: -2 } : {}}
            whileTap={currentIndex > 0 ? SPRING_TAP : {}}
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="relative group px-5 py-2.5 min-h-[42px] bg-[#0d1222]/80 hover:bg-[#111827] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl border border-[#1e2840]/80 transition-all text-xs font-mono"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </span>
          </motion.button>

          {/* Center: question position indicator with Mark for Review */}
          <div className="hidden sm:flex items-center gap-1.5">
            {sessionQuestions.slice(0, 10).map((q, i) => {
              const isMarked = markedQuestions.has(q.id);
              return (
                <div
                  key={i}
                  className={`relative transition-all duration-300 ${
                    i === currentIndex ? 'scale-125' : ''
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      i === currentIndex
                        ? 'bg-[#00f2fe] shadow-[0_0_6px_rgba(0,242,254,0.5)]'
                        : i < currentIndex
                          ? 'bg-[#1e2840]'
                          : 'bg-[#1e2840]/50'
                    }`}
                  />
                  {isMarked && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] text-[#ffb800]">★</span>
                  )}
                </div>
              );
            })}
            {sessionQuestions.length > 10 && (
              <span className="text-[10px] text-white/70 font-mono ml-1">+{sessionQuestions.length - 10}</span>
            )}
            {/* Marked count badge */}
            {markedQuestions.size > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ffb800]/15 text-[#ffb800] border border-[#ffb800]/25 font-mono ml-2 whitespace-nowrap">
                ★ {markedQuestions.size}
              </span>
            )}
          </div>

          {/* Right group: Check + Next */}
          <div className="flex items-center gap-2">
            {canCheckAnswer && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={SPRING_TAP}
                onClick={() => checkCurrentAnswer()}
                className="px-4 py-2.5 min-h-[42px] bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/25 font-medium rounded-xl transition-all text-xs font-mono"
              >
                ✓ Check
              </motion.button>
            )}
            <motion.button
              whileHover={canProceed ? { scale: 1.02 } : {}}
              whileTap={canProceed ? SPRING_TAP : {}}
              onClick={handleNext}
              disabled={!canProceed}
              className="relative group px-6 py-2.5 min-h-[42px] rounded-xl font-medium transition-all text-xs font-mono overflow-hidden"
            >
              {/* Gradient background - glows when answer selected */}
              <div className={`absolute inset-0 transition-opacity duration-300 ${
                canProceed
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100'
                  : 'bg-[#0d1222] opacity-100'
              }`} />
              {/* Glow effect on hover when answer selected */}
              {canProceed && (
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2fe]/30 to-[#4facfe]/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 ${
                canProceed ? 'text-white' : 'text-white/70'
              }`}>
                {isLastQuestion ? 'Finish' : 'Next'}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default TestEngine;
