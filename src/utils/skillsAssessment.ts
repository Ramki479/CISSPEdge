import type { SkillArea, SkillAssessment, SkillLevel, KnowledgeGap, ExamReadinessReport, UserAnswer, Question, DomainAnalytics } from '../types';
import { SKILL_AREAS, SKILL_AREA_TO_DOMAIN } from '../types';
import { domains } from '../data/questionBank';

/* ─── Skill Level Thresholds ─────────────────────────────────────────────── */
const SKILL_LEVEL_THRESHOLDS: { level: SkillLevel; minScore: number }[] = [
  { level: 'expert', minScore: 90 },
  { level: 'proficient', minScore: 75 },
  { level: 'competent', minScore: 60 },
  { level: 'developing', minScore: 40 },
  { level: 'beginner', minScore: 0 },
];

export function getSkillLevel(score: number): SkillLevel {
  for (const t of SKILL_LEVEL_THRESHOLDS) {
    if (score >= t.minScore) return t.level;
  }
  return 'beginner';
}

/* ─── Difficulty Weights for Scoring ──────────────────────────────────── */
const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.3,
};

/* ─── Calculate skill scores from answers ─────────────────────────────────── */
export interface SkillScoreInput {
  questionId: string;
  domainId: number;
  difficulty: string;
  isCorrect: boolean;
  skillAreas?: SkillArea[];
  timeSpent: number;
}

/**
 * Calculate skill assessments from a collection of answered questions.
 * Uses weighted scoring: harder questions count more, correct answers increase score,
 * and questions map to one or more skill areas.
 */
export function calculateSkillAssessments(
  history: SkillScoreInput[],
  previousAssessments?: Record<string, { score: number; questionsAttempted: number; correctAnswers: number; lastAssessed: number }>
): SkillAssessment[] {
  // Build raw scores per skill area
  const skillData: Record<string, { attempts: number; correct: number; weightedScore: number; timestamps: number[] }> = {};

  for (const skill of SKILL_AREAS) {
    skillData[skill] = { attempts: 0, correct: 0, weightedScore: 0, timestamps: [] };
  }

  // If we have previous assessments, incorporate them (decayed)
  if (previousAssessments) {
    const now = Date.now();
    for (const [skill, data] of Object.entries(previousAssessments)) {
      if (skillData[skill]) {
        // Decay previous score by 5% per week since last assessment
        const weeksSince = (now - data.lastAssessed) / (7 * 86400000);
        const decayFactor = Math.max(0.7, 1 - weeksSince * 0.05);
        skillData[skill] = {
          attempts: data.questionsAttempted,
          correct: data.correctAnswers,
          weightedScore: data.score * decayFactor * data.correctAnswers,
          timestamps: [data.lastAssessed],
        };
      }
    }
  }

  // Process new answers
  for (const answer of history) {
    if (!answer.isCorrect) continue;
    const multiplier = DIFFICULTY_MULTIPLIER[answer.difficulty] || 1.0;
    const areas = answer.skillAreas && answer.skillAreas.length > 0
      ? answer.skillAreas
      : [getDefaultSkillAreaForDomain(answer.domainId)];

    for (const area of areas) {
      if (skillData[area]) {
        skillData[area].attempts++;
        skillData[area].correct++;
        skillData[area].weightedScore += 100 * multiplier;
        skillData[area].timestamps.push(Date.now());
      }
    }

    // Also track incorrect (attempts only)
    if (!answer.isCorrect) {
      const areasForIncorrect = answer.skillAreas && answer.skillAreas.length > 0
        ? answer.skillAreas
        : [getDefaultSkillAreaForDomain(answer.domainId)];
      for (const area of areasForIncorrect) {
        if (skillData[area]) {
          skillData[area].attempts++;
        }
      }
    }
  }

  // Calculate final scores
  const assessments: SkillAssessment[] = [];
  for (const skill of SKILL_AREAS) {
    const data = skillData[skill];
    const maxPossible = data.attempts * 100 * 1.3; // max multiplier
    const rawScore = maxPossible > 0 ? (data.weightedScore / maxPossible) * 100 : 0;
    const score = data.correct > 0 ? Math.min(100, Math.round(rawScore)) : 0;

    // Determine trend based on recent vs older accuracy
    let trend: SkillAssessment['trend'] = 'insufficient-data';
    if (data.correct >= 4 && data.attempts >= 4) {
      // Compare first half vs second half accuracy as a simple trend indicator
      const recentCorrectRatio = Math.min(1, data.correct / Math.max(1, data.attempts));
      // If they have a decent score and have been answering, trend is stable by default
      if (recentCorrectRatio >= 0.7) trend = 'improving';
      else if (recentCorrectRatio >= 0.4) trend = 'stable';
      else trend = 'declining';
    } else if (data.attempts >= 2) {
      trend = 'stable';
    }

    assessments.push({
      skillArea: skill as SkillArea,
      score,
      questionsAttempted: data.attempts,
      correctAnswers: data.correct,
      level: getSkillLevel(score),
      trend,
      lastAssessed: data.timestamps.length > 0 ? Math.max(...data.timestamps) : 0,
    });
  }

  return assessments.sort((a, b) => a.score - b.score);
}

