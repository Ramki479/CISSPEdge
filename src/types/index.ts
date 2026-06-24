export type PreparationLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type QuestionType = 'multiple-choice' | 'scenario' | 'true-false' | 'case-study' | 'drag-drop' | 'match-following';

export type TestMode = 'domain-wise' | 'full-exam' | 'quick-practice' | 'weak-area' | 'adaptive' | 'exam-simulation' | 'skills-assessment';

export type DomainClassification = 'strong' | 'moderate' | 'weak' | 'critical';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type SkillLevel = 'beginner' | 'developing' | 'competent' | 'proficient' | 'expert';

/**
 * The 17 CISSP skill areas for skills assessment.
 */
export const SKILL_AREAS = [
  'Information Security Governance',
  'Risk Management',
  'Security Architecture and Engineering',
  'Network Security',
  'Identity and Access Management (IAM)',
  'Security Operations',
  'Security Assessment and Testing',
  'Software Development Security',
  'Incident Response and Forensics',
  'Cloud Security',
  'Zero Trust Architecture',
  'Threat Modeling',
  'Business Continuity and Disaster Recovery',
  'Security Leadership and Communication',
  'Analytical and Critical Thinking',
  'Data Protection and Privacy',
  'Compliance and Legal',
] as const;

export type SkillArea = typeof SKILL_AREAS[number];

export interface SkillAreaMapping {
  skillArea: SkillArea;
  domainId: number;
  weight: number; // 0-100 relative importance within domain
}

/**
 * Maps the 17 skill areas to the 8 CISSP domains.
 */
export const SKILL_AREA_TO_DOMAIN: SkillAreaMapping[] = [
  { skillArea: 'Information Security Governance', domainId: 1, weight: 30 },
  { skillArea: 'Risk Management', domainId: 1, weight: 35 },
  { skillArea: 'Security Leadership and Communication', domainId: 1, weight: 20 },
  { skillArea: 'Compliance and Legal', domainId: 1, weight: 15 },
  { skillArea: 'Data Protection and Privacy', domainId: 2, weight: 100 },
  { skillArea: 'Security Architecture and Engineering', domainId: 3, weight: 50 },
  { skillArea: 'Cloud Security', domainId: 3, weight: 25 },
  { skillArea: 'Zero Trust Architecture', domainId: 3, weight: 25 },
  { skillArea: 'Network Security', domainId: 4, weight: 100 },
  { skillArea: 'Identity and Access Management (IAM)', domainId: 5, weight: 100 },
  { skillArea: 'Security Assessment and Testing', domainId: 6, weight: 100 },
  { skillArea: 'Security Operations', domainId: 7, weight: 40 },
  { skillArea: 'Incident Response and Forensics', domainId: 7, weight: 35 },
  { skillArea: 'Business Continuity and Disaster Recovery', domainId: 7, weight: 25 },
  { skillArea: 'Software Development Security', domainId: 8, weight: 60 },
  { skillArea: 'Threat Modeling', domainId: 8, weight: 40 },
  { skillArea: 'Analytical and Critical Thinking', domainId: 0, weight: 100 }, // cross-domain
];

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

export interface OptionExplanation {
  text: string;
  explanation: string; // why this option is right or wrong
}

export interface Question {
  id: string;
  domainId: number;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  text: string;
  options: string[];
  correctAnswer: number | number[];
  explanation: string;
  // Per-option detailed explanations for CISSP-level rationales
  optionExplanations?: OptionExplanation[];
  concepts: string[];
  // Skill areas this question assesses (maps to the 17 skill areas)
  skillAreas?: SkillArea[];
  scenario?: string;
  caseStudy?: { intro: string; parts: { question: string; options: string[]; correctAnswer: number; explanations?: string[] }[]; overallExplanation?: string };
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
  /** Question concepts captured at time of answering (e.g. ['CIA Triad', 'Confidentiality']) */
  concepts?: string[];
  /** Mapped topic ID from the learning content (e.g. 'cia-triad') */
  topicId?: string;
  /** Domain ID captured for efficient querying without joining questions table */
  domainId?: number;
}

export interface TestSession {
  id: string;
  mode: TestMode;
  domainId?: number;
  questions: string[]; // question ids
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

export interface SkillAssessment {
  skillArea: SkillArea;
  score: number; // 0-100
  questionsAttempted: number;
  correctAnswers: number;
  level: SkillLevel;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient-data';
  lastAssessed: number;
}

export interface KnowledgeGap {
  skillArea: SkillArea;
  gapScore: number; // 0-100, higher = bigger gap
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendedActions: string[];
  relatedConcepts: string[];
}

export interface UserProgress {
  level: PreparationLevel;
  totalXp: number;
  streak: number;
  lastActiveDate: string;
  badges: string[];
  completedOnboarding: boolean;
  onboardingDate?: number;
  soundEnabled: boolean;
  // Skills assessment data (cached per-skill scores)
  skillAssessments?: Record<string, { score: number; questionsAttempted: number; correctAnswers: number; lastAssessed: number }>;
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
  skillArea?: SkillArea;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  conceptsToReview: string[];
  suggestedQuestionCount: number;
  generatedAt: number;
}

export interface ExamReadinessReport {
  overallScore: number; // 0-100
  domainReadiness: { domainId: number; score: number; weight: number }[];
  skillAssessments: SkillAssessment[];
  knowledgeGaps: KnowledgeGap[];
  recommendedStudyPlan: string[];
  estimatedPassProbability: number;
  recommendedExamDate: string;
  strengths: string[];
  weaknesses: string[];
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

