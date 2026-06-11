import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { questions } from '../data/questionBank';
import { getUserProgress, db, updateUserProgress } from '../data/database';
import { getAdaptiveConfig, calculateDynamicDifficulty } from '../utils/adaptiveTesting';
import { calculateXpForAnswer, calculateTestBonus } from '../utils/gamification';
import { DragDropQuestion } from '../components/DragDropQuestion';
import type { Question, TestSession, UserAnswer, TestMode, DragReorderAnswer, MatchFollowingAnswer } from '../types';

export function TestEngine() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = (searchParams.get('mode') || 'quick-practice') as TestMode;

  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [caseStudyPart, setCaseStudyPart] = useState(0);
  const [caseStudyAnswers, setCaseStudyAnswers] = useState<number[]>([]);

  const questionStartTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [dragReorderAnswer, setDragReorderAnswer] = useState<DragReorderAnswer | null>(null);
  const [matchAnswer, setMatchAnswer] = useState<MatchFollowingAnswer | null>(null);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  const currentQuestion = sessionQuestions[currentIndex];
  const isLastQuestion = currentIndex === sessionQuestions.length - 1;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const startTest = useCallback(async () => {
    const progress = await getUserProgress();
    const config = getAdaptiveConfig(progress?.level || 'intermediate');
    setCurrentDifficulty(config.initialDifficulty);

    let selectedQuestions: Question[];
    const filtered = [...questions].filter(q => q.type !== 'case-study'); // handle case studies separately

    switch (mode) {
      case 'quick-practice': {
        selectedQuestions = shuffleArray(filtered).slice(0, 10);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(600); // 10 min
        break;
      }
      case 'full-exam': {
        selectedQuestions = shuffleArray(filtered).slice(0, 50);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(7200); // 2 hours
        break;
      }
      case 'exam-simulation': {
        selectedQuestions = shuffleArray(filtered).slice(0, 25);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(3600); // 1 hour
        break;
      }
      case 'weak-area': {
        const analytics = await db.testSessions.toArray();
        const wrongAnswerIds = new Set<string>();
        for (const session of analytics) {
          for (const a of session.answers) {
            if (!a.isCorrect) wrongAnswerIds.add(a.questionId);
          }
        }
        if (wrongAnswerIds.size > 0) {
          selectedQuestions = shuffleArray(filtered.filter(q => wrongAnswerIds.has(q.id))).slice(0, 15);
        } else {
          selectedQuestions = shuffleArray(filtered).slice(0, 15);
        }
        if (selectedQuestions.length < 5) selectedQuestions = shuffleArray(filtered).slice(0, 15);
        setTimeLeft(900);
        break;
      }
      case 'domain-wise': {
        const domainId = parseInt(searchParams.get('domain') || '1');
        selectedQuestions = shuffleArray(filtered.filter(q => q.domainId === domainId)).slice(0, 15);
        setTimeLeft(900);
        break;
      }
      case 'adaptive':
      default: {
        selectedQuestions = shuffleArray(filtered).slice(0, 10);
        setTimeLeft(600);
        break;
      }
    }

    // Add a case study if none selected and there's room
    const caseStudies = questions.filter(q => q.type === 'case-study');
    if (caseStudies.length > 0 && selectedQuestions.length < 20) {
      selectedQuestions.push(caseStudies[Math.floor(Math.random() * caseStudies.length)]);
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    setSessionQuestions(selectedQuestions);
    setIsStarted(true);
    questionStartTime.current = Date.now();
  }, [mode, searchParams]);

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

  const handlePrev = () => {
    if (currentIndex > 0) {
      // Cancel any pending auto-advance
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
      pendingNavigationRef.current = null;

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
    } else if (currentQuestion?.type === 'drag-drop' || currentQuestion?.type === 'match-following') {
      // Handled by DragDropQuestion component
      return;
    } else {
      setSelectedAnswer(optionIndex);
    }
  };

  const advanceToNext = (_answer: UserAnswer, newAnswers: UserAnswer[]) => {
    if (currentQuestion?.type === 'case-study') {
      const parts = currentQuestion.caseStudy?.parts || [];
      if (caseStudyPart < parts.length - 1) {
        setCaseStudyPart(prev => prev + 1);
        setSelectedAnswer(caseStudyAnswers[caseStudyPart + 1] ?? null);
        questionStartTime.current = Date.now();
        return;
      }
    }

    if (isLastQuestion) {
      handleFinishTest(newAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setFeedbackType(null);
      setCaseStudyPart(0);
      setCaseStudyAnswers([]);
      questionStartTime.current = Date.now();

      // Adaptive difficulty
      if (mode === 'adaptive') {
        (async () => {
          const p = await getUserProgress();
          const config = getAdaptiveConfig(p?.level || 'intermediate');
          const newDifficulty = calculateDynamicDifficulty(newAnswers, currentDifficulty, config);
          setCurrentDifficulty(newDifficulty);
        })();
      }
    }
  };

  const handleNext = () => {
    // If auto-advance is pending, skip the wait immediately
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
      setFeedbackType(null);
      if (pendingNavigationRef.current) {
        pendingNavigationRef.current();
        pendingNavigationRef.current = null;
      }
      return;
    }

    if (!currentQuestion) return;

    // For drag-drop and match-following, check if answered
    if (currentQuestion.type === 'drag-drop') {
      if (!dragReorderAnswer) return;
    } else if (currentQuestion.type === 'match-following') {
      if (!matchAnswer) return;
    } else {
      if (selectedAnswer === null) return;
    }

    const timeSpent = (Date.now() - questionStartTime.current) / 1000;

    let isCorrect: boolean;
    if (currentQuestion.type === 'case-study') {
      const parts = currentQuestion.caseStudy?.parts || [];
      isCorrect = caseStudyAnswers[caseStudyPart] === parts[caseStudyPart]?.correctAnswer;
    } else if (currentQuestion.type === 'drag-drop' && dragReorderAnswer && currentQuestion.dragItems) {
      const correctOrder = currentQuestion.correctAnswer as number[];
      const userOrder = dragReorderAnswer.orderedIds;
      const expectedIds = correctOrder.map(i => currentQuestion.dragItems![i].id);
      isCorrect = userOrder.length === expectedIds.length && userOrder.every((id, i) => id === expectedIds[i]);
    } else if (currentQuestion.type === 'match-following' && matchAnswer && currentQuestion.matchPairs) {
      const correctRightIds = currentQuestion.matchPairs.map((_p, i) => `r-${i}`);
      const correctMatches = currentQuestion.matchPairs.map(p => p.left);
      isCorrect = correctMatches.every((left, idx) => {
        const userRightId = matchAnswer.matches[left];
        return userRightId === correctRightIds[idx];
      });
    } else {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }

    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      timeSpent,
      timestamp: Date.now(),
      testSessionId: 'session-' + Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(prev => [...prev, answer]);

    // If explanation is already shown (user clicked "Check Answer" first), proceed immediately
    if (showExplanation) {
      advanceToNext(answer, newAnswers);
      return;
    }

    // Show brief feedback, then auto-advance
    setFeedbackType(isCorrect ? 'correct' : 'incorrect');
    setShowExplanation(true);

    pendingNavigationRef.current = () => advanceToNext(answer, newAnswers);
    autoAdvanceRef.current = setTimeout(() => {
      autoAdvanceRef.current = null;
      pendingNavigationRef.current = null;
      setFeedbackType(null);
      advanceToNext(answer, newAnswers);
    }, 1500);
  };

  const handleFinishTest = async (finalAnswers?: UserAnswer[]) => {
    const allAnswers = finalAnswers || answers;
    const correctCount = allAnswers.filter(a => a.isCorrect).length;
    const total = sessionQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);

    const session: TestSession = {
      id: 'session-' + Date.now(),
      mode,
      questions: sessionQuestions.map(q => q.id),
      answers: allAnswers,
      startedAt: Date.now() - allAnswers.reduce((s, a) => s + a.timeSpent, 0) * 1000,
      completedAt: Date.now(),
      score: percentage,
      totalQuestions: total,
      correctCount,
    };

    await db.testSessions.add(session);

    // Update XP — also award bonus for drag-drop/match-following (harder question types)
    const progress = await getUserProgress();
    if (progress) {
      const xpGained = allAnswers.reduce((s, a) => s + calculateXpForAnswer(a.isCorrect), 0) + calculateTestBonus(percentage);
      // Bonus XP for premium question types
      const premiumBonus = sessionQuestions.filter(q => q.type === 'drag-drop' || q.type === 'match-following').length * 5;
      await updateUserProgress({ totalXp: progress.totalXp + xpGained + premiumBonus });
    }

    setScore(percentage);
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">📝</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2 capitalize">{mode.replace('-', ' ')}</h1>
        <p className="text-text-muted text-center mb-8">
          {mode === 'exam-simulation' ? 'Simulate the real CISSP exam experience' :
           mode === 'full-exam' ? 'A comprehensive full-length CISSP mock exam' :
           mode === 'weak-area' ? 'Focus on questions from your weakest areas' :
           mode === 'domain-wise' ? 'Practice questions from a specific domain' :
           mode === 'adaptive' ? 'Adaptive test that adjusts to your skill level' :
           'Quick 10-question practice session'}
        </p>
        <button
          onClick={startTest}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
        >
          Start Test
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className={`text-6xl mb-6 ${score >= 70 ? 'animate-bounce' : ''}`}>
          {score >= 90 ? '🏆' : score >= 70 ? '🎉' : score >= 50 ? '👍' : '💪'}
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Test Complete!</h1>
        <div className="text-5xl font-bold text-indigo-400 mb-2">{score}%</div>
        <p className="text-text-muted mb-6">
          {answers.filter(a => a.isCorrect).length} / {sessionQuestions.length} correct
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-surface-alt hover:bg-surface-hover text-text-primary rounded-xl transition-all"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/review')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
          >
            Review Answers
          </button>
          <button
            onClick={startTest}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const hasAnswer = selectedAnswer !== null || dragReorderAnswer !== null || matchAnswer !== null;
  const canCheckAnswer = hasAnswer && !showExplanation;
  const canProceed = hasAnswer;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-muted">
            Question {currentIndex + 1} of {sessionQuestions.length}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">
              Difficulty: <span className={`font-medium ${
                currentDifficulty === 'easy' ? 'text-emerald-400' :
                currentDifficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>{currentDifficulty}</span>
            </span>
            {timeLeft > 0 && (
              <span className={`text-sm font-mono ${timeLeft < 60 ? 'text-red-400' : 'text-text-muted'}`}>
                ⏱ {formatTime(timeLeft)}
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-surface-alt rounded-full h-2">
          <div
            className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Feedback Banner */}
      <AnimatePresence>
        {feedbackType && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`mb-4 p-3 rounded-xl text-center font-semibold ${
              feedbackType === 'correct'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}
          >
            {feedbackType === 'correct' ? (
              <><span className="text-lg">✓</span> Correct!</>
            ) : (
              <><span className="text-lg">✗</span> Incorrect</>
            )}
            <span className="text-sm font-normal ml-2 text-text-muted">Auto-advancing...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id + (currentQuestion.type === 'case-study' ? `-${caseStudyPart}` : '')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-surface-card rounded-2xl border border-border p-6 lg:p-8"
        >
          {/* Question Type Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 capitalize">
              {currentQuestion.type.replace('-', ' ')}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-surface-alt text-text-muted">
              Domain {currentQuestion.domainId}
            </span>
          </div>

          {/* Case Study Intro */}
          {currentQuestion.type === 'case-study' && currentQuestion.caseStudy && (
            <div className="mb-6 p-4 bg-surface-alt/50 rounded-xl border border-border-hover">
              <p className="text-sm text-text-secondary">{currentQuestion.caseStudy.intro}</p>
            </div>
          )}

          {/* Scenario */}
          {currentQuestion.type === 'scenario' && (
            <div className="mb-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <p className="text-sm text-blue-300">Scenario</p>
              <p className="text-text-secondary mt-1">{currentQuestion.text}</p>
            </div>
          )}

          {/* Question Text */}
          {currentQuestion.type !== 'scenario' && currentQuestion.type !== 'case-study' && (
            <h2 className="text-lg lg:text-xl font-medium text-text-primary mb-6">
              {currentQuestion.text}
            </h2>
          )}

          {/* Case Study Part Question */}
          {currentQuestion.type === 'case-study' && currentQuestion.caseStudy && (
            <h2 className="text-lg font-medium text-text-primary mb-4">
              {currentQuestion.caseStudy.parts[caseStudyPart].question}
            </h2>
          )}

          {/* Drag-Drop / Match-Following Questions */}
          {currentQuestion.type === 'drag-drop' && currentQuestion.dragItems && (
            <DragDropQuestion
              type="drag-drop"
              dragItems={currentQuestion.dragItems}
              onAnswer={(answer) => {
                setDragReorderAnswer(answer as DragReorderAnswer);
                setShowExplanation(false);
              }}
              disabled={showExplanation}
            />
          )}
          {currentQuestion.type === 'match-following' && currentQuestion.matchPairs && (
            <DragDropQuestion
              type="match-following"
              matchPairs={currentQuestion.matchPairs}
              onAnswer={(answer) => {
                setMatchAnswer(answer as MatchFollowingAnswer);
                setShowExplanation(false);
              }}
              disabled={showExplanation}
            />
          )}

          {/* Regular Options */}
          {currentQuestion.type !== 'drag-drop' && currentQuestion.type !== 'match-following' && (
          <div className="space-y-3">
            {(currentQuestion.type === 'case-study' && currentQuestion.caseStudy
              ? currentQuestion.caseStudy.parts[caseStudyPart].options
              : currentQuestion.options
            ).map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = showExplanation && (
                (currentQuestion.type === 'case-study' && currentQuestion.caseStudy
                  ? currentQuestion.caseStudy.parts[caseStudyPart].correctAnswer
                  : currentQuestion.correctAnswer
                ) === idx
              );

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all min-h-[56px] ${
                    showExplanation && isCorrectOption
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : isSelected
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-border hover:border-indigo-500/50 bg-surface-card'
                  } ${showExplanation && isSelected && !isCorrectOption ? 'border-red-500 bg-red-500/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold min-w-[32px] min-h-[32px] ${
                      showExplanation && isCorrectOption
                        ? 'bg-emerald-500 text-white'
                        : isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-surface-alt text-text-muted'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-text-secondary">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
          )}

          {/* Explanation */}
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-surface-alt/50 rounded-xl border border-border-hover"
            >
              <p className="text-sm font-medium text-indigo-400 mb-1">Explanation</p>
              <p className="text-sm text-text-secondary">{currentQuestion.explanation}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {currentQuestion.concepts.map(c => (
                  <span key={c} className="text-xs px-2 py-1 rounded-full bg-surface-alt text-text-muted">
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Score so far */}
          <div className="mt-6 text-sm text-text-muted text-center">
            {answers.filter(a => a.isCorrect).length} correct so far
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          {/* Left: Previous button */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 min-h-[44px] min-w-[44px] bg-surface-card hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed text-text-primary rounded-xl border border-border transition-all text-sm font-medium active:scale-95"
          >
            ← Previous
          </button>

          {/* Center: Progress indicator */}
          <span className="text-sm text-text-muted hidden sm:block">
            {currentIndex + 1} of {sessionQuestions.length}
          </span>

          {/* Right: Check Answer + Next */}
          <div className="flex items-center gap-2">
            {canCheckAnswer && (
              <button
                onClick={() => setShowExplanation(true)}
                className="px-5 py-2.5 min-h-[44px] min-w-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all text-sm active:scale-95"
              >
                ✓ Check Answer
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`px-6 py-2.5 min-h-[44px] min-w-[44px] rounded-xl font-medium transition-all text-sm active:scale-95 ${
                canProceed
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-surface-alt text-text-muted cursor-not-allowed opacity-50'
              }`}
            >
              {isLastQuestion ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
