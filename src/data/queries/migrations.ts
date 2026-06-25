import { db } from '../db';
import { calculateDomainAnalytics } from '../../utils/analytics';
import type { FlashCard, StudyNote, UserProgress, Question } from '../../types';

/**
 * Compute domain analytics from all stored test sessions.
 * Delegates to analytics.ts for computation — avoids duplicating logic.
 *
 * Loads questions to build a questionId → domainId lookup map so that
 * analytics are scoped to the correct domain (rather than counting ALL
 * answers for every domain).
 *
 * @param domainId - If provided, returns analytics for a single domain.
 *   If omitted, returns analytics for all 8 CISSP domains.
 */
export async function fetchDomainAnalytics(domainId?: number) {
  const [allAnswers, allQuestions] = await Promise.all([
    db.answers.toArray(),
    db.questions.toArray(),
  ]);

  // Build a lookup map: questionId → domainId
  const questionDomainMap = new Map<string, number>();
  for (const q of allQuestions) {
    questionDomainMap.set(q.id, q.domainId);
  }

  if (domainId !== undefined) {
    return calculateDomainAnalytics(domainId, allAnswers, questionDomainMap);
  }
  const domainIds = [1, 2, 3, 4, 5, 6, 7, 8];
  return domainIds.map(id => calculateDomainAnalytics(id, allAnswers, questionDomainMap));
}

/* ─── Seed Data: auto-seed all tables on first mount ───────────────────── */

