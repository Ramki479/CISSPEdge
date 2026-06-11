import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../data/database';
import { domains } from '../data/questionBank';
import { processReview, getDueCards, sortByPriority, getSpacedRepetitionStats } from '../utils/spacedRepetition';
import type { FlashCard, ReviewRating } from '../types';

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
  { rating: 0, label: 'Forgot', color: 'bg-red-500/20 text-red-400 border-red-500/30', shortcut: '1' },
  { rating: 1, label: 'Hard', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', shortcut: '2' },
  { rating: 2, label: 'Struggled', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', shortcut: '3' },
  { rating: 3, label: 'Fair', color: 'bg-lime-500/20 text-lime-400 border-lime-500/30', shortcut: '4' },
  { rating: 4, label: 'Good', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', shortcut: '5' },
  { rating: 5, label: 'Perfect', color: 'bg-green-500/20 text-green-400 border-green-500/30', shortcut: '6' },
];

export function Flashcards() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<number | 'all'>('all');
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [ratingGiven, setRatingGiven] = useState<ReviewRating | null>(null);
  const [stats, setStats] = useState({ dueToday: 0, mastered: 0, newCards: 0, totalCards: 0 });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const existing = await db.flashcards.toArray();
    if (existing.length === 0) {
      const newCards: FlashCard[] = initialFlashcards.map((c, i) => ({
        ...c,
        id: `fc-${i}-${Date.now()}`,
      }));
      await db.flashcards.bulkAdd(newCards);
      setCards(newCards);
    } else {
      setCards(existing);
    }
  };

  useEffect(() => {
    setStats(getSpacedRepetitionStats(cards));
  }, [cards]);

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

    // Filter by domain
    if (selectedDomain !== 'all') {
      result = result.filter(c => c.domainId === selectedDomain);
    }

    // Filter by bookmark
    if (showBookmarked) {
      result = result.filter(c => c.bookmarked);
    }

    // Filter due only
    if (showDueOnly) {
      const dueCards = getDueCards(result);
      result = dueCards;
    }

    // Sort by spaced repetition priority
    return sortByPriority(result);
  }

  const filteredCards = getFilteredCards();
  const currentCard = filteredCards[currentIndex];
  const nextReviewDate = currentCard?.nextReviewDue
    ? new Date(currentCard.nextReviewDue).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const daysUntilReview = currentCard?.nextReviewDue
    ? Math.round((currentCard.nextReviewDue - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Flashcards</h1>
        {/* Spaced Repetition Stats */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400">
            <span className="font-bold">{stats.dueToday}</span> due
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-indigo-400">
            <span className="font-bold">{stats.newCards}</span> new
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-yellow-400">
            <span className="font-bold">{stats.mastered}</span> mastered
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedDomain}
          onChange={e => { setSelectedDomain(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentIndex(0); setFlipped(false); setRatingGiven(null); }}
          className="bg-surface-card border border-border text-text-secondary rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Domains</option>
          {domains.map(d => (
            <option key={d.id} value={d.id}>Domain {d.id}: {d.shortName}</option>
          ))}
        </select>
        <button
          onClick={() => { setShowBookmarked(!showBookmarked); setCurrentIndex(0); setFlipped(false); setRatingGiven(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showBookmarked ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-surface-card text-text-muted border border-border hover:border-border-hover'
          }`}
        >
          {showBookmarked ? '⭐ Bookmarked' : '☆ All'}
        </button>
        <button
          onClick={() => { setShowDueOnly(!showDueOnly); setCurrentIndex(0); setFlipped(false); setRatingGiven(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showDueOnly ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-surface-card text-text-muted border border-border hover:border-border-hover'
          }`}
        >
          {showDueOnly ? '📅 Due Now' : '📚 All Cards'}
        </button>
        <span className="text-sm text-gray-500 ml-auto">
          {filteredCards.length > 0 ? `${currentIndex + 1} / ${filteredCards.length}` : 'No cards'}
        </span>
      </div>

      {/* Flashcard — proper 3D flip with front/back faces */}
      <div className="perspective-1000" style={{ perspective: '1000px' }}>
        {currentCard ? (
          <div
            className="relative cursor-pointer"
            onClick={() => { if (!ratingGiven) setFlipped(!flipped); }}
            style={{ transformStyle: 'preserve-3d', minHeight: '320px' }}
          >
            {/* Front face — Question */}
            <motion.div
              initial={false}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-surface-card rounded-2xl border border-border p-8"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400">
                  Domain {currentCard.domainId}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  currentCard.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                  currentCard.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {currentCard.difficulty}
                </span>
                {currentCard.reviewCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-surface-alt text-text-muted">
                    {currentCard.reviewCount} reviews
                  </span>
                )}
              </div>
              <p className="text-xl text-text-primary font-medium text-center mt-8">
                {currentCard.question}
              </p>
              <p className="text-center text-text-muted text-sm mt-8">Tap to reveal answer</p>
            </motion.div>

            {/* Back face — Answer + Rating (pre-rotated 180° so it reads normally when visible) */}
            <motion.div
              initial={false}
              animate={{ rotateY: flipped ? 0 : 180 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-surface-card rounded-2xl border border-border p-8"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                rotateY: 180,  // pre-counter-rotate so text reads forward when flipped visible
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Answer</span>
                {currentCard.interval > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400">
                    Next review: {nextReviewDate} ({daysUntilReview !== null && daysUntilReview > 0 ? `in ${daysUntilReview}d` : 'overdue'})
                  </span>
                )}
              </div>
              <p className="text-lg text-text-secondary mt-6">{currentCard.answer}</p>
              <div className="flex flex-wrap gap-2 mt-6">
                {currentCard.concepts.map(c => (
                  <span key={c} className="text-xs px-2 py-1 rounded-full bg-surface-alt text-text-muted">{c}</span>
                ))}
              </div>

              {/* Spaced Repetition Rating */}
              {ratingGiven === null ? (
                <div className="mt-8">
                  <p className="text-center text-sm text-text-muted mb-3">How well did you remember?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {RATING_LABELS.map(r => (
                      <button
                        key={r.rating}
                        onClick={(e) => { e.stopPropagation(); handleRate(r.rating); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-105 ${r.color}`}
                      >
                        {r.label} ({r.shortcut})
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-center"
                >
                  <span className="text-emerald-400 text-sm font-medium">
                    Rated: {RATING_LABELS.find(r => r.rating === ratingGiven)?.label} ✓
                    {ratingGiven >= 3
                      ? ` — Next review in ${currentCard.interval > 0 ? `${currentCard.interval} days` : '1 day'}`
                      : ' — Will review again tomorrow'}
                  </span>
                  <p className="text-text-muted text-xs mt-2">Tap "Next" to continue</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        ) : (
          <div className="bg-surface-card rounded-2xl border border-border p-8 text-center">
            <p className="text-text-muted">No flashcards to display.</p>
            {showDueOnly && filteredCards.length === 0 && (
              <p className="text-emerald-400 text-sm mt-2">✨ All caught up! No cards due for review.</p>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {currentCard && (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 bg-surface-card hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed text-text-primary rounded-xl border border-border transition-all"
          >
            ← Previous
          </button>
          <button
            onClick={() => toggleBookmark(currentCard.id)}
            className={`p-2.5 rounded-xl transition-all ${
              currentCard.bookmarked
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-surface-card text-text-muted hover:text-text-secondary border border-border'
            }`}
          >
            {currentCard.bookmarked ? '⭐' : '☆'}
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= filteredCards.length - 1}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