function getDefaultSkillAreaForDomain(domainId: number): SkillArea {
  const mapping = SKILL_AREA_TO_DOMAIN.find(m => m.domainId === domainId);
  return mapping?.skillArea || 'Analytical and Critical Thinking';
}

/* ─── Knowledge Gap Analysis ──────────────────────────────────────────────── */
export function identifyKnowledgeGaps(assessments: SkillAssessment[]): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = [];

  for (const assessment of assessments) {
    const gapScore = 100 - assessment.score;
    if (gapScore < 15) continue; // No significant gap

    let priority: KnowledgeGap['priority'];
    if (gapScore >= 50) priority = 'critical';
    else if (gapScore >= 35) priority = 'high';
    else if (gapScore >= 20) priority = 'medium';
    else priority = 'low';

    gaps.push({
      skillArea: assessment.skillArea,
      gapScore,
      priority,
      recommendedActions: getRecommendedActions(assessment.skillArea, gapScore),
      relatedConcepts: getConceptsForSkillArea(assessment.skillArea),
    });
  }

  return gaps.sort((a, b) => b.gapScore - a.gapScore);
}

function getRecommendedActions(skillArea: SkillArea, gapScore: number): string[] {
  const actions: string[] = [];
  if (gapScore >= 50) {
    actions.push(`Start with foundational concepts in ${skillArea}`);
    actions.push('Take domain-specific practice tests');
    actions.push('Review CISSP official study guide chapters on this topic');
  } else if (gapScore >= 30) {
    actions.push(`Practice scenario-based questions in ${skillArea}`);
    actions.push('Focus on understanding core principles and frameworks');
    actions.push('Create revision notes for key concepts');
  } else {
    actions.push(`Review advanced topics in ${skillArea}`);
    actions.push('Attempt harder difficulty questions to deepen understanding');
  }
  return actions;
}

/* ─── Concepts mapping for skill areas ────────────────────────────────────── */
function getConceptsForSkillArea(skillArea: SkillArea): string[] {
  const conceptMap: Record<SkillArea, string[]> = {
    'Information Security Governance': ['Security governance', 'Organizational processes', 'Security policies', 'Due diligence', 'Due care', 'Security frameworks', 'Roles and responsibilities'],
    'Risk Management': ['Risk assessment', 'Risk analysis', 'Risk treatment', 'Risk appetite', 'Quantitative risk', 'Qualitative risk', 'NIST CSF', 'ISO 31000'],
    'Security Architecture and Engineering': ['Security models', 'Bell-LaPadula', 'Biba', 'Clark-Wilson', 'TCB', 'Cryptography', 'HSM', 'PKI', 'Physical security'],
    'Network Security': ['OSI model', 'TCP/IP', 'Firewalls', 'IDS/IPS', 'VPN', 'VLAN', 'DMZ', 'Secure protocols', 'Network segmentation'],
    'Identity and Access Management (IAM)': ['Authentication factors', 'MFA', 'SSO', 'RBAC', 'MAC', 'DAC', 'PAM', 'Federation', 'SAML', 'OAuth', 'Provisioning'],
    'Security Operations': ['SOC', 'Monitoring', 'SIEM', 'Threat intelligence', 'Log management', 'Security tools', 'Vulnerability management', 'Patch management'],
    'Security Assessment and Testing': ['Vulnerability assessment', 'Penetration testing', 'SAST', 'DAST', 'Security audit', 'SOC 2', 'Red team', 'Compliance testing'],
    'Software Development Security': ['SDLC', 'SSDLC', 'OWASP Top 10', 'Secure coding', 'Code review', 'DevSecOps', 'CI/CD security', 'API security'],
    'Incident Response and Forensics': ['IR phases', 'Preparation', 'Detection', 'Containment', 'Eradication', 'Recovery', 'Chain of custody', 'Evidence handling', 'Digital forensics'],
    'Cloud Security': ['Shared responsibility model', 'Cloud deployment models', 'CSA STAR', 'CASB', 'Cloud encryption', 'IaaS/PaaS/SaaS', 'Cloud governance'],
    'Zero Trust Architecture': ['Never trust always verify', 'Micro-segmentation', 'ZTNA', 'Least privilege', 'Continuous verification', 'SDP', 'Identity-centric security'],
    'Threat Modeling': ['STRIDE', 'PASTA', 'Attack trees', 'Threat actors', 'Attack surface', 'Mitigation strategies', 'Risk-based modeling'],
    'Business Continuity and Disaster Recovery': ['BCP', 'DRP', 'BIA', 'RTO', 'RPO', 'Hot site', 'Cold site', 'Warm site', '3-2-1 backup', 'Tabletop exercises'],
    'Security Leadership and Communication': ['Security culture', 'Executive communication', 'Security awareness', 'Board reporting', 'Budget planning', 'Team management', 'Vendor management'],
    'Analytical and Critical Thinking': ['Root cause analysis', 'Decision making', 'Problem solving', 'Risk-based thinking', 'Scenario analysis', 'Trade-off analysis'],
    'Data Protection and Privacy': ['Data classification', 'Data lifecycle', 'Data sovereignty', 'Tokenization', 'Data masking', 'PII', 'GDPR', 'CCPA', 'Data retention'],
    'Compliance and Legal': ['Regulatory compliance', 'PCI DSS', 'HIPAA', 'SOX', 'GDPR', 'ISO 27001', 'Contract review', 'SLA', 'Jurisdictional issues'],
  };
  return conceptMap[skillArea] || [];
}