const SEED_FLASHCARDS: Omit<FlashCard, 'id'>[] = [
  { domainId: 1, question: 'What is the CIA triad?', answer: 'Confidentiality, Integrity, Availability — the three core security objectives.', concepts: ['CIA Triad'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 1, question: 'What is the difference between BCP and DRP?', answer: 'BCP ensures critical functions continue during disruption; DRP restores IT after disaster.', concepts: ['BCP', 'DRP'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 1, question: 'What is quantitative risk analysis?', answer: 'SLE = AV × EF, ALE = SLE × ARO. Assigns monetary values to risk.', concepts: ['Risk Analysis', 'SLE', 'ALE'], bookmarked: false, difficulty: 'hard', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 2, question: 'What are the data lifecycle stages?', answer: 'Create/Classify → Store → Use → Share → Archive → Destroy.', concepts: ['Data Lifecycle'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 2, question: 'What is data sovereignty?', answer: 'Data is subject to the laws of the country where it is collected or stored.', concepts: ['Data Sovereignty'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 3, question: 'What is the Bell-LaPadula model?', answer: 'A confidentiality model: "no read up, no write down".', concepts: ['Bell-LaPadula'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 3, question: 'What is the Biba model?', answer: 'An integrity model: "no write up, no read down".', concepts: ['Biba Model'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 4, question: 'What is a VPN?', answer: 'Encrypted tunnel over a public network ensuring confidentiality and integrity.', concepts: ['VPN'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 4, question: 'What is the OSI model?', answer: '7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.', concepts: ['OSI Model'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 5, question: 'What are the three authentication factors?', answer: 'Something you know, something you have, something you are.', concepts: ['Authentication Factors'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 5, question: 'What is RBAC?', answer: 'Role-Based Access Control — permissions based on job roles.', concepts: ['RBAC'], bookmarked: false, difficulty: 'easy', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 6, question: 'What is the difference between SAST and DAST?', answer: 'SAST analyzes source code statically; DAST tests running applications dynamically.', concepts: ['SAST', 'DAST'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 6, question: 'What is a SIEM?', answer: 'Security Information and Event Management — centralized log analysis for monitoring.', concepts: ['SIEM'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 7, question: 'What are the phases of Incident Response?', answer: 'Preparation → Detection → Containment → Eradication → Recovery → Post-Incident Review.', concepts: ['Incident Response'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 7, question: 'What is RTO and RPO?', answer: 'RTO = max acceptable downtime. RPO = max acceptable data loss.', concepts: ['RTO', 'RPO'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 8, question: 'What is SQL injection?', answer: 'Malicious SQL inserted into queries. Prevent with parameterized queries and input validation.', concepts: ['SQL Injection'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
  { domainId: 8, question: 'What is XSS?', answer: 'Cross-Site Scripting injects scripts into web apps. Prevent with output encoding and CSP.', concepts: ['XSS'], bookmarked: false, difficulty: 'medium', reviewCount: 0, easinessFactor: 2.5, interval: 0, repetitions: 0 },
];

const SEED_NOTES: Omit<StudyNote, 'id'>[] = [
  { domainId: 1, title: 'Risk Management Framework', content: 'NIST SP 800-37: Step 1 — Categorize, Step 2 — Select controls, Step 3 — Implement, Step 4 — Assess, Step 5 — Authorize, Step 6 — Monitor.', tags: ['risk', 'NIST', 'framework'], createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 2, isRevision: false },
  { domainId: 3, title: 'Crypto Basics', content: 'Symmetric = same key (AES, DES). Asymmetric = key pair (RSA, ECC). Hash = one-way (SHA-256). Digital signatures = sign with private, verify with public.', tags: ['cryptography', 'encryption'], createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 5, isRevision: false },
  { domainId: 4, title: 'OSI Model Memorization', content: 'Physical — Data Link — Network — Transport — Session — Presentation — Application. Mnemonic: Please Do Not Throw Sausage Pizza Away.', tags: ['OSI', 'networking'], createdAt: Date.now() - 86400000 * 14, updatedAt: Date.now() - 86400000 * 10, isRevision: false },
  { domainId: 7, title: 'Incident Response Steps', content: '1. Preparation — 2. Detection & Analysis — 3. Containment — 4. Eradication — 5. Recovery — 6. Post-Incident Activity. Document everything!', tags: ['incident response', 'IR'], createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 4, isRevision: false },
  { domainId: 8, title: 'OWASP Top 10 Highlights', content: '1. Broken Access Control 2. Crypto Failures 3. Injection 4. Insecure Design 5. Security Misconfiguration 6. Vulnerable Components 7. Auth Failures 8. Integrity Failures 9. Logging Failures 10. SSRF.', tags: ['OWASP', 'web security'], createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 86400000, isRevision: false },
];

/**
 * Internal duplicate of seedQuestionsIfNeeded to avoid cross-query import (Rule D).
 * Queries database.ts directly via db instead of importing from ./questions.
 */
async function _seedQuestions(): Promise<void> {
  try {
    const count = await db.questions.count();
    if (count > 0) return;

    const [bankModule, enhancedModule] = await Promise.all([
      import('../questionBank'),
      import('../enhancedQuestions'),
    ]);

    const allQuestions: Question[] = [
      ...bankModule.questions,
      ...enhancedModule.enhancedQuestions,
    ];

    await db.questions.bulkAdd(allQuestions);
  } catch {
    // Non-critical — questions table may be empty on first visit
  }
}

/**
 * Internal duplicate of getUserProgress to avoid cross-query import (Rule D).
 */
async function _getProgress(): Promise<UserProgress | null> {
  const all = await db.progress.toArray();
  return all.length > 0 ? all[0] : null;
}

/**
 * Internal duplicate of initializeUserProgress to avoid cross-query import (Rule D).
 */
async function _initProgress(level: UserProgress['level']): Promise<UserProgress> {
  const existing = await db.progress.toArray();
  if (existing.length > 0) {
    return existing[0];
  }
  const progress: UserProgress = {
    level,
    totalXp: 0,
    streak: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    badges: [],
    completedOnboarding: true,
    onboardingDate: Date.now(),
    soundEnabled: true,
  };
  await db.progress.add(progress);
  return progress;
}

export async function seedTestDataIfNeeded(): Promise<void> {
  try {
    // Seed questions first (this lazy-loads the question bank from dynamic import)
    await _seedQuestions();

    let progress = await _getProgress();
    if (!progress) {
      // Auto-initialize user if completely empty
      progress = await _initProgress('intermediate');
    }

    /* ── Seed flashcards (only if table is empty) ──────────────────────── */
    const existingCards = await db.flashcards.count();
    if (existingCards === 0) {
      const cards: FlashCard[] = SEED_FLASHCARDS.map((c, i) => ({
        ...c,
        id: `seed-fc-${i}-${Date.now()}`,
      }));
      await db.flashcards.bulkAdd(cards);
    }

    /* ── Seed notes (only if table is empty) ────────────────────────────── */
    const existingNotes = await db.notes.count();
    if (existingNotes === 0) {
      const notes: StudyNote[] = SEED_NOTES.map((n, i) => ({
        ...n,
        id: `seed-note-${i}-${Date.now()}`,
      }));
      await db.notes.bulkAdd(notes);
    }
  } catch {
    // Non-critical — seed failures should not block the app
  }
}
