import { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { getUserProgress, seedTestDataIfNeeded } from './data/database';
import { ErrorBoundary } from './components/ErrorBoundary';

// Route-level code-split pages (loaded on demand)
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TestEngine = lazy(() => import('./pages/TestEngine'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const Notes = lazy(() => import('./pages/Notes'));
const StudyPlanner = lazy(() => import('./pages/StudyPlanner'));
const KnowledgeMap = lazy(() => import('./pages/KnowledgeMap'));
const QuestionReview = lazy(() => import('./pages/QuestionReview'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const SkillsAssessment = lazy(() => import('./pages/SkillsAssessment'));
const Settings = lazy(() => import('./pages/Settings'));
const LearningPath = lazy(() => import('./pages/LearningPath'));
const TopicDetail = lazy(() => import('./pages/TopicDetail'));
const AiMentor = lazy(() => import('./pages/AiMentor'));
const StudyCoach = lazy(() => import('./pages/StudyCoach'));

function AppRoutes() {
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      // Animate loading progress
      const interval = setInterval(() => {
        setLoadProgress(prev => Math.min(prev + Math.random() * 20, 90));
      }, 200);

      // Always ensure database is seeded first
      await seedTestDataIfNeeded().catch(() => {});

      const progress = await getUserProgress();
      clearInterval(interval);
      setLoadProgress(100);
      setHasOnboarded(progress?.completedOnboarding || false);

      // Brief delay for the animation to complete
      await new Promise(r => setTimeout(r, 400));
    } catch {
      setHasOnboarded(false);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b14] flex items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/[0.03] to-[#ff00e4]/[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f0ff]/[0.02] rounded-full blur-3xl" />

        <div className="relative text-center">
          {/* Animated logo */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-xl opacity-20 blur-md animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-xl opacity-40" />
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white font-mono">#</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
            CISSP Edge
          </h1>
          <p className="text-sm text-white/70 font-mono mb-8">
            Initializing secure environment...
          </p>

          {/* Progress bar */}
          <div className="w-48 mx-auto">
            <div className="h-[2px] bg-[#1e2840] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ff00e4]"
                initial={{ width: '0%' }}
                animate={{ width: `${loadProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-white/70 font-mono mt-2">
              {Math.round(loadProgress)}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Suspense fallback={<LoadingScreen count={3} label="Loading page..." />}>
      <Routes>
        <Route
          path="/onboarding"
          element={hasOnboarded ? <Navigate to="/dashboard" replace /> : <Onboarding />}
        />
        <Route
          path="/learning-path/:level"
          element={hasOnboarded ? <LearningPath /> : <Navigate to="/onboarding" replace />}
        />
        <Route
          element={hasOnboarded ? <Layout /> : <Navigate to="/onboarding" replace />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/test" element={<TestEngine />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/study-planner" element={<StudyPlanner />} />
          <Route path="/knowledge-map" element={<KnowledgeMap />} />
          <Route path="/review" element={<QuestionReview />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/skills-assessment" element={<SkillsAssessment />} />
          <Route path="/learn" element={<LearningPath />} />
          <Route path="/learn/:domainId/:topicId" element={<TopicDetail />} />
          <Route path="/study-coach" element={<StudyCoach />} />
          <Route path="/mentor" element={<AiMentor />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to={hasOnboarded ? "/dashboard" : "/onboarding"} replace />} />
      </Routes>
      </Suspense>
    </HashRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary fallbackTitle="Application Error" fallbackMessage="CISSP Edge encountered an unexpected error.">
        <AppRoutes />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
