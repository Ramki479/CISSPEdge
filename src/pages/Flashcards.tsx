import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlashcardsSkeleton } from '../components/ui/SkeletonCard';
import { ErrorState } from '../components/ui/ErrorState';
import { db } from '../data';
import { domains } from '../data/domains';
import { processReview, getDueCards, sortByPriority, getSpacedRepetitionStats } from '../utils/spacedRepetition';
import { playFlip } from '../utils/sounds';
import type { FlashCard, ReviewRating } from '../types';

/* ─── Easing ─────────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } };

/* ─── Initial data ────────────────────────────────────────────────────────── */
const initialFlashcards: Omit<FlashCard, 'id'>[] = [
  { domainId: 1, question: 'What is the CIA triad?', answer: 'Confidentiality, Integrity, Availability — the three core security objectives.', concepts: ['CIA Triad'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 1, question: 'What is the difference between BCP and DRP?', answer: 'BCP (Business Continuity Plan) ensures critical business functions continue during disruption. DRP (Disaster Recovery Plan) focuses on restoring IT systems after a disaster.', concepts: ['BCP', 'DRP'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 1, question: 'What is quantitative risk analysis?', answer: 'A risk assessment method that assigns numerical values (monetary) to risk components: SLE = AV × EF, ALE = SLE × ARO.', concepts: ['Risk Analysis', 'SLE', 'ALE'], bookmarked: false, difficulty: 'hard', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 2, question: 'What are the data lifecycle stages?', answer: 'Create/Classify → Store → Use → Share → Archive → Destroy.', concepts: ['Data Lifecycle'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 2, question: 'What is data sovereignty?', answer: 'Data is subject to the laws of the country where it is collected or stored.', concepts: ['Data Sovereignty'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 3, question: 'What is the Bell-LaPadula model?', answer: 'A confidentiality model: "no read up, no write down". Prevents information flow from higher to lower security levels.', concepts: ['Bell-LaPadula'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 3, question: 'What is the Biba model?', answer: 'An integrity model: "no write up, no read down". Prevents modification of higher integrity data by lower integrity subjects.', concepts: ['Biba Model'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 4, question: 'What is a VPN?', answer: 'A Virtual Private Network creates an encrypted tunnel over a public network, ensuring confidentiality and integrity of data in transit.', concepts: ['VPN'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 4, question: 'What is the OSI model?', answer: '7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.', concepts: ['OSI Model'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 5, question: 'What are the three authentication factors?', answer: 'Something you know (password), something you have (token), something you are (biometrics).', concepts: ['Authentication Factors'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 5, question: 'What is RBAC?', answer: 'Role-Based Access Control assigns permissions based on job roles rather than individuals, simplifying administration.', concepts: ['RBAC'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 6, question: 'What is the difference between SAST and DAST?', answer: 'SAST (Static) analyzes source code without running it. DAST (Dynamic) tests running applications.', concepts: ['SAST', 'DAST'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 6, question: 'What is a SIEM?', answer: 'Security Information and Event Management — collects and analyzes log data for real-time security monitoring and incident detection.', concepts: ['SIEM'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 7, question: 'What are the phases of Incident Response?', answer: 'Preparation → Detection & Analysis → Containment → Eradication → Recovery → Post-Incident Review.', concepts: ['Incident Response'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 7, question: 'What is RTO and RPO?', answer: 'RTO (Recovery Time Objective) = max acceptable downtime. RPO (Recovery Point Objective) = max acceptable data loss.', concepts: ['RTO', 'RPO'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 8, question: 'What is SQL injection?', answer: 'A code injection attack where malicious SQL statements are inserted into application queries. Prevent with parameterized queries and input validation.', concepts: ['SQL Injection'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 8, question: 'What is XSS?', answer: 'Cross-Site Scripting injects malicious scripts into web applications. Types: Stored, Reflected, DOM-based. Prevent with output encoding and CSP.', concepts: ['XSS'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
];

const RATING_LABELS: { rating: ReviewRating; label: string; color: string; shortcut: string }[] = [
  { rating: 0, label: 'Forgot', color: 'bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30', shortcut: '1' },
  { rating: 1, label: 'Hard', color: 'bg-[#ff007f]/20 text-[#ff007f] border-[#ff007f]/30', shortcut: '2' },
  { rating: 2, label: 'Struggled', color: 'bg-[#ffb800]/20 text-[#ffb800] border-[#ffb800]/30', shortcut: '3' },
  { rating: 3, label: 'Fair', color: 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/30', shortcut: '4' },
  { rating: 4, label: 'Good', color: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30', shortcut: '5' },
  { rating: 5, label: 'Perfect', color: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30', shortcut: '6' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const itemSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   FLASHCARDS
   ═══════════════════════════════════════════════════════════════════════════ */
export function Flashcards() {

  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<number | 'all'>('all');
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [ratingGiven, setRatingGiven] = useState<ReviewRating | null>(null);
  const [stats, setStats] = useState({ dueToday: 0, mastered: 0, newCards: 0, totalCards: 0 });
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newDomain, setNewDomain] = useState(1);
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  useEffect(() => { loadCards(); }, []);
  useEffect(() => { setStats(getSpacedRepetitionStats(cards)); }, [cards]);

  /* ─── Keyboard shortcuts ────────────────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      // Rating shortcuts 1-6 (only when card is flipped and not yet rated)
      if (flipped && ratingGiven === null && currentCard) {
        const ratingMap: Record<string, ReviewRating> = {
          '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5,
        };
        const rating = ratingMap[e.key];
        if (rating !== undefined) {
          e.preventDefault();
          handleRate(rating);
          return;
        }
      }

      // Arrow navigation
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' && currentIndex < filteredCards.length - 1) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }); // no deps — runs every render to always capture latest state


  const loadCards = async () => {
    try {
      const existing = await db.flashcards.toArray();
      if (existing.length === 0) {
        const newCards: FlashCard[] = initialFlashcards.map((c, i) => ({ ...c, id: `fc-${i}-${Date.now()}` }));
        await db.flashcards.bulkAdd(newCards);
        setCards(newCards);
      } else {
        setCards(existing);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createCustomCard = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    try {
      const card: FlashCard = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        domainId: newDomain,
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
        concepts: [],
        bookmarked: false,
        difficulty: newDifficulty,
        reviewCount: 0,
        easinessFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };
      await db.flashcards.add(card);
      setCards(prev => [...prev, card]);
      setShowNewCardForm(false);
      setNewQuestion('');
      setNewAnswer('');
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  };

  const toggleBookmark = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (card) {
      await db.flashcards.update(id, { bookmarked: !card.bookmarked });
      setCards(prev => prev.map(c => c.id === id ? { ...c, bookmarked: !c.bookmarked } : c));
    }
  };

  const handleRate = async (rating: ReviewRating) => {
    if (!currentCard || ratingGiven !== null) return;
    setRatingGiven(rating);
    const updates = processReview(currentCard, rating);
    await db.flashcards.update(currentCard.id, updates);
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, ...updates } : c));
  };

  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
      setRatingGiven(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setFlipped(false);
      setRatingGiven(null);
    }
  };

  function getFilteredCards(): FlashCard[] {
    let result = [...cards];
    if (selectedDomain !== 'all') result = result.filter(c => c.domainId === selectedDomain);
    if (showBookmarked) result = result.filter(c => c.bookmarked);
    if (showDueOnly) result = getDueCards(result);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.question.toLowerCase().includes(q) ||
        c.answer.toLowerCase().includes(q) ||
        c.concepts.some(con => con.toLowerCase().includes(q))
      );
    }
    return sortByPriority(result);
  }

  if (loading) return <FlashcardsSkeleton />;
  if (loadError) return <ErrorState message={loadError.message} onRetry={loadCards} />;

  const filteredCards = getFilteredCards();
  const currentCard = filteredCards[currentIndex];
  const nextReviewDate = currentCard?.nextReviewDue
    ? new Date(currentCard.nextReviewDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  const daysUntilReview = currentCard?.nextReviewDue
    ? Math.round((currentCard.nextReviewDue - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-3xl mx-auto pb-8 relative">
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
            <div className="absolute -top-10 -left-10 w-40 h-40 opacity-[0.06] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffb800] to-transparent rounded-full blur-3xl animate-float-delayed" />
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 relative">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffb800] to-[#ff6b00] rounded-xl opacity-20 blur-md animate-breathe" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffb800] to-[#ff6b00] rounded-xl opacity-40 flex items-center justify-center">
                    <span className="text-sm font-bold text-white font-mono">◐</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold tw-text-primary tracking-tight">Flashcards</h1>
                  <p className="text-[11px] text-white/70 mt-0.5 font-mono tracking-wide">
                    <span className="text-[#ffb800]">$</span> spaced-rep <span className="text-white/70">--mode</span> <span className="text-[#00f2fe]">sm-2</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <motion.div
                  whileHover={{ borderColor: 'rgba(0,242,254,0.3)' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1222]/90 backdrop-blur-sm border border-[#1e2840]/80 transition-all"
                >
                  <span className="text-[#00f2fe] text-xs">◉</span>
                  <span className="text-white text-xs font-mono tabular-nums font-semibold">{stats.dueToday}</span>
                  <span className="text-white/70 text-[10px] font-mono">due</span>
                </motion.div>
                <motion.div
                  whileHover={{ borderColor: 'rgba(255,184,0,0.3)' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1222]/90 backdrop-blur-sm border border-[#1e2840]/80 transition-all"
                >
                  <span className="text-[#ffb800] text-xs">◆</span>
                  <span className="text-white text-xs font-mono tabular-nums font-semibold">{stats.newCards}</span>
                  <span className="text-white/70 text-[10px] font-mono">new</span>
                </motion.div>
                <motion.div
                  whileHover={{ borderColor: 'rgba(16,185,129,0.3)' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1222]/90 backdrop-blur-sm border border-[#1e2840]/80 transition-all"
                >
                  <span className="text-[#10b981] text-xs">◆</span>
                  <span className="text-white text-xs font-mono tabular-nums font-semibold">{stats.mastered}</span>
                  <span className="text-white/70 text-[10px] font-mono">mastered</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* ═══ FILTERS ═══ */}
          <motion.div variants={itemSlide} className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/70 font-mono">◉</span>
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
                name="search-cards"
                placeholder="Search cards..."
                className="w-full bg-[#0d1222]/90 backdrop-blur-sm border border-[#1e2840]/80 text-[#8892a9] rounded-lg pl-7 pr-3 py-1.5 text-[11px] font-mono focus:outline-none focus:border-[#00f2fe]/50 placeholder:text-white/30"
              />
            </div>
            <select value={selectedDomain} onChange={e => { setSelectedDomain(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentIndex(0); setFlipped(false); setRatingGiven(null); }}
              className="bg-[#0d1222]/90 backdrop-blur-sm border border-[#1e2840]/80 text-[#8892a9] rounded-lg px-3 py-1.5 text-[11px] font-mono focus:outline-none focus:border-[#00f2fe]/50">
              <option value="all">All Domains</option>
              {domains.map(d => <option key={d.id} value={d.id}>D{d.id}: {d.shortName}</option>)}
            </select>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={SPRING_TAP}
              onClick={() => { setShowBookmarked(!showBookmarked); setCurrentIndex(0); setFlipped(false); setRatingGiven(null); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium font-mono transition-all ${
                showBookmarked ? 'bg-[#ffb800]/20 text-[#ffb800] border border-[#ffb800]/30' : 'bg-[#0d1222]/90 backdrop-blur-sm text-white/70 border border-[#1e2840]/80 hover:border-[#2a3654]'
              }`}>
              {showBookmarked ? '◆ Bookmarked' : '◇ All'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={SPRING_TAP}
              onClick={() => { setShowDueOnly(!showDueOnly); setCurrentIndex(0); setFlipped(false); setRatingGiven(null); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium font-mono transition-all ${
                showDueOnly ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/30' : 'bg-[#0d1222]/90 backdrop-blur-sm text-white/70 border border-[#1e2840]/80 hover:border-[#2a3654]'
              }`}>
              {showDueOnly ? '◉ Due Now' : '◯ All Cards'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 8px rgba(0,242,254,0.1)' }}
              whileTap={SPRING_TAP}
              onClick={() => setShowNewCardForm(true)}
              className="relative group px-3 py-1.5 rounded-lg text-[11px] font-medium font-mono overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 text-white flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </span>
            </motion.button>
            <span className="text-xs text-white/70 font-mono ml-auto tabular-nums tracking-wide">
              {filteredCards.length > 0 ? `${currentIndex + 1} / ${filteredCards.length}` : '—'}
            </span>
          </motion.div>

          {/* ═══ FLIPCARD ═══ */}
          <motion.div variants={itemSlide} className="relative" style={{ perspective: '1000px' }}>
            {currentCard ? (
              <>
                {/* Depth cards */}
                {currentIndex + 1 < filteredCards.length && (
                  <div className="absolute inset-x-4 -bottom-2 h-full bg-[#0a0e1a] rounded-xl border border-[#1e2840]/80 opacity-40" style={{ transform: 'translateY(4px) scale(0.98)', zIndex: 0 }} />
                )}
                {currentIndex + 2 < filteredCards.length && (
                  <div className="absolute inset-x-8 -bottom-4 h-full bg-[#080b14] rounded-xl border border-[#1e2840]/80 opacity-20" style={{ transform: 'translateY(8px) scale(0.96)', zIndex: -1 }} />
                )}

                <div
                  className="relative cursor-pointer"
                  onClick={() => { if (!ratingGiven) { setFlipped(!flipped); playFlip().catch(() => {}); } }}
                  style={{ transformStyle: 'preserve-3d', minHeight: '380px', zIndex: 1 }}
                >
                  {/* ── Front ── */}
                  <motion.div
                    initial={false}
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute inset-0 bg-[#0d1222]/90 backdrop-blur-sm rounded-xl border border-[#1e2840]/80 p-8 flex flex-col"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] via-[#ff007f] to-[#ffb800] rounded-t-xl opacity-40" />

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f2fe]/12 text-[#00f2fe] border border-[#00f2fe]/25 font-mono">D{currentCard.domainId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                        currentCard.difficulty === 'easy' ? 'bg-[#10b981]/12 text-[#10b981] border-[#10b981]/25' :
                        currentCard.difficulty === 'medium' ? 'bg-[#ffb800]/12 text-[#ffb800] border-[#ffb800]/25' : 'bg-[#ff6b6b]/12 text-[#ff6b6b] border-[#ff6b6b]/25'
                      }`}>{currentCard.difficulty}</span>
                      {currentCard.reviewCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#080b14] text-white/70 border border-[#1e2840]/60 font-mono">{currentCard.reviewCount} reviews</span>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-lg lg:text-xl text-white font-medium text-center leading-relaxed">
                        {currentCard.question}
                      </p>
                    </div>
                    <motion.p
                      className="text-center text-white/70 text-[11px] font-mono mt-4"
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      tap to reveal
                    </motion.p>
                  </motion.div>

                  {/* ── Back ── */}
                  <motion.div
                    initial={false}
                    animate={{ rotateY: flipped ? 0 : 180 }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute inset-0 bg-[#0d1222]/90 backdrop-blur-sm rounded-xl border border-[#1e2840]/80 p-8 flex flex-col"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', rotateY: 180 }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10b981] via-[#00f2fe] to-[#10b981] rounded-t-xl opacity-40" />

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/12 text-[#10b981] border border-[#10b981]/25 font-mono">Answer</span>
                      {currentCard.interval > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/25 font-mono">
                          next: {nextReviewDate} ({daysUntilReview !== null && daysUntilReview > 0 ? `+${daysUntilReview}d` : 'overdue'})
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-base text-[#8892a9] leading-relaxed">{currentCard.answer}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {currentCard.concepts.map(c => (
                        <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-[#080b14] text-white/70 border border-[#1e2840]/60 font-mono">{c}</span>
                      ))}
                    </div>

                    {ratingGiven === null ? (
                      <div className="mt-5 pt-4 border-t border-[#1e2840]/80">
                        <p className="text-center text-[11px] text-white/70 font-mono mb-3 tracking-wide">How well did you remember?</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {RATING_LABELS.map(r => (
                            <motion.button
                              key={r.rating}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); handleRate(r.rating); }}
                              className={`px-2.5 py-1 rounded text-[10px] font-medium font-mono border transition-all ${r.color}`}>
                              {r.label} <span className="opacity-50">{r.shortcut}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="mt-5 pt-4 border-t border-[#1e2840]/80 text-center"
                      >
                        <span className="text-[#10b981] text-xs font-medium font-mono flex items-center justify-center gap-1.5">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            ◆
                          </motion.span>
                          Rated: {RATING_LABELS.find(r => r.rating === ratingGiven)?.label}
                          {ratingGiven >= 3
                            ? ` — next in ${currentCard.interval > 0 ? `${currentCard.interval}d` : '1d'}`
                            : ' — review tomorrow'}
                        </span>
                        <p className="text-white/70 text-[10px] font-mono mt-1.5">tap 'Next' to continue</p>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="tw-card p-12 text-center"
              >
                <div className="relative w-12 h-12 mx-auto mb-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#ff007f] rounded-full opacity-20 blur-md animate-breathe" />
                  <span className="relative text-2xl block text-center text-white/70">◐</span>
                </div>
                <p className="text-white/70 font-mono text-sm">No cards to display.</p>
                {showDueOnly && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#10b981] text-xs font-mono mt-3 flex items-center justify-center gap-1.5"
                  >
                    <span>◆</span> All caught up! Great work.
                  </motion.p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* ═══ NAVIGATION CONTROLS ═══ */}
          {currentCard && (
            <motion.div variants={itemSlide} className="flex items-center justify-between gap-3">
              <motion.button
                whileHover={currentIndex > 0 ? { x: -2 } : {}}
                whileTap={currentIndex > 0 ? SPRING_TAP : {}}
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="relative group px-4 py-2.5 min-h-[38px] bg-[#0d1222]/80 hover:bg-[#111827] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl border border-[#1e2840]/80 transition-all text-[11px] font-mono"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleBookmark(currentCard.id)}
                className={`p-2 rounded-lg transition-all ${
                  currentCard.bookmarked
                    ? 'bg-[#ffb800]/20 text-[#ffb800] shadow-[0_0_8px_rgba(255,184,0,0.15)] ring-1 ring-[#ffb800]/30'
                    : 'bg-[#0d1222]/80 text-white/70 hover:text-[#8892a9] border border-[#1e2840]/80'
                }`}>
                {currentCard.bookmarked ? '◆' : '◇'}
              </motion.button>

              <motion.button
                whileHover={currentIndex < filteredCards.length - 1 ? { scale: 1.03, x: 2 } : {}}
                whileTap={currentIndex < filteredCards.length - 1 ? SPRING_TAP : {}}
                onClick={handleNext}
                disabled={currentIndex >= filteredCards.length - 1}
                className="relative group px-4 py-2.5 min-h-[38px] rounded-xl text-[11px] font-mono font-medium overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className={`absolute inset-0 transition-opacity duration-300 ${
                  currentIndex < filteredCards.length - 1
                    ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100'
                    : 'bg-[#0d1222] opacity-100'
                }`} />
                {currentIndex < filteredCards.length - 1 && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2fe]/30 to-[#4facfe]/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 ${
                  currentIndex < filteredCards.length - 1 ? 'text-white' : 'text-white/70'
                }`}>
                  Next
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ═══ NEW CARD MODAL ═══ */}
      <AnimatePresence>
        {showNewCardForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="tw-card p-6 w-full max-w-lg"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-5 bg-[#ffb800] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">Create Custom Card</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Question</label>
                  <textarea value={newQuestion} onChange={e => setNewQuestion(e.target.value)} rows={3}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors resize-none"
                    placeholder="Enter your question..." />
                </div>
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Answer</label>
                  <textarea value={newAnswer} onChange={e => setNewAnswer(e.target.value)} rows={3}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors resize-none"
                    placeholder="Enter the answer..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Domain</label>
                    <select value={newDomain} onChange={e => setNewDomain(Number(e.target.value))}
                      className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors">
                      {domains.map(d => <option key={d.id} value={d.id}>D{d.id}: {d.shortName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Difficulty</label>
                    <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1e2840]/80">
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(0,242,254,0.2)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => setShowNewCardForm(false)}
                  className="px-4 py-2.5 bg-[#080b14] text-[#8892a9] border border-[#1e2840]/80 rounded-lg text-xs font-mono hover:text-white transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 12px rgba(0,242,254,0.1)' }}
                  whileTap={SPRING_TAP}
                  onClick={createCustomCard}
                  className="relative group px-5 py-2.5 rounded-lg text-xs font-mono font-medium overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-white flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Card
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Flashcards;