/* ─── Exam Readiness Report ────────────────────────────────────────────────── */
export function generateExamReadinessReport(
  domainStats: DomainAnalytics[],
  skillAssessments: SkillAssessment[],
  totalQuestions: number,
  totalCorrect: number
): ExamReadinessReport {
  // Domain readiness scores
  const domainReadiness = domainStats.map(d => {
    const domain = domains.find(dm => dm.id === d.domainId);
    return {
      domainId: d.domainId,
      score: d.accuracy,
      weight: domain?.weight || 10,
    };
  });

  // Overall weighted score
  const totalWeight = domainReadiness.reduce((s, d) => s + d.weight, 0);
  const overallScore = totalWeight > 0
    ? Math.round(domainReadiness.reduce((s, d) => s + d.score * (d.weight / totalWeight), 0))
    : 0;

  // Knowledge gaps
  const knowledgeGaps = identifyKnowledgeGaps(skillAssessments);

  // Generate study plan
  const criticalGaps = knowledgeGaps.filter(g => g.priority === 'critical' || g.priority === 'high');
  const studyPlan = criticalGaps.length > 0
    ? criticalGaps.slice(0, 5).map(g => `Focus on ${g.skillArea}: ${g.recommendedActions[0] || 'Review core concepts'}`)
    : ['Maintain your knowledge with periodic review and practice tests'];

  // Pass probability
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
  const domainCoverage = domainStats.filter(d => d.questionsAttempted > 0).length / 8;
  const skillCoverage = skillAssessments.filter(s => s.questionsAttempted >= 3).length / 17;
  const estPassProbability = Math.min(99, Math.round(
    (accuracy * 0.4 + (overallScore / 100) * 0.3 + domainCoverage * 0.15 + skillCoverage * 0.15) * 100
  ));

  // Exam date recommendation
  let recommendedExamDate: string;
  if (estPassProbability >= 80) {
    recommendedExamDate = 'You are exam-ready! Schedule within 2-3 weeks while maintaining your practice.';
  } else if (estPassProbability >= 60) {
    recommendedExamDate = 'On track: Schedule in 4-6 weeks with focused study on weak areas.';
  } else if (estPassProbability >= 40) {
    recommendedExamDate = 'Building foundation: Schedule in 2-3 months with consistent practice.';
  } else {
    recommendedExamDate = 'Focus on fundamentals: Plan for 3-4 months of study before scheduling.';
  }

  // Strengths and weaknesses
  const strengths = skillAssessments
    .filter(s => s.level === 'expert' || s.level === 'proficient')
    .slice(0, 5)
    .map(s => s.skillArea);

  const weaknesses = knowledgeGaps
    .filter(g => g.priority === 'critical' || g.priority === 'high')
    .slice(0, 5)
    .map(g => g.skillArea);

  return {
    overallScore,
    domainReadiness,
    skillAssessments,
    knowledgeGaps,
    recommendedStudyPlan: studyPlan,
    estimatedPassProbability: estPassProbability,
    recommendedExamDate,
    strengths,
    weaknesses,
  };
}

/**
 * Maps question answers to skill areas for scoring.
 */
export function mapAnswerToSkillInput(
  question: Question,
  isCorrect: boolean,
  timeSpent: number
): SkillScoreInput {
  return {
    questionId: question.id,
    domainId: question.domainId,
    difficulty: question.difficulty,
    isCorrect,
    skillAreas: question.skillAreas,
    timeSpent,
  };
}
