import type { DomainAnalytics, LearningRecommendation } from '../types';
import { domains } from '../data/domains';

export function generateRecommendations(domainAnalytics: DomainAnalytics[]): LearningRecommendation[] {
  const recommendations: LearningRecommendation[] = [];

  for (const da of domainAnalytics) {
    const domain = domains.find(d => d.id === da.domainId);
    if (!domain) continue;

    let priority: 'high' | 'medium' | 'low' = 'low';
    let description = '';
    let conceptsToReview: string[] = [];

    if (da.classification === 'critical') {
      priority = 'high';
      description = `Critical improvement needed in ${domain.name}. Focus on fundamental concepts and basic principles.`;
      conceptsToReview = getConceptsForDomain(da.domainId, true);
    } else if (da.classification === 'weak') {
      priority = 'high';
      description = `Significant improvement needed in ${domain.name}. Review key concepts and practice with targeted questions.`;
      conceptsToReview = getConceptsForDomain(da.domainId, false);
    } else if (da.classification === 'moderate') {
      priority = 'medium';
      description = `Moderate understanding of ${domain.name}. Focus on advanced topics and scenario-based questions.`;
      conceptsToReview = getConceptsForDomain(da.domainId, false).slice(0, 3);
    } else {
      priority = 'low';
      description = `Strong understanding of ${domain.name}. Maintain with occasional review and practice.`;
      conceptsToReview = [];
    }

    recommendations.push({
      id: `rec-${da.domainId}-${Date.now()}`,
      domainId: da.domainId,
      priority,
      title: `${domain.shortName} - ${da.classification.charAt(0).toUpperCase() + da.classification.slice(1)}`,
      description,
      conceptsToReview,
      suggestedQuestionCount: priority === 'high' ? 20 : priority === 'medium' ? 10 : 5,
      generatedAt: Date.now(),
    });
  }

  return recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

function getConceptsForDomain(domainId: number, basic: boolean): string[] {
  const conceptsByDomain: Record<number, string[]> = {
    1: basic
      ? ['CIA Triad', 'Risk Management Process', 'Compliance Basics', 'Security Governance', 'BCP Fundamentals']
      : ['Quantitative & Qualitative Risk', 'ISO 27001 Framework', 'Risk Treatment Strategies', 'Business Continuity Planning', 'Security Awareness Programs', 'Due Diligence', 'Security Policies'],
    2: basic
      ? ['Data Classification', 'Data Ownership', 'Data Lifecycle', 'Privacy Basics']
      : ['Data Retention Policies', 'Secure Data Destruction', 'Data Sovereignty', 'Data Custodian vs Owner', 'Data Masking', 'Tokenization'],
    3: basic
      ? ['Security Models', 'Bell-LaPadula', 'Biba', 'Encryption Basics']
      : ['Clark-Wilson', 'TCB', 'Symmetric vs Asymmetric', 'AES/DES/RSA', 'Security Architecture Evaluation', 'Physical Security', 'Cryptography'],
    4: basic
      ? ['OSI Model', 'TCP/IP', 'Firewalls', 'Network Basics']
      : ['Secure Protocols', 'VPN Technologies', 'Network Attacks', 'IDS/IPS', 'Network Segmentation', 'Wireless Security', 'SDN'],
    5: basic
      ? ['Authentication Factors', 'Access Control Models', 'Password Security']
      : ['RBAC', 'MAC', 'DAC', 'SSO/SAML/OAuth', 'MFA Implementation', 'Identity Provisioning', 'Federation', 'Privileged Access'],
    6: basic
      ? ['Vulnerability Assessment', 'Security Audits', 'Penetration Testing']
      : ['SAST vs DAST', 'SIEM', 'SOC 2', 'Compliance Auditing', 'Log Management', 'Test Methodologies'],
    7: basic
      ? ['Incident Response Process', 'DRP Basics', 'RTO/RPO']
      : ['IR Phases', 'Digital Forensics', 'Chain of Custody', 'BCP Integration', 'Evidence Handling', 'Post-Incident Review'],
    8: basic
      ? ['SDLC', 'Secure Coding Basics', 'Input Validation']
      : ['SQL Injection Prevention', 'XSS Prevention', 'SSDLC', 'SAST/DAST', 'OWASP Top 10', 'DevSecOps', 'Secure Architecture'],
  };
  return conceptsByDomain[domainId] || [];
}

export function generateStudySequence(recommendations: LearningRecommendation[]): string[] {
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...recommendations].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return domains.find(d => d.id === a.domainId)?.id ?? 0 - (domains.find(d => d.id === b.domainId)?.id ?? 0);
  });
  return sorted.map(r => domains.find(d => d.id === r.domainId)?.name || '').filter(Boolean);
}
