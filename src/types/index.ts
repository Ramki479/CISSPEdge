export type PreparationLevel = 'beginner' | 'intermediate' | 'expert';

export type QuestionType = 'multiple-choice' | 'scenario' | 'true-false' | 'case-study' | 'drag-drop' | 'match-following';

export type TestMode = 'domain-wise' | 'full-exam' | 'quick-practice' | 'weak-area' | 'adaptive' | 'exam-simulation';

export type DomainClassification = 'strong' | 'moderate' | 'weak' | 'critical';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  requirement: { type: string; value: number };
}

export interface CisspDomain {
  id: number;
  name: string;
  shortName: string;
  description: string;
  weight: number; // percentage in exam
  color: string;
}

export interface DragDropItem {
  id: string;
  text: string;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  domainId: number;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: string[];
  correctAnswer: number | number[];
  explanation: string;
  concepts: string[];
  scenario?: string;
  caseStudy?: { intro: string; parts: { question: string; options: string[]; correctAnswer: number }[] };
  // Drag-drop: items in correct order
  dragItems?: DragDropItem[];
  // Match-following: pairs to match
  matchPairs?: MatchPair[];
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: number | number[] | null;
  isCorrect: boolean;
  timeSpent: number; // seconds
  timestamp: number;
  testSessionId: string;
}

export interface TestSession {
  id: string;
  mode: TestMode;
  domainId?: number;
  questions: string[]; // question ids
  answers: UserAnswer[];
  startedAt: number;
  completedAt?: number;
  score?: number;
  totalQuestions: number;
  correctCount: number;
}

export interface DomainAnalytics {
  domainId: number;
  questionsAttempted: number;
  correctAnswers: number;
  totalTimeSpent: number;
  accuracy: number;
  strengthScore: number;
  classification: DomainClassification;
}

export interface UserProgress {
  level: PreparationLevel;
  totalXp: number;
  streak: number;
  lastActiveDate: string;
  badges: string[];
  completedOnboarding: boolean;
  onboardingDate?: number;
}

export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5;

export interface FlashCard {
  id: string;
  domainId: number;
  question: string;
  answer: string;
  concepts: string[];
  bookmarked: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: number;
  reviewCount: number;
  nextReviewDue?: number;
  // Spaced repetition fields
  easinessFactor: number;
  interval: number; // days until next review
  repetitions: number; // consecutive correct answers
}

export interface StudyNote {
  id: string;
  domainId: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isRevision: boolean;
}

export interface StudyPlan {
  id: string;
  title: string;
  targetDate: number;
  dailyGoals: DailyGoal[];
  weeklyPlans: WeeklyPlan[];
  createdAt: number;
}

export interface DailyGoal {
  date: string;
  tasks: string[];
  completed: boolean;
  hoursPlanned: number;
}

export interface WeeklyPlan {
  weekOf: string;
  focusAreas: string[];
  hoursTarget: number;
}

export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  questionCount: number;
  domainId: number;
  xpReward: number;
  completed: boolean;
}

export interface LearningRecommendation {
  id: string;
  domainId: number;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  conceptsToReview: string[];
  suggestedQuestionCount: number;
  generatedAt: number;
}

export interface DragReorderAnswer {
  type: 'drag-reorder';
  orderedIds: string[];
}

export interface MatchFollowingAnswer {
  type: 'match-following';
  matches: Record<string, string>;
}

export interface KnowledgeMapNode {
  domainId: number;
  status: 'not-started' | 'in-progress' | 'mastered';
  topics: { name: string; status: 'pending' | 'completed' | 'weak' }[];
}
