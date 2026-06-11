import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { TestEngine } from './pages/TestEngine';
import { Analytics } from './pages/Analytics';
import { Flashcards } from './pages/Flashcards';
import { Notes } from './pages/Notes';
import { StudyPlanner } from './pages/StudyPlanner';
import { KnowledgeMap } from './pages/KnowledgeMap';
import { QuestionReview } from './pages/QuestionReview';
import { Recommendations } from './pages/Recommendations';
import { Settings } from './pages/Settings';
import { LearningPath } from './pages/LearningPath';
import { getUserProgress } from './data/database';

function AppRoutes() {
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const progress = await getUserProgress();
      setHasOnboarded(progress?.completedOnboarding || false);
    } catch {
      setHasOnboarded(false);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🛡️</div>
          <p className="text-text-muted">Loading CISSP Coach...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
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
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to={hasOnboarded ? "/dashboard" : "/onboarding"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
