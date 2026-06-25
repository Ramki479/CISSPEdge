import type { CisspDomain } from '../types';

export const domains: CisspDomain[] = [
  { id: 1, name: 'Security and Risk Management', shortName: 'Security & Risk', description: 'Confidentiality, integrity, availability, security governance, compliance, risk management, and business continuity.', weight: 15, color: '#3B82F6' },
  { id: 2, name: 'Asset Security', shortName: 'Asset Security', description: 'Information and asset classification, ownership, privacy, retention, and data security controls.', weight: 10, color: '#10B981' },
  { id: 3, name: 'Security Architecture and Engineering', shortName: 'Architecture & Eng.', description: 'Security models, architecture, evaluation criteria, cryptography, and physical security.', weight: 13, color: '#F59E0B' },
  { id: 4, name: 'Communication and Network Security', shortName: 'Network Security', description: 'Network architecture, secure communication channels, network attacks, and monitoring systems.', weight: 13, color: '#EF4444' },
  { id: 5, name: 'Identity and Access Management (IAM)', shortName: 'IAM', description: 'Identity management, access control models, provisioning, and authentication mechanisms.', weight: 13, color: '#8B5CF6' },
  { id: 6, name: 'Security Assessment and Testing', shortName: 'Assessment & Testing', description: 'Security testing, assessments, audits, and vulnerability management.', weight: 12, color: '#EC4899' },
  { id: 7, name: 'Security Operations', shortName: 'SecOps', description: 'Operations, incident response, disaster recovery, investigations, and monitoring.', weight: 13, color: '#14B8A6' },
  { id: 8, name: 'Software Development Security', shortName: 'Software Security', description: 'Secure development lifecycle, application security, and software assurance.', weight: 11, color: '#F97316' },
];
