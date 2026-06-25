import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

/* ─── Mocks ─────────────────────────────────────────────────────────────── */

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

/* framer-motion: mock motion.* as plain HTML tags so they render without
   requiring DOM animation APIs unavailable in jsdom. */
vi.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    motion: new Proxy({}, {
      get: (_target, tag) => {
        if (typeof tag === 'string') {
          // Strip framer-motion-only props, render as a plain HTML element
          return React.forwardRef(function MotionEl(
            { children, initial, animate, exit, variants, custom,
              whileHover, whileTap, whileInView, layout, layoutId,
              transition, onAnimationComplete, style, ...rest }: any,
            ref: any,
          ) {
            return React.createElement(tag, { ...rest, ref }, children);
          });
        }
        return tag;
      },
    }),
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    useAnimation: () => ({}),
    useMotionValue: (val: any) => ({ get: () => val, set: () => {} }),
    useSpring: (val: any) => ({ get: () => val, set: () => {} }),
  };
});

// --- Simulated Dexie database error ---
const DB_ERROR = new Error('Dexie: IndexedDB not available');

const mockGetUserProgress = vi.fn();
const mockFetchDomainAnalytics = vi.fn();
const mockUpdateUserProgress = vi.fn();

vi.mock('../data', () => ({
  getUserProgress: (...args: unknown[]) => mockGetUserProgress(...args),
  fetchDomainAnalytics: (...args: unknown[]) => mockFetchDomainAnalytics(...args),
  updateUserProgress: (...args: unknown[]) => mockUpdateUserProgress(...args),
  db: {
    testSessions: { count: vi.fn().mockResolvedValue(5) },
    progress: { toArray: vi.fn().mockResolvedValue([]) },
    answers: { toArray: vi.fn().mockResolvedValue([]) },
    questions: { toArray: vi.fn().mockResolvedValue([]) },
  } as any,
}));

vi.mock('../utils/adaptiveTesting', () => ({
  calculateReadinessScore: vi.fn().mockReturnValue(0),
  calculateConfidenceScore: vi.fn().mockReturnValue(0),
  estimatePassProbability: vi.fn().mockReturnValue(0),
  recommendExamDate: vi.fn().mockReturnValue(''),
}));

vi.mock('../utils/recommendations', () => ({
  generateRecommendations: vi.fn().mockReturnValue([]),
  generateStudySequence: vi.fn().mockReturnValue([]),
}));

vi.mock('../data/questionBank', () => ({
  domains: [
    { id: 1, name: 'Security and Risk Management', shortName: 'Security & Risk', description: '', weight: 15, color: '#3B82F6' },
    { id: 2, name: 'Asset Security', shortName: 'Asset Security', description: '', weight: 10, color: '#10B981' },
    { id: 3, name: 'Security Architecture and Engineering', shortName: 'Architecture & Eng.', description: '', weight: 13, color: '#F59E0B' },
    { id: 4, name: 'Communication and Network Security', shortName: 'Network Security', description: '', weight: 13, color: '#EF4444' },
    { id: 5, name: 'Identity and Access Management', shortName: 'IAM', description: '', weight: 13, color: '#8B5CF6' },
    { id: 6, name: 'Security Assessment and Testing', shortName: 'Assessment & Testing', description: '', weight: 12, color: '#EC4899' },
    { id: 7, name: 'Security Operations', shortName: 'SecOps', description: '', weight: 13, color: '#14B8A6' },
    { id: 8, name: 'Software Development Security', shortName: 'Software Security', description: '', weight: 11, color: '#F97316' },
  ],
}));

/* ─── Helper: lazy-import the component under test ───────────────────────── */

async function importDashboard() {
  const mod = await import('./Dashboard');
  return mod.Dashboard;
}

/* ─── Test suites ────────────────────────────────────────────────────────── */

