import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { searchCisspKnowledge, getQuickActions, generateDomainInsights } from '../utils/cisspMentor';
import { fetchTopicAnalytics } from '../data/database';
import type { FlashcardData, ComparisonData } from '../utils/cisspMentor';
import type { TopicAnalytics } from '../utils/topicMapping';
import { fetchDomainAnalytics } from '../data/database';
import type { MentorMessage, TutorMode, StructuredAnswer } from '../utils/cisspMentor';
import type { DomainAnalytics } from '../types';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;

const MODES: { value: TutorMode; label: string; icon: string; description: string }[] = [
  { value: 'learning', label: 'Learn', icon: '◉', description: 'Simple explanations with examples' },
  { value: 'exam', label: 'Exam', icon: '◈', description: 'CISSP-style answers & tips' },
  { value: 'mentor', label: 'Mentor', icon: '◆', description: 'Personalized coaching advice' },
  { value: 'practice', label: 'Practice', icon: '▸', description: 'Apply knowledge with scenarios' },
  { value: 'compare', label: 'Compare', icon: '⊕', description: 'Auto-detect related concept comparisons' },
];

const WELCOME_MESSAGES: Record<TutorMode, string> = {
  learning: "Hi! I'm your CISSP learning assistant. Ask me about any CISSP concept and I'll explain it simply with examples and exam tips.",
  exam: "Ready for exam-style learning? Ask me any CISSP question and I'll respond with the depth and perspective you need for the exam.",
  mentor: "I'm your CISSP coach. Ask me for study advice, topic recommendations, or personalized guidance based on your progress.",
  practice: "Practice mode active! Ask me to generate questions, test your knowledge, or apply concepts to real scenarios.",
  compare: "Compare mode on! Every answer includes auto-detected comparisons showing how each concept relates to and differs from related CISSP topics.",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Flashcard Viewer ──────────────────────────────────────────────────── */
function FlashcardViewer({ flashcards }: { flashcards: FlashcardData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = flashcards[currentIndex];

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex(i => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex(i => Math.min(flashcards.length - 1, i + 1));
  };

  if (!current) return null;

  return (
    <div className="space-y-2">
      {/* Counter */}
      <p className="text-[9px] font-mono text-white/30 text-center">
        {currentIndex + 1} / {flashcards.length}
      </p>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="relative w-full cursor-pointer select-none"
        style={{ minHeight: '140px' }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 p-4 bg-gradient-to-br from-[#0d1222] to-[#131b30] border border-[#00f0ff]/20 rounded-xl flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-[9px] font-mono text-[#00f0ff] mb-2 uppercase tracking-wider">Question</span>
            <p className="text-sm text-white/90 font-medium leading-relaxed">{current.front}</p>
            <p className="text-[8px] font-mono text-white/30 mt-3">Tap to flip</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 p-4 bg-gradient-to-br from-[#0d1222] to-[#1b1030] border border-[#8b5cf6]/20 rounded-xl flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-[9px] font-mono text-[#8b5cf6] mb-2 uppercase tracking-wider">Answer</span>
            <p className="text-sm text-white/90 leading-relaxed">{current.back}</p>
            <p className="text-[8px] font-mono text-white/30 mt-3">Tap to flip back</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-2 py-1 rounded text-[9px] font-mono text-white/40 border border-[#1e2840]/80 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          ◂ Prev
        </button>

        {/* Progress dots */}
        <div className="flex gap-1 px-2">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFlipped(false); setCurrentIndex(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-[#00f0ff] scale-125' : 'bg-[#1e2840] hover:bg-[#2a3a60]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="px-2 py-1 rounded text-[9px] font-mono text-white/40 border border-[#1e2840]/80 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          Next ▸
        </button>
      </div>
    </div>
  );
}


/* ─── Comparison Card ───────────────────────────────────────────────────── */
function ComparisonCard({ comparison }: { comparison: ComparisonData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#8b5cf6]/20 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-[#8b5cf6]/5 hover:bg-[#8b5cf6]/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-lg bg-[#8b5cf6]/15 flex items-center justify-center text-[8px] font-bold text-[#8b5cf6]">⊕</span>
          <span className="text-[10px] font-mono text-white/80 truncate">{comparison.conceptA} vs {comparison.conceptB}</span>
        </div>
        <span className={`text-[8px] text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-3 pb-3 space-y-2"
        >
          {/* Similarities */}
          {comparison.similarities.length > 0 && (
            <div className="p-2 bg-[#10b981]/5 border border-[#10b981]/15 rounded-lg">
              <p className="text-[8px] font-mono text-[#10b981] mb-1 uppercase tracking-wider">Similarities</p>
              <ul className="space-y-0.5">
                {comparison.similarities.map((s, i) => (
                  <li key={i} className="text-[9px] text-white/60 flex items-start gap-1.5">
                    <span className="text-[#10b981] mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Differences table */}
          <div className="overflow-hidden rounded-lg border border-[#1e2840]/80">
            <div className="grid grid-cols-3 gap-px bg-[#1e2840]/60">
              <div className="p-1.5 bg-[#0d1222]">
                <p className="text-[7px] font-mono text-white/40 uppercase tracking-wider">Aspect</p>
              </div>
              <div className="p-1.5 bg-[#0d1222]">
                <p className="text-[7px] font-mono text-[#00f0ff]/70 uppercase tracking-wider">{comparison.conceptA.split('(')[0].trim()}</p>
              </div>
              <div className="p-1.5 bg-[#0d1222]">
                <p className="text-[7px] font-mono text-[#ff00e4]/70 uppercase tracking-wider">{comparison.conceptB.split('(')[0].trim()}</p>
              </div>
              {comparison.differences.map((d, i) => (
                <div key={i} className="contents">
                  <div className="p-1.5 bg-[#0d1222]">
                    <p className="text-[8px] font-mono text-white/50">{d.aspect}</p>
                  </div>
                  <div className="p-1.5 bg-[#0d1222]">
                    <p className="text-[8px] font-mono text-white/70">{d.a}</p>
                  </div>
                  <div className="p-1.5 bg-[#0d1222]">
                    <p className="text-[8px] font-mono text-white/70">{d.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CISSP Tip */}
          <div className="p-2 bg-[#ffb800]/5 border border-[#ffb800]/15 rounded-lg">
            <p className="text-[7px] font-mono text-[#ffb800] mb-0.5 uppercase tracking-wider">Exam Tip</p>
            <p className="text-[8px] font-mono text-white/60 leading-relaxed">{comparison.cisspTip}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Structured Answer Card ────────────────────────────────────────────── */
function StructuredAnswerCard({ answer, onTopicClick }: { answer: StructuredAnswer; onTopicClick?: (domainId: number, topicId: string) => void }) {
  return (
    <div className="space-y-3">
      {/* Direct Answer */}
      <div>
        <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{answer.directAnswer}</p>
      </div>

      {/* Explanation */}
      <div className="p-3 bg-[#00f0ff]/5 border border-[#00f0ff]/15 rounded-lg">
        <p className="text-[10px] font-mono text-[#00f0ff] mb-1.5 tracking-wider uppercase">Explanation</p>
        <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{answer.explanation}</p>
      </div>

      {/* Example */}
      {answer.example && (
        <div className="p-3 bg-[#10b981]/5 border border-[#10b981]/15 rounded-lg">
          <p className="text-[10px] font-mono text-[#10b981] mb-1.5 tracking-wider uppercase">Example</p>
          <p className="text-xs text-white/70 leading-relaxed">{answer.example}</p>
        </div>
      )}

      {/* CISSP Perspective */}
      <div className="p-3 bg-[#ffb800]/5 border border-[#ffb800]/15 rounded-lg">
        <p className="text-[10px] font-mono text-[#ffb800] mb-1.5 tracking-wider uppercase">CISSP Perspective</p>
        <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{answer.cisspPerspective}</p>
      </div>

      {/* Comparisons — shown when compare mode is active */}
      {answer.comparisons && answer.comparisons.length > 0 && (
        <div className="p-3 bg-[#8b5cf6]/5 border border-[#8b5cf6]/15 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-[#8b5cf6] tracking-wider uppercase">⊕ Related Comparisons</span>
            <span className="text-[8px] font-mono text-white/30">{answer.comparisons.length}</span>
          </div>
          <div className="space-y-1.5">
            {answer.comparisons.map((comp, i) => (
              <ComparisonCard key={i} comparison={comp} />
            ))}
          </div>
        </div>
      )}

      {/* Flashcards */}
      {answer.flashcards && answer.flashcards.length > 0 && (
        <div className="p-3 bg-[#00f0ff]/5 border border-[#00f0ff]/15 rounded-lg">
          <p className="text-[10px] font-mono text-[#00f0ff] mb-2 tracking-wider uppercase">
            ◐ Flashcards
          </p>
          <FlashcardViewer flashcards={answer.flashcards} />
        </div>
      )}

      {/* Key Takeaways */}
      {answer.keyTakeaways.length > 0 && (
        <div className="p-3 bg-[#8b5cf6]/5 border border-[#8b5cf6]/15 rounded-lg">
          <p className="text-[10px] font-mono text-[#8b5cf6] mb-1.5 tracking-wider uppercase">Key Takeaways</p>
          <ul className="space-y-1">
            {answer.keyTakeaways.map((t, i) => (
              <li key={i} className="text-xs text-white/70 leading-relaxed flex items-start gap-2">
                <span className="text-[#8b5cf6] mt-0.5">◎</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Source */}
      {answer.source && (
        <p className="text-[9px] font-mono text-white/30 text-right">{answer.source}</p>
      )}

      {/* Related Topics */}
      {answer.relatedTopics && answer.relatedTopics.length > 0 && onTopicClick && (
        <div className="pt-2 border-t border-[#1e2840]/60">
          <p className="text-[9px] font-mono text-white/40 mb-1.5">Related Topics:</p>
          <div className="flex flex-wrap gap-1">
            {answer.relatedTopics.map(topic => (
              <button
                key={topic.topicId}
                onClick={() => onTopicClick(topic.domainId, topic.topicId)}
                className="text-[9px] px-1.5 py-0.5 rounded border border-[#00f0ff]/20 text-[#00f0ff]/70 hover:bg-[#00f0ff]/10 transition-all font-mono"
              >
                {topic.title.length > 24 ? topic.title.slice(0, 22) + '…' : topic.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Chat Message ───────────────────────────────────────────────────────── */
function ChatMessage({ message, onTopicClick }: { message: MentorMessage; onTopicClick?: (domainId: number, topicId: string) => void }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
        isUser
          ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/20'
          : 'bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] text-white font-bold'
      }`}>
        {isUser ? '◉' : '#'}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : ''}`}>
        {/* Mode badge */}
        {message.mode && !isUser && (
          <p className="text-[9px] font-mono text-white/30 mb-1">
            {MODES.find(m => m.value === message.mode)?.icon} {message.mode} mode
          </p>
        )}

        {/* Message bubble */}
        <div className={`rounded-xl p-3 ${
          isUser
            ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20'
            : 'bg-[#0d1222] border border-[#1e2840]/80'
        }`}>
          {message.structured ? (
            <StructuredAnswerCard answer={message.structured} onTopicClick={onTopicClick} />
          ) : (
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        <p className="text-[9px] font-mono text-white/20 mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI MENTOR PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export function AiMentor() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<TutorMode>('learning');
  const [loading, setLoading] = useState(false);
  const [domainAnalytics, setDomainAnalytics] = useState<DomainAnalytics[]>([]);
  const [topicAnalytics, setTopicAnalytics] = useState<TopicAnalytics[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const [explainLikeBeginner, setExplainLikeBeginner] = useState(false);
  const [deepDive, setDeepDive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const quickActions = getQuickActions();

  /* ─── Load user context ──────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      fetchDomainAnalytics(),
      fetchTopicAnalytics(),
    ]).then(([stats, topics]) => {
      setDomainAnalytics(stats);
      setTopicAnalytics(topics);
      setInsights(generateDomainInsights(stats));
    })
    .catch(() => {});
  }, []);

  /* ─── Scroll to bottom ───────────────────────────────────────────────── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ─── Handle send ────────────────────────────────────────────────────── */
  const handleSend = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const sendMode = deepDive ? 'exam' as TutorMode : explainLikeBeginner ? 'learning' as TutorMode : mode;

    const userMsg: MentorMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      mode: sendMode,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate a brief delay for better UX
    setTimeout(() => {
      const result = searchCisspKnowledge(trimmed, sendMode, domainAnalytics, topicAnalytics);

      const assistantMsg: MentorMessage = {
        id: generateId(),
        role: 'assistant',
        content: result.answer.directAnswer,
        timestamp: Date.now(),
        mode,
        structured: result.answer,
        sourceTopic: result.topic,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
    }, 300);
  }, [mode, loading, domainAnalytics, topicAnalytics, explainLikeBeginner, deepDive]);

  /* ─── Handle key press ───────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  /* ─── Handle topic click (navigate to learning path) ─────────────────── */
  const handleTopicClick = (domainId: number, topicId: string) => {
    navigate(`/learn/${domainId}/${topicId}`);
  };

  /* ─── Clear conversation ─────────────────────────────────────────────── */
  const handleClear = () => {
    setMessages([]);
    setInput('');
  };

  /* ─── Welcome state ──────────────────────────────────────────────────── */
  const hasMessages = messages.length > 0;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col relative">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-lg opacity-20 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-lg opacity-40 flex items-center justify-center">
              <span className="text-sm font-bold text-white font-mono">#</span>
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white font-mono tracking-tight">AI Mentor</h1>
            <p className="text-[9px] font-mono text-white/40">CISSP Expert Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {insights.length > 0 && (
            <button
              onClick={() => setShowInsights(!showInsights)}
              className={`px-2 py-1 rounded-lg text-[9px] font-mono border transition-all ${
                showInsights ? 'bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/25' : 'text-white/40 border-[#1e2840]/80 hover:text-white/60'
              }`}
            >
              ◈ Insights
            </button>
          )}
          {!deepDive && (
            <button
              onClick={() => { setExplainLikeBeginner(!explainLikeBeginner); if (explainLikeBeginner) setDeepDive(false); }}
              className={`px-2 py-1 rounded-lg text-[9px] font-mono border transition-all ${
                explainLikeBeginner
                  ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/25'
                  : 'text-white/40 border-[#1e2840]/80 hover:text-white/60'
              }`}
              title="Simplify explanations to beginner-friendly language"
            >
              {explainLikeBeginner ? '◉ Beginner Mode ON' : '◯ Explain Like Beginner'}
            </button>
          )}
          {!explainLikeBeginner && (
            <button
              onClick={() => { setDeepDive(!deepDive); if (deepDive) setExplainLikeBeginner(false); }}
              className={`px-2 py-1 rounded-lg text-[9px] font-mono border transition-all ${
                deepDive
                  ? 'bg-[#ff007f]/15 text-[#ff007f] border-[#ff007f]/25'
                  : 'text-white/40 border-[#1e2840]/80 hover:text-white/60'
              }`}
              title="Enable expert-level deep dive explanations with advanced technical detail"
            >
              {deepDive ? '◉ Deep Dive ON' : '◎ Deep Dive'}
            </button>
          )}
          {hasMessages && (
            <button onClick={handleClear} className="px-2 py-1 rounded-lg text-[9px] font-mono text-white/40 border border-[#1e2840]/80 hover:text-white/60 transition-all">
              ⊘ Clear
            </button>
          )}
        </div>
      </div>

      {/* ═══ INSIGHTS PANEL ═══ */}
      <AnimatePresence>
        {showInsights && insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="p-3 bg-[#8b5cf6]/5 border border-[#8b5cf6]/15 rounded-xl">
              <p className="text-[10px] font-mono text-[#8b5cf6] mb-1.5 tracking-wider uppercase">Your Learning Insights</p>
              <ul className="space-y-1">
                {insights.map((insight, i) => (
                  <li key={i} className="text-xs text-white/70 leading-relaxed flex items-start gap-2">
                    <span className="text-[#8b5cf6] mt-0.5">◇</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explain Like Beginner hint banner */}
      <AnimatePresence>
        {explainLikeBeginner && !deepDive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg">
              <span className="text-[#10b981] text-xs">◉</span>
              <p className="text-[10px] font-mono text-[#10b981]/80 leading-tight">
                Beginner mode active — all answers will be explained in simple, easy-to-understand language with basic examples.
              </p>
              <button
                onClick={() => setExplainLikeBeginner(false)}
                className="ml-auto px-2 py-0.5 text-[8px] font-mono text-white/40 border border-[#1e2840]/60 rounded hover:text-white/60 transition-all"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deep Dive hint banner */}
      <AnimatePresence>
        {deepDive && !explainLikeBeginner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-[#ff007f]/10 border border-[#ff007f]/20 rounded-lg">
              <span className="text-[#ff007f] text-xs">◎</span>
              <p className="text-[10px] font-mono text-[#ff007f]/80 leading-tight">
                Deep Dive active — responses include expert-level technical detail, advanced CISSP concepts, standards references, and in-depth analysis.
              </p>
              <button
                onClick={() => setDeepDive(false)}
                className="ml-auto px-2 py-0.5 text-[8px] font-mono text-white/40 border border-[#1e2840]/60 rounded hover:text-white/60 transition-all"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MODE SELECTOR ═══ */}
      <div className="flex gap-1 mb-3 flex-shrink-0">
        {MODES.map(m => {
          const effectiveMode = deepDive ? 'exam' : explainLikeBeginner ? 'learning' : mode;
          const isActive = m.value === effectiveMode;
          const isOverridden = (deepDive || explainLikeBeginner) && m.value === mode && m.value !== effectiveMode;
          return (
            <button
              key={m.value}
              onClick={() => {
                setMode(m.value);
                if (explainLikeBeginner && m.value !== 'learning') setExplainLikeBeginner(false);
                if (deepDive && m.value !== 'exam') setDeepDive(false);
              }}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-mono border transition-all ${
                isOverridden
                  ? deepDive
                    ? 'bg-[#ff007f]/10 text-[#ff007f]/70 border-[#ff007f]/20 opacity-60'
                    : 'bg-[#10b981]/10 text-[#10b981]/70 border-[#10b981]/20 opacity-60'
                  : isActive
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/25'
                    : 'text-white/40 border-[#1e2840]/80 hover:text-white/60 hover:border-[#1e2840]'
              }`}
              title={m.description}
            >
              <span className="block text-xs mb-0.5">{m.icon} {m.label}</span>
              <span className="block text-[7px] text-white/40 leading-tight">{m.description}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ MESSAGES ═══ */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {/* Welcome */}
            <div className="relative w-14 h-14 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-2xl opacity-20 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-2xl opacity-40 flex items-center justify-center">
                <span className="text-xl font-bold text-white font-mono">#</span>
              </div>
            </div>

            <h2 className="text-sm font-bold text-white font-mono mb-2">CISSP AI Mentor</h2>
            <p className="text-xs text-white/50 font-mono mb-6 max-w-md leading-relaxed">
              {WELCOME_MESSAGES[deepDive ? 'exam' : explainLikeBeginner ? 'learning' : mode]}
            </p>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full max-w-lg">
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  className="p-2 bg-[#0d1222] border border-[#1e2840]/80 rounded-lg text-left hover:border-[#00f0ff]/20 transition-all group"
                >
                  <span className="text-xs text-white/40 group-hover:text-[#00f0ff] transition-colors">{action.icon}</span>
                  <p className="text-[9px] text-white/60 font-mono mt-0.5 leading-tight">{action.label}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} onTopicClick={handleTopicClick} />
            ))}
          </AnimatePresence>
        )}

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-2"
          >
            <div className="w-5 h-5 rounded bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] flex items-center justify-center text-[8px] font-bold text-white font-mono">#</div>
            <div className="flex gap-1">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#ff00e4]" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══ INPUT AREA ═══ */}
      <div className="flex-shrink-0">
        <div className="flex items-end gap-2 bg-[#0d1222] border border-[#1e2840]/80 rounded-xl p-2 focus-within:border-[#00f0ff]/30 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask any CISSP question..."
            aria-label="Ask any CISSP question"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white/80 font-mono placeholder:text-white/20 resize-none outline-none px-2 py-1 max-h-32"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00f0ff] to-[#ff00e4] text-white text-xs font-bold font-mono hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            ▸ Send
          </button>
        </div>
        <p className="text-[8px] font-mono text-white/20 text-center mt-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

export default AiMentor;