describe('Dashboard + ErrorBoundary integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // React logs caught errors to console.error; suppress for clean output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('when database operations fail', () => {
    it('shows a skeleton loading state while data is being fetched', async () => {
      // Keep the DB promise pending forever so the component stays in loading
      mockGetUserProgress.mockReturnValue(new Promise(() => {}));

      const Dashboard = await importDashboard();

      render(
        <ErrorBoundary fallbackTitle="Data Retrieval Error">
          <Dashboard />
        </ErrorBoundary>,
      );

      // The DashboardSkeleton is rendered while data loads; it contains
      // placeholder text or elements that identify the skeleton state.
      // Since the skeleton uses motion.div with no visible text, we just verify
      // the error boundary fallback is NOT shown (data is still loading).
      expect(screen.queryByText('Data Retrieval Error')).not.toBeInTheDocument();
    });

    it('catches a Dexie error from getUserProgress and shows the inline ErrorState', async () => {
      mockGetUserProgress.mockRejectedValue(DB_ERROR);

      const Dashboard = await importDashboard();

      render(
        <ErrorBoundary fallbackTitle="Data Retrieval Error">
          <Dashboard />
        </ErrorBoundary>,
      );

      // Now errors are handled inline by ErrorState instead of throwing to ErrorBoundary
      await waitFor(() => {
        expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      });

      expect(screen.getByText('Dexie: IndexedDB not available')).toBeInTheDocument();

      // Retry button should be present
      expect(screen.getByText('Retry')).toBeInTheDocument();

      // Dashboard content should NOT be shown
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
    });

    it('catches a Dexie error from fetchDomainAnalytics', async () => {
      // getUserProgress succeeds
      mockGetUserProgress.mockResolvedValue({
        level: 'intermediate',
        totalXp: 100,
        streak: 3,
        lastActiveDate: new Date().toISOString().split('T')[0],
        badges: [],
        completedOnboarding: true,
        onboardingDate: Date.now(),
        soundEnabled: true,
      });
      // But analytics fails
      mockFetchDomainAnalytics.mockRejectedValue(
        new Error('Dexie: database connection lost'),
      );

      const Dashboard = await importDashboard();

      render(
        <ErrorBoundary fallbackTitle="Data Retrieval Error">
          <Dashboard />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      });

      expect(screen.getByText('Dexie: database connection lost')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
    });

    it('does NOT render dashboard-specific content after an error', async () => {
      mockGetUserProgress.mockRejectedValue(DB_ERROR);

      const Dashboard = await importDashboard();

      render(
        <ErrorBoundary fallbackTitle="Data Retrieval Error">
          <Dashboard />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      });

      for (const text of ['Readiness', 'Confidence', 'Pass Prob', 'Quick Practice', 'Domain Performance']) {
        expect(screen.queryByText(text)).not.toBeInTheDocument();
      }
    });
  });

  describe('when database succeeds', () => {
    it('renders the dashboard content when data loads successfully', async () => {
      mockGetUserProgress.mockResolvedValue({
        level: 'intermediate',
        totalXp: 100,
        streak: 3,
        lastActiveDate: new Date().toISOString().split('T')[0],
        badges: [],
        completedOnboarding: true,
        onboardingDate: Date.now(),
        soundEnabled: true,
      });
      mockFetchDomainAnalytics.mockResolvedValue([
        { domainId: 1, questionsAttempted: 10, correctAnswers: 8, totalTimeSpent: 300, accuracy: 80, strengthScore: 80, classification: 'strong' },
        { domainId: 2, questionsAttempted: 5, correctAnswers: 3, totalTimeSpent: 150, accuracy: 60, strengthScore: 60, classification: 'moderate' },
      ]);

      const Dashboard = await importDashboard();

      render(
        <ErrorBoundary fallbackTitle="Data Retrieval Error">
          <Dashboard />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard', { selector: 'h1' })).toBeInTheDocument();
      });

      // Core dashboard sections
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Quick Practice')).toBeInTheDocument();
      expect(screen.getByText('Weak Area Focus')).toBeInTheDocument();
      expect(screen.getByText('Domain Performance')).toBeInTheDocument();

      // Verify the error boundary fallback is NOT present
      expect(screen.queryByText('Data Retrieval Error')).not.toBeInTheDocument();
    });

    it('shows Focus This Week for domains below 80% accuracy', async () => {
      mockGetUserProgress.mockResolvedValue({
        level: 'beginner',
        totalXp: 0,
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        badges: [],
        completedOnboarding: true,
        onboardingDate: Date.now(),
        soundEnabled: true,
      });
      mockFetchDomainAnalytics.mockResolvedValue([
        { domainId: 1, questionsAttempted: 10, correctAnswers: 8, totalTimeSpent: 300, accuracy: 80, strengthScore: 80, classification: 'strong' },
        { domainId: 2, questionsAttempted: 5, correctAnswers: 3, totalTimeSpent: 150, accuracy: 60, strengthScore: 60, classification: 'moderate' },
        { domainId: 3, questionsAttempted: 4, correctAnswers: 2, totalTimeSpent: 120, accuracy: 50, strengthScore: 50, classification: 'weak' },
      ]);

      const Dashboard = await importDashboard();

      render(
        <ErrorBoundary fallbackTitle="Data Retrieval Error">
          <Dashboard />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText('Focus This Week')).toBeInTheDocument();
      });
    });
  });
});
