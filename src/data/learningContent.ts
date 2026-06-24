/**
 * learningContent.ts
 *
 * Comprehensive CISSP learning content covering all 8 domains.
 * Each domain has topics with detailed explanations, exam tips,
 * examples, common mistakes, and knowledge checks.
 */

export interface LearningTopic {
  id: string;
  title: string;
  subtopics: string[];
  overview: string;
  whyItMatters: string;
  cisspFocus: string;
  keyConcepts: string[];
  examples: string[];
  commonMistakes: string[];
  examTips: string[];
  keyTakeaways: string[];
  knowledgeCheck: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
  relatedConcepts: string[];
}

export interface DomainContent {
  id: number;
  title: string;
  shortName: string;
  description: string;
  examWeight: number;
  topics: LearningTopic[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN 1: Security and Risk Management
   ═══════════════════════════════════════════════════════════════════════════ */

const domain1Topics: LearningTopic[] = [
  {
    id: 'd1-ethics',
    title: 'ISC² Code of Ethics & Professional Conduct',
    subtopics: ['Code of Ethics Canons', 'Professional Conduct', 'Ethical Decision-Making', 'Due Care vs Due Diligence'],
    overview: 'The ISC² Code of Ethics is the cornerstone of professional behavior for CISSPs. All certified professionals must adhere to four canons: Protect society, Act honorably, Provide diligent service, and Advance the profession.',
    whyItMatters: 'Ethics violations can result in certification revocation and legal liability. Understanding ethical boundaries is critical for security professionals who handle sensitive data and make risk decisions.',
    cisspFocus: 'CISSP expects you to apply ethical principles to real scenarios. Questions often test your ability to identify the most ethical response when multiple options seem plausible.',
    keyConcepts: [
      'Four canons: Protect society, Act honorably, Provide diligent service, Advance the profession',
      'Due Care: Taking reasonable steps to protect assets (doing what a prudent person would do)',
      'Due Diligence: Continuously maintaining and updating security measures',
      'Ethical decisions prioritize public safety over organizational interests',
      'Conflicts of interest must be disclosed and avoided',
    ],
    examples: [
      'A security professional discovers a vulnerability that could affect public safety. Under the Code of Ethics, they must disclose it responsibly rather than hide it.',
      'When leaving an organization, a CISSP cannot share confidential information or proprietary data, even if asked by a new employer.',
    ],
    commonMistakes: [
      'Confusing Due Care (initial action) with Due Diligence (ongoing maintenance)',
      'Believing organizational loyalty always outweighs public safety',
      'Assuming ethical obligations end when employment ends',
    ],
    examTips: [
      'When in doubt, choose the answer that prioritizes public safety and transparency',
      'Due Care is the START of security; Due Diligence is the CONTINUATION',
      'ISC² Code of Ethics always takes precedence over organizational policy',
    ],
    keyTakeaways: [
      'ISC² Code of Ethics has four canons with specific priorities',
      'Public safety is the highest ethical obligation',
      'Due Care and Due Diligence are legal concepts with security implications',
    ],
    knowledgeCheck: [
      { question: 'Which ISC² Code of Ethics canon takes highest priority?', options: ['Act honorably', 'Provide diligent service', 'Protect society', 'Advance the profession'], correctAnswer: 2, explanation: 'Protect society is the first and highest priority canon.' },
      { question: 'What is the difference between Due Care and Due Diligence?', options: ['They are the same', 'Due Care is initial protection; Due Diligence is ongoing maintenance', 'Due Diligence comes before Due Care', 'Neither applies to security'], correctAnswer: 1, explanation: 'Due Care is taking initial reasonable steps; Due Diligence is the continuous process of maintaining and updating security.' },
    ],
    relatedConcepts: ['Governance', 'Compliance', 'Professional Responsibility'],
  },
  {
    id: 'd1-risk-management',
    title: 'Risk Management Frameworks',
    subtopics: ['Risk Assessment', 'Risk Treatment', 'Risk Appetite vs Tolerance', 'NIST RMF', 'ISO 31000', 'Quantitative vs Qualitative'],
    overview: 'Risk management is the process of identifying, assessing, and responding to risks. Frameworks like NIST RMF and ISO 31000 provide structured approaches. Key formulas include SLE = AV × EF and ALE = SLE × ARO.',
    whyItMatters: 'Organizations face limited resources against unlimited threats. Risk management ensures security investments align with business priorities and regulatory requirements.',
    cisspFocus: 'CISSP heavily tests risk management terminology, formulas, and the differences between risk treatment strategies. Know when to accept, mitigate, transfer, or avoid risk.',
    keyConcepts: [
      'SLE = AV × EF (Single Loss Expectancy = Asset Value × Exposure Factor)',
      'ALE = SLE × ARO (Annualized Loss Expectancy)',
      'Quantitative: uses monetary values and statistics',
      'Qualitative: uses opinions, scenarios, and relative rankings',
      'Risk Treatment: Mitigate, Accept, Transfer, Avoid',
      'Risk Appetite: willingness to accept risk; Risk Tolerance: acceptable deviation',
    ],
    examples: [
      'A company calculates ALE for a server as $50,000. A firewall costs $10,000/year. Mitigation cost ($10K) < ALE ($50K), so mitigation is justified.',
      'A bank identifies high fraud risk. They purchase cyber insurance (Risk Transfer) while implementing fraud detection (Risk Mitigation).',
    ],
    commonMistakes: [
      'Confusing Risk Appetite (broad willingness) with Risk Tolerance (specific boundaries)',
      'Forgetting that Risk Acceptance means formally acknowledging residual risk',
      'Mixing up SLE and ALE formulas',
    ],
    examTips: [
      'Memorize SLE = AV × EF and ALE = SLE × ARO',
      'For high-likelihood/high-impact risks: Mitigate or Avoid',
      'For low-likelihood/low-impact risks: Accept or Transfer via insurance',
      'When a question says "BEST" action, it typically means Mitigate first',
    ],
    keyTakeaways: [
      'Quantitative risk analysis uses numbers; Qualitative uses judgment',
      'Four risk treatment options: Mitigate, Accept, Transfer, Avoid',
      'NIST RMF: Categorize → Select → Implement → Assess → Authorize → Monitor',
    ],
    knowledgeCheck: [
      { question: 'What is the formula for Annualized Loss Expectancy (ALE)?', options: ['ALE = AV × EF', 'ALE = SLE × ARO', 'ALE = AV × ARO', 'ALE = SLE × EF'], correctAnswer: 1, explanation: 'ALE = SLE × ARO. Single Loss Expectancy multiplied by Annualized Rate of Occurrence.' },
      { question: 'Which risk treatment strategy involves purchasing insurance?', options: ['Risk Mitigation', 'Risk Acceptance', 'Risk Transfer', 'Risk Avoidance'], correctAnswer: 2, explanation: 'Insurance transfers the financial risk to a third party.' },
    ],
    relatedConcepts: ['Business Continuity', 'Compliance', 'Security Governance'],
  },
  {
    id: 'd1-governance',
    title: 'Security Governance & Compliance',
    subtopics: ['Security Policies', 'Standards vs Guidelines vs Procedures', 'Due Care/Diligence', 'Regulatory Compliance', 'GDPR', 'HIPAA', 'PCI DSS'],
    overview: 'Security governance provides strategic direction for security programs. It includes policies (high-level intent), standards (mandatory requirements), guidelines (recommended practices), and procedures (step-by-step instructions).',
    whyItMatters: 'Organizations must comply with legal and regulatory requirements. Non-compliance can result in fines, legal liability, and reputational damage. Governance ensures security aligns with business goals.',
    cisspFocus: 'CISSP tests the hierarchy of governance documents (Policy → Standard → Guideline → Procedure), key regulations, and the differences between them.',
    keyConcepts: [
      'Policies: High-level management intent (mandatory)',
      'Standards: Mandatory specific requirements',
      'Guidelines: Recommended (not mandatory) practices',
      'Procedures: Step-by-step instructions',
      'Baselines: Minimum security requirements',
      'Key regulations: GDPR (EU privacy), HIPAA (healthcare), PCI DSS (payment cards), SOX (financial)',
    ],
    examples: [
      'A company creates an Acceptable Use Policy (AUP) defining how employees may use company resources. The standard specifies that only company-issued devices may connect to the network. The guideline recommends using VPN on public Wi-Fi.',
      'A healthcare provider must comply with HIPAA for patient data, PCI DSS for payment processing, and GDPR for EU patient data.',
    ],
    commonMistakes: [
      'Confusing Standards (mandatory) with Guidelines (recommended)',
      'Believing compliance equals security',
      'Forgetting that policies come from senior management',
    ],
    examTips: [
      'Standards are MANDATORY; Guidelines are RECOMMENDED',
      'Policies are created by management, not technical teams',
      'Compliance is the MINIMUM — security should go beyond compliance',
      'GDPR applies if you process EU resident data, regardless of location',
    ],
    keyTakeaways: [
      'Governance documents: Policy > Standard > Guideline > Procedure',
      'Key regulations affecting CISSP: GDPR, HIPAA, PCI DSS, SOX, FISMA',
      'Compliance meets minimum requirements; security should exceed them',
    ],
    knowledgeCheck: [
      { question: 'Which governance document is MANDATORY but more specific than a policy?', options: ['Guideline', 'Procedure', 'Standard', 'Baseline'], correctAnswer: 2, explanation: 'Standards are mandatory requirements. Guidelines are recommended but not mandatory.' },
      { question: 'Which regulation applies to organizations processing EU resident personal data?', options: ['HIPAA', 'PCI DSS', 'GDPR', 'SOX'], correctAnswer: 2, explanation: 'GDPR applies to any organization processing EU resident data, regardless of the organization\'s location.' },
    ],
    relatedConcepts: ['Risk Management', 'Audit', 'Legal Compliance'],
  },
  {
    id: 'd1-bcp',
    title: 'Business Continuity & Disaster Recovery',
    subtopics: ['BCP vs DRP', 'BIA', 'RTO vs RPO', 'Recovery Strategies', 'Plan Testing'],
    overview: 'Business Continuity Planning (BCP) ensures critical business functions continue during disruption. Disaster Recovery Planning (DRP) focuses on restoring IT systems after a disaster. Both are essential for organizational resilience.',
    whyItMatters: 'Without BCP/DRP, organizations face extended downtime, revenue loss, and reputational damage. Regulatory requirements often mandate these plans.',
    cisspFocus: 'CISSP distinguishes BCP (business-focused, proactive) from DRP (IT-focused, reactive). Know RTO (time to restore) vs RPO (acceptable data loss) and site types (hot/warm/cold).',
    keyConcepts: [
      'BCP: Proactive — ensures business functions continue during disruption',
      'DRP: Reactive — restores IT after disruption',
      'BIA identifies critical functions and their recovery requirements',
      'RTO: Recovery Time Objective — max acceptable downtime',
      'RPO: Recovery Point Objective — max acceptable data loss (in time)',
      'Hot site: fully equipped, ready immediately',
      'Warm site: partially equipped, needs setup',
      'Cold site: basic infrastructure only',
    ],
    examples: [
      'A hospital has an RTO of 4 hours for patient records (can tolerate 4 hours downtime). RPO of 15 minutes (can lose 15 minutes of data at most). Requires hot site with real-time replication.',
      'A marketing agency accepts 24-hour RTO and 24-hour RPO. A warm site with daily backups suffices.',
    ],
    commonMistakes: [
      'Confusing BCP (business continuity) with DRP (IT recovery)',
      'Mixing up RTO (time) and RPO (data loss)',
      'Forgetting that BCP comes BEFORE DRP in planning order',
    ],
    examTips: [
      'BCP first (identify critical functions), then DRP (IT recovery)',
      'RTO = Time to restore; RPO = Data loss tolerance',
      'Hot site = expensive but immediate; Cold site = cheap but slow',
      '3-2-1 backup rule: 3 copies, 2 media types, 1 off-site',
    ],
    keyTakeaways: [
      'BCP keeps business running; DRP restores IT systems',
      'BIA identifies critical functions and their RTO/RPO requirements',
      'Hot sites are for low RTO; Cold sites are for high RTO',
    ],
    knowledgeCheck: [
      { question: 'What is the difference between RTO and RPO?', options: ['They are the same', 'RTO is max downtime; RPO is max data loss', 'RTO is data loss; RPO is recovery time', 'RTO applies to hardware only'], correctAnswer: 1, explanation: 'RTO defines acceptable downtime; RPO defines acceptable data loss measured in time.' },
      { question: 'Which type of DR site is MOST appropriate for a 1-hour RTO?', options: ['Cold site', 'Warm site', 'Hot site', 'No site needed'], correctAnswer: 2, explanation: 'A hot site is fully equipped for immediate failover, supporting a 1-hour RTO.' },
    ],
    relatedConcepts: ['Risk Management', 'Incident Response', 'Security Operations'],
  },
  {
    id: 'd1-personnel',
    title: 'Personnel Security & Third-Party Risk',
    subtopics: ['Separation of Duties', 'Least Privilege', 'Job Rotation', 'Mandatory Vacation', 'NDA', 'SLA', 'Vendor Management'],
    overview: 'Personnel security controls protect against internal threats including fraud, errors, and malicious insiders. Separation of duties, least privilege, and job rotation are key preventive controls.',
    whyItMatters: 'Insider threats account for a significant percentage of breaches. Third-party vendors introduce supply chain risks that must be managed through contracts and assessments.',
    cisspFocus: 'CISSP tests personnel security concepts, especially separation of duties, least privilege, and third-party agreements (SLA, NDA, MOU, BPA).',
    keyConcepts: [
      'Separation of Duties: No single person controls all parts of a critical process',
      'Least Privilege: Users get minimum permissions needed for their job',
      'Job Rotation: Cross-training reduces fraud risk and creates backup personnel',
      'Mandatory Vacation: Forces detection of ongoing fraud schemes',
      'NDA (Non-Disclosure Agreement): Protects confidential information',
      'SLA (Service Level Agreement): Defines service expectations and metrics',
    ],
    examples: [
      'In a bank, one employee processes payments and another approves them (Separation of Duties). Neither can complete the full process alone.',
      'A contractor is given a 30-day access token to a specific project folder (Least Privilege + Time-limited access).',
    ],
    commonMistakes: [
      'Confusing Separation of Duties (different people) with Least Privilege (minimum permissions)',
      'Forgetting that SLAs define security requirements for third parties',
      'Believing background checks are only for permanent employees',
    ],
    examTips: [
      'Separation of Duties prevents fraud; Least Privilege limits damage',
      'Job Rotation provides redundancy AND detects fraud',
      'SLAs with vendors must include security requirements and metrics',
    ],
    keyTakeaways: [
      'Internal controls: Separation of Duties, Least Privilege, Job Rotation',
      'Third-party risk is managed through contracts (SLA, NDA) and assessments',
      'Background checks apply to employees, contractors, and vendors',
    ],
    knowledgeCheck: [
      { question: 'Which control prevents a single person from completing a fraudulent transaction?', options: ['Least Privilege', 'Separation of Duties', 'Job Rotation', 'Mandatory Vacation'], correctAnswer: 1, explanation: 'Separation of Duties requires multiple people to complete sensitive processes.' },
      { question: 'What document defines the security requirements and metrics for a third-party service provider?', options: ['NDA', 'MOU', 'SLA', 'BPA'], correctAnswer: 2, explanation: 'A Service Level Agreement defines specific service levels, security requirements, and metrics.' },
    ],
    relatedConcepts: ['Governance', 'Access Control', 'Risk Management'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN 2: Asset Security
   ═══════════════════════════════════════════════════════════════════════════ */

const domain2Topics: LearningTopic[] = [
  {
    id: 'd2-classification',
    title: 'Information Classification & Data Governance',
    subtopics: ['Classification Levels', 'Data Ownership', 'Data Custodianship', 'Data Lifecycle', 'Data Sovereignty'],
    overview: 'Data classification assigns sensitivity labels (Public, Internal, Confidential, Restricted) that determine protection requirements. Data owners classify data; data custodians implement technical controls.',
    whyItMatters: 'Without classification, data is either over-protected (wasting resources) or under-protected (creating risk). Regulatory requirements mandate data classification for compliance.',
    cisspFocus: 'CISSP distinguishes data owner (classifies, determines access) from data custodian (implements controls). Know the data lifecycle stages and data sovereignty concepts.',
    keyConcepts: [
      'Data Owner: Senior manager who classifies data and determines access rights',
      'Data Custodian: Implements and maintains technical security controls',
      'Data Lifecycle: Create → Classify → Store → Use → Share → Archive → Destroy',
      'Data Sovereignty: Data is subject to laws of the country where it is stored',
      'Data Classification: Public, Internal, Confidential, Restricted (highest to lowest)',
    ],
    examples: [
      'A hospital\'s CEO (Data Owner) classifies patient records as Restricted. The IT team (Data Custodian) implements encryption and access controls.',
      'An international company must store EU customer data in EU data centers to comply with GDPR data sovereignty requirements.',
    ],
    commonMistakes: [
      'Confusing Data Owner (business role) with Data Custodian (technical role)',
      'Forgetting that data must be classified BEFORE protection controls can be applied',
      'Believing data sovereignty only applies to government data',
    ],
    examTips: [
      'Data Owner = CLASSIFIES; Data Custodian = PROTECTS',
      'Classification is the FIRST step in the data lifecycle',
      'Data sovereignty laws vary by country — always know where data resides',
    ],
    keyTakeaways: [
      'Classification determines protection requirements',
      'Data owners are senior business roles; custodians are technical roles',
      'Data lifecycle: Create → Classify → Store → Use → Share → Archive → Destroy',
    ],
    knowledgeCheck: [
      { question: 'Who is responsible for classifying data?', options: ['Data Custodian', 'Data Owner', 'System Administrator', 'Auditor'], correctAnswer: 1, explanation: 'Data owners classify data; custodians implement controls.' },
      { question: 'What is data sovereignty?', options: ['Data must be accessible globally', 'Data is subject to the laws of the country where it is stored', 'Data owners have absolute control', 'Data cannot be copied'], correctAnswer: 1, explanation: 'Data sovereignty means data is subject to the jurisdiction where it physically resides.' },
    ],
    relatedConcepts: ['Privacy', 'Compliance', 'Risk Management'],
  },
  {
    id: 'd2-retention',
    title: 'Data Retention & Secure Disposal',
    subtopics: ['Retention Schedules', 'Secure Destruction', 'Degaussing', 'Cryptographic Erasure', 'Data Masking'],
    overview: 'Data retention policies define how long data must be kept for legal and business reasons. Secure disposal ensures data cannot be recovered after its retention period expires.',
    whyItMatters: 'Improper data retention leads to legal liability and unnecessary storage costs. Insecure disposal can expose sensitive data. Regulations mandate specific retention periods.',
    cisspFocus: 'CISSP tests destruction methods (shredding, degaussing, overwriting, cryptographic erasure) and their applicability to different media types.',
    keyConcepts: [
      'Retention Schedule: Defines how long each data type is kept',
      'Shredding: Physical destruction (paper, SSDs, optical media)',
      'Degaussing: Magnetic field destruction (HDDs, tapes)',
      'Overwriting: Writing patterns over storage (HDDs, SSDs)',
      'Cryptographic Erasure: Destroying encryption keys to make data unreachable',
      'Data Masking: Replacing sensitive data with realistic but fictional data',
    ],
    examples: [
      'Financial records are retained for 7 years per regulation. After 7 years, they are securely shredded and inventoried.',
      'An organization decommissioning a server uses degaussing for HDDs, shredding for SSDs, and cryptographic erasure for encrypted databases.',
    ],
    commonMistakes: [
      'Believing deletion removes data (it only removes pointers)',
      'Forgetting that degaussing destroys HDDs but may not work on SSDs',
      'Confusing data masking (for non-production use) with encryption (for protection)',
    ],
    examTips: [
      'Degaussing = magnetic media (HDDs, tapes)',
      'Shredding = physical media (paper, SSDs, optical)',
      'Overwriting = reusable media (multiple passes for sensitive data)',
      'Cryptographic erasure = fastest method for encrypted data',
    ],
    keyTakeaways: [
      'Retention periods are based on legal, regulatory, and business requirements',
      'Different media require different destruction methods',
      'Cryptographic erasure is efficient for encrypted data',
    ],
    knowledgeCheck: [
      { question: 'Which method is BEST for sanitizing magnetic hard drives?', options: ['Shredding', 'Degaussing', 'Data masking', 'Deleting files'], correctAnswer: 1, explanation: 'Degaussing uses a strong magnetic field to erase HDDs effectively.' },
      { question: 'What is cryptographic erasure?', options: ['Encrypting data for deletion', 'Destroying encryption keys to make data unrecoverable', 'Overwriting encrypted data', 'Shredding encrypted drives'], correctAnswer: 1, explanation: 'Cryptographic erasure deletes encryption keys, making encrypted data permanently unrecoverable.' },
    ],
    relatedConcepts: ['Asset Security', 'Compliance', 'Privacy'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN 3: Security Architecture and Engineering
   ═══════════════════════════════════════════════════════════════════════════ */

const domain3Topics: LearningTopic[] = [
  {
    id: 'd3-security-models',
    title: 'Security Models & Architecture',
    subtopics: ['Bell-LaPadula', 'Biba', 'Clark-Wilson', 'Brewer-Nash', 'TCB', 'Security Evaluation Models'],
    overview: 'Security models provide mathematical frameworks for enforcing security policies. Bell-LaPadula focuses on confidentiality, Biba on integrity, Clark-Wilson on commercial integrity, and Brewer-Nash (Chinese Wall) on conflict of interest.',
    whyItMatters: 'Understanding security models helps architects design systems that enforce security properties. Models are the foundation of trusted computing and certification.',
    cisspFocus: 'CISSP tests the differences between models, what each protects (confidentiality vs integrity), and their rules. Know the simple property, star property, and strong star property.',
    keyConcepts: [
      'Bell-LaPadula: Confidentiality — "No read up, no write down"',
      'Biba: Integrity — "No write up, no read down"',
      'Clark-Wilson: Commercial integrity — well-formed transactions, separation of duties',
      'Brewer-Nash (Chinese Wall): Conflict of interest — prevents access to competing data',
      'TCB (Trusted Computing Base): All hardware, firmware, and software critical to security',
      'Security Evaluation: TCSEC (Orange Book), ITSEC, Common Criteria',
    ],
    examples: [
      'A military system uses Bell-LaPadula to prevent a user with Secret clearance from reading Top Secret documents ("no read up").',
      'A banking system uses Clark-Wilson to ensure transactions are well-formed and follow separation of duties.',
    ],
    commonMistakes: [
      'Confusing Bell-LaPadula (confidentiality) with Biba (integrity)',
      'Forgetting the direction of rules (read up vs write down)',
      'Thinking all models apply to both confidentiality and integrity',
    ],
    examTips: [
      'Bell-LaPadula = Confidentiality (military/government)',
      'Biba = Integrity (protects data from unauthorized modification)',
      'Clark-Wilson = Commercial integrity with separation of duties',
      'Chinese Wall = Consulting firms managing multiple clients',
    ],
    keyTakeaways: [
      'Bell-LaPadula: "No read up, no write down" — confidentiality',
      'Biba: "No write up, no read down" — integrity',
      'TCB includes ALL components critical to system security',
    ],
    knowledgeCheck: [
      { question: 'Which security model focuses on confidentiality with "no read up, no write down"?', options: ['Biba', 'Clark-Wilson', 'Bell-LaPadula', 'Brewer-Nash'], correctAnswer: 2, explanation: 'Bell-LaPadula enforces confidentiality by preventing subjects from reading higher-level objects and writing to lower-level objects.' },
      { question: 'Which model is designed to prevent conflicts of interest in consulting firms?', options: ['Bell-LaPadula', 'Biba', 'Clark-Wilson', 'Brewer-Nash (Chinese Wall)'], correctAnswer: 3, explanation: 'The Chinese Wall model prevents access to competing organizations\' data.' },
    ],
    relatedConcepts: ['Cryptography', 'Secure Design', 'Physical Security'],
  },
  {
    id: 'd3-cryptography',
    title: 'Cryptography & PKI',
    subtopics: ['Symmetric Encryption', 'Asymmetric Encryption', 'Hash Functions', 'Digital Signatures', 'PKI', 'Key Management'],
    overview: 'Cryptography protects data confidentiality, integrity, and authenticity. Symmetric encryption uses shared keys (AES, 3DES), asymmetric uses key pairs (RSA, ECC), and hash functions provide integrity verification (SHA-2, SHA-3).',
    whyItMatters: 'Cryptography is the foundation of secure communications, data protection, authentication, and non-repudiation. Every security professional must understand cryptographic principles.',
    cisspFocus: 'CISSP tests cryptographic algorithms, key sizes, PKI components (CA, RA, CRL), and when to use each type. Know the differences between symmetric and asymmetric encryption.',
    keyConcepts: [
      'Symmetric: Same key for encrypt/decrypt (AES-256, 3DES). Fast, but key distribution challenge',
      'Asymmetric: Public/private key pairs (RSA, ECC, Diffie-Hellman). Slower but solves key distribution',
      'Hash Functions: One-way, collision-resistant (SHA-256, SHA-3). Used for integrity verification',
      'Digital Signature: Sign with private key, verify with public key. Provides authentication, integrity, non-repudiation',
      'PKI Components: CA (Certificate Authority), RA (Registration Authority), CRL (Certificate Revocation List)',
      'Key Management: Key generation, storage, distribution, rotation, destruction (HSM recommended)',
    ],
    examples: [
      'HTTPS uses asymmetric encryption (RSA/ECC) for initial key exchange, then symmetric encryption (AES) for bulk data transfer.',
      'A software vendor signs their releases with a private key. Users verify the signature with the public key to ensure integrity and authenticity.',
    ],
    commonMistakes: [
      'Confusing encryption (reversible) with hashing (one-way)',
      'Believing symmetric encryption doesn\'t require key management',
      'Forgetting that digital signatures provide non-repudiation',
    ],
    examTips: [
      'AES is the standard symmetric algorithm (128/192/256-bit keys)',
      'RSA and ECC are asymmetric (ECC provides same security with smaller keys)',
      'SHA-2 and SHA-3 are current hash standards (MD5 and SHA-1 are deprecated)',
      'HSMs securely store cryptographic keys',
    ],
    keyTakeaways: [
      'Symmetric = fast, shared key (AES). Asymmetric = key pairs (RSA, ECC)',
      'Hash functions verify integrity (SHA-256). Digital signatures provide non-repudiation',
      'PKI manages certificates through CA, RA, and CRL',
    ],
    knowledgeCheck: [
      { question: 'Which algorithm is a symmetric block cipher?', options: ['RSA', 'SHA-256', 'AES', 'Diffie-Hellman'], correctAnswer: 2, explanation: 'AES (Advanced Encryption Standard) is a symmetric block cipher using 128/192/256-bit keys.' },
      { question: 'What does a digital signature provide that encryption alone does not?', options: ['Confidentiality', 'Speed', 'Non-repudiation', 'Compression'], correctAnswer: 2, explanation: 'Digital signatures provide authentication, integrity, and non-repudiation — proof of origin that can be verified by third parties.' },
    ],
    relatedConcepts: ['Network Security', 'IAM', 'Secure Architecture'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN 4: Communication and Network Security
   ═══════════════════════════════════════════════════════════════════════════ */

const domain4Topics: LearningTopic[] = [
  {
    id: 'd4-network-fundamentals',
    title: 'Network Fundamentals & OSI Model',
    subtopics: ['OSI 7 Layers', 'TCP/IP Model', 'Routers vs Switches', 'Network Protocols', 'Port Numbers'],
    overview: 'The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. Understanding each layer helps in troubleshooting attacks and implementing security at the appropriate level.',
    whyItMatters: 'Network attacks target specific layers. Understanding the OSI model helps security professionals identify which controls protect against which threats at each layer.',
    cisspFocus: 'CISSP tests OSI layer functions, devices at each layer, and protocols. Know which security controls apply at each layer (e.g., encryption at Layer 6, firewalls at Layer 3/4).',
    keyConcepts: [
      'Layer 1 (Physical): Cables, hubs, repeaters, signal transmission',
      'Layer 2 (Data Link): Switches, MAC addresses, Ethernet, ARP',
      'Layer 3 (Network): Routers, IP addressing, routing protocols',
      'Layer 4 (Transport): TCP (connection-oriented), UDP (connectionless)',
      'Layer 5 (Session): Session management, authentication',
      'Layer 6 (Presentation): Encryption, compression, data formatting',
      'Layer 7 (Application): HTTP, FTP, SMTP, DNS, application protocols',
    ],
    examples: [
      'A firewall filtering by IP address operates at Layer 3. A firewall filtering by port operates at Layer 4. A web application firewall (WAF) operates at Layer 7.',
      'ARP spoofing attacks target Layer 2. Port security and VLANs defend against Layer 2 attacks.',
    ],
    commonMistakes: [
      'Confusing switches (Layer 2) with routers (Layer 3)',
      'Forgetting encryption occurs at Layer 6 (Presentation)',
      'Believing TCP is always more secure than UDP',
    ],
    examTips: [
      'Mnemonics: "Please Do Not Throw Sausage Pizza Away" (Physical→Application)',
      'Routers = Layer 3; Switches = Layer 2; Firewalls = Layers 3-4 or 7 (WAF)',
      'VPNs operate at different layers: IPSec (L3), SSL/TLS (L4-5)',
    ],
    keyTakeaways: [
      'OSI 7 layers provide a framework for understanding network functions',
      'Different devices and protocols operate at different layers',
      'Security controls must be applied at the appropriate OSI layers',
    ],
    knowledgeCheck: [
      { question: 'At which OSI layer does a router operate?', options: ['Layer 2 (Data Link)', 'Layer 3 (Network)', 'Layer 4 (Transport)', 'Layer 7 (Application)'], correctAnswer: 1, explanation: 'Routers operate at Layer 3 (Network) and make forwarding decisions based on IP addresses.' },
      { question: 'Which protocol is connection-oriented?', options: ['UDP', 'HTTP', 'TCP', 'ICMP'], correctAnswer: 2, explanation: 'TCP (Transmission Control Protocol) is connection-oriented, providing reliable, ordered delivery.' },
    ],
    relatedConcepts: ['Network Security', 'Secure Protocols', 'Firewalls'],
  },
  {
    id: 'd4-network-security',
    title: 'Network Security & Segmentation',
    subtopics: ['Firewalls', 'IDS/IPS', 'VLANs', 'DMZ', 'VPNs', 'Wireless Security', 'Zero Trust'],
    overview: 'Network security uses defense-in-depth with firewalls, IDS/IPS, VLAN segmentation, and VPNs. The DMZ hosts public services. Wireless security requires WPA3-Enterprise. Zero Trust assumes no implicit trust.',
    whyItMatters: 'Most attacks traverse networks. Proper segmentation limits breach impact. VPNs protect remote access. Wireless networks are common attack vectors without proper controls.',
    cisspFocus: 'CISSP tests the differences between IDS (detect only) and IPS (detect and prevent), DMZ architecture, VPN protocols, and wireless security standards.',
    keyConcepts: [
      'Firewall: Filters traffic based on rules (stateful, stateless, next-gen)',
      'IDS: Detects threats and alerts (passive)',
      'IPS: Detects threats and blocks them (active, inline)',
      'DMZ: Segmented network hosting public services',
      'VLAN: Virtual LAN for logical segmentation at Layer 2',
      'VPN: Encrypted tunnel over public network (site-to-site, remote access)',
      'WPA3-Enterprise: Current wireless security standard with 802.1X',
      'Zero Trust: "Never trust, always verify" — micro-segmentation, continuous authentication',
    ],
    examples: [
      'A company places its web server in the DMZ. If compromised, the attacker cannot access the internal network because the DMZ is isolated by firewalls.',
      'A hospital segments medical devices on a separate VLAN with strict ACLs to prevent malware from spreading to critical systems.',
    ],
    commonMistakes: [
      'Confusing IDS (monitors, alerts) with IPS (monitors, alerts, blocks)',
      'Believing VLANs provide complete security (they don\'t encrypt)',
      'Forgetting that WEP and WPA are deprecated (use WPA3 or WPA2)',
    ],
    examTips: [
      'IDS = Detective; IPS = Preventive',
      'DMZ is for PUBLIC-FACING services only',
      'Site-to-site VPN connects offices; Remote-access VPN connects users',
      'Zero Trust: Never trust, always verify',
    ],
    keyTakeaways: [
      'Defense in depth: firewalls + IDS/IPS + segmentation + encryption',
      'DMZ isolates public services from internal networks',
      'WPA3-Enterprise is the current wireless security standard',
    ],
    knowledgeCheck: [
      { question: 'What is the difference between IDS and IPS?', options: ['IDS detects; IPS detects and prevents', 'IPS detects; IDS prevents', 'They are the same', 'IDS is for wireless; IPS is for wired'], correctAnswer: 0, explanation: 'IDS (Intrusion Detection System) monitors and alerts. IPS (Intrusion Prevention System) monitors and actively blocks threats.' },
      { question: 'What is a core principle of Zero Trust architecture?', options: ['Trust but verify', 'Never trust, always verify', 'Trust all internal traffic', 'Only verify external users'], correctAnswer: 1, explanation: 'Zero Trust operates on "never trust, always verify" — no entity is trusted by default.' },
    ],
    relatedConcepts: ['IAM', 'Secure Architecture', 'Security Operations'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN 5: Identity and Access Management (IAM)
   ═══════════════════════════════════════════════════════════════════════════ */

const domain5Topics: LearningTopic[] = [
  {
    id: 'd5-authentication',
    title: 'Authentication & Access Control Models',
    subtopics: ['Authentication Factors', 'MFA', 'SSO', 'Kerberos', 'LDAP', 'RBAC vs ABAC', 'DAC vs MAC'],
    overview: 'Authentication verifies identity (who you are). Authorization determines access (what you can do). Three factors: something you know, have, or are. MFA combines multiple factors for stronger security.',
    whyItMatters: 'Weak authentication is the most common attack vector. Proper IAM prevents unauthorized access and satisfies regulatory requirements for access control.',
    cisspFocus: 'CISSP tests authentication factors, access control models (DAC, MAC, RBAC, ABAC), federation protocols (SAML, OAuth, OpenID Connect), and Kerberos operation.',
    keyConcepts: [
      'Authentication Factors: Knowledge (password), Possession (token), Inherence (biometric)',
      'MFA: Combines two or more factors from different categories',
      'SSO: Authenticate once, access multiple applications (SAML, OAuth, OIDC)',
      'Kerberos: Ticket-based authentication using symmetric keys and KDC',
      'DAC (Discretionary AC): Data owners set permissions',
      'MAC (Mandatory AC): Central authority sets permissions based on labels',
      'RBAC (Role-Based AC): Permissions assigned to roles, not individuals',
      'ABAC (Attribute-Based AC): Permissions based on attributes (user, resource, environment)',
    ],
    examples: [
      'A company requires password + SMS code for VPN access. This is MFA combining "something you know" (password) and "something you have" (phone receiving SMS).',
      'A university uses SAML-based federation so students can use their university credentials to access cloud services.',
    ],
    commonMistakes: [
      'Believing two passwords = MFA (they are both "something you know")',
      'Confusing authentication (identity) with authorization (permissions)',
      'Forgetting that OAuth 2.0 is authorization, not authentication',
    ],
    examTips: [
      'MFA requires factors from DIFFERENT categories',
      'SSO improves user experience but creates a single point of failure',
      'Kerberos uses tickets and symmetric keys (not passwords transmitted)',
      'SAML is for authentication; OAuth is for authorization; OIDC is for identity',
    ],
    keyTakeaways: [
      'Three authentication factors: Knowledge, Possession, Inherence',
      'Access control models: DAC (owner), MAC (central), RBAC (role), ABAC (attributes)',
      'Federation enables SSO across organizations using SAML/OAuth/OIDC',
    ],
    knowledgeCheck: [
      { question: 'Which authentication factor is a smart card?', options: ['Something you know', 'Something you have', 'Something you are', 'Something you do'], correctAnswer: 1, explanation: 'A smart card is a possession factor ("something you have").' },
      { question: 'Which access control model uses security labels assigned by a central authority?', options: ['DAC', 'MAC', 'RBAC', 'ABAC'], correctAnswer: 1, explanation: 'MAC (Mandatory Access Control) uses a central authority to assign security labels.' },
    ],
    relatedConcepts: ['Network Security', 'Cryptography', 'Security Operations'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN 6: Security Assessment and Testing
   ═══════════════════════════════════════════════════════════════════════════ */

const domain6Topics: LearningTopic[] = [
  {
    id: 'd6-testing',
    title: 'Security Testing & Assessments',
    subtopics: ['Vulnerability Assessment', 'Penetration Testing', 'SAST vs DAST', 'Audits', 'Red Team vs Blue Team'],
    overview: 'Security assessments identify vulnerabilities and evaluate control effectiveness. Vulnerability scans identify weaknesses; penetration tests exploit them to demonstrate real-world impact.',
    whyItMatters: 'Regular testing is essential for identifying security gaps before attackers do. Compliance frameworks require periodic assessments and audits.',
    cisspFocus: 'CISSP tests the differences between vulnerability assessments (scans) and penetration tests (exploitation), SAST vs DAST, and testing methodologies (black/white/gray box).',
    keyConcepts: [
      'Vulnerability Assessment: Scans for known vulnerabilities (automated)',
      'Penetration Test: Actively exploits vulnerabilities (manual + automated)',
      'SAST (Static): Source code analysis without execution',
      'DAST (Dynamic): Tests running applications',
      'Black Box: No prior knowledge (simulates external attacker)',
      'White Box: Full knowledge (simulates insider with access)',
      'Gray Box: Partial knowledge',
      'Red Team: Offensive (attacker simulation)',
      'Blue Team: Defensive (monitoring and response)',
    ],
    examples: [
      'A quarterly vulnerability scan identifies missing patches. An annual penetration test then attempts to exploit those missing patches to demonstrate impact.',
      'A web application undergoes SAST during development (analyzing source code) and DAST before deployment (testing the running application).',
    ],
    commonMistakes: [
      'Confusing vulnerability assessment (identifies) with pen test (exploits)',
      'Forgetting that rules of engagement must be established before pen testing',
      'Believing automated scans replace manual testing',
    ],
    examTips: [
      'Vulnerability scans = FAST, automated, identifies weaknesses',
      'Pen tests = SLOWER, manual + automated, demonstrates impact',
      'SAST = White box (source code). DAST = Black box (running app)',
      'Rules of engagement define scope, boundaries, and constraints',
    ],
    keyTakeaways: [
      'Vulnerability assessments identify; penetration tests exploit',
      'SAST analyzes source; DAST tests running applications',
      'Testing methods: Black box (no knowledge), White box (full knowledge), Gray box (partial)',
    ],
    knowledgeCheck: [
      { question: 'What is the difference between SAST and DAST?', options: ['SAST is manual; DAST is automated', 'SAST analyzes source code; DAST tests running apps', 'They are the same', 'SAST tests network; DAST tests code'], correctAnswer: 1, explanation: 'SAST analyzes source code without execution. DAST tests running applications dynamically.' },
      { question: 'Which type of test gives testers NO prior knowledge of the infrastructure?', options: ['White Box', 'Gray Box', 'Black Box', 'Crystal Box'], correctAnswer: 2, explanation: 'Black box testing provides no prior knowledge, simulating an external attacker.' },
    ],
    relatedConcepts: ['Security Operations', 'Software Security', 'Audit'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN 7: Security Operations
   ═══════════════════════════════════════════════════════════════════════════ */

const domain7Topics: LearningTopic[] = [
  {
    id: 'd7-incident-response',
    title: 'Incident Response & Forensics',
    subtopics: ['IR Process', 'Detection', 'Containment', 'Eradication', 'Recovery', 'Post-Incident Review', 'Chain of Custody'],
    overview: 'Incident response follows a structured process: Preparation → Detection → Containment → Eradication → Recovery → Post-Incident Review. Digital forensics preserves evidence for legal proceedings.',
    whyItMatters: 'Effective incident response minimizes damage, reduces recovery time and costs, and preserves evidence for legal action. Poor response can amplify damage.',
    cisspFocus: 'CISSP tests the 6 phases of incident response, the order of steps, chain of custody, and forensic principles. Know which actions to take FIRST in an incident scenario.',
    keyConcepts: [
      'Preparation: Policies, tools, trained personnel, communication plans',
      'Detection: Identify anomalies, validate incidents, prioritize',
      'Containment: Isolate affected systems (short-term and long-term)',
      'Eradication: Remove malware, close vulnerabilities, clean systems',
      'Recovery: Restore systems, monitor for reinfection',
      'Post-Incident Review: Lessons learned, improve processes',
      'Chain of Custody: Document who handled evidence and when',
      'Best Evidence: Original media or bit-for-bit copies with proper documentation',
    ],
    examples: [
      'A server shows signs of ransomware. The IR team isolates it from the network (Containment), removes the malware (Eradication), restores from clean backups (Recovery), then conducts a post-mortem (Post-Incident Review).',
      'During forensic investigation, the team creates a bit-for-bit image of the hard drive, documents the chain of custody, and preserves the original drive as evidence.',
    ],
    commonMistakes: [
      'Skipping Preparation (the most important phase)',
      'Containment before identification (isolating the wrong systems)',
      'Failing to preserve chain of custody documentation',
    ],
    examTips: [
      'Preparation comes FIRST — always',
      'Containment BEFORE Eradication BEFORE Recovery',
      'Post-Incident Review is the LAST step — includes lessons learned',
      'Chain of custody is critical for evidence admissibility in court',
    ],
    keyTakeaways: [
      'IR Phases: Preparation → Detection → Containment → Eradication → Recovery → Post-Incident Review',
      'Chain of custody documents all evidence handling',
      'Best evidence = original media or bit-for-bit copies',
    ],
    knowledgeCheck: [
      { question: 'What is the FIRST step in the incident response process?', options: ['Detection', 'Containment', 'Preparation', 'Recovery'], correctAnswer: 2, explanation: 'Preparation must happen before any incident — policies, tools, and trained personnel must be ready.' },
      { question: 'After containing and eradicating malware, what is the NEXT step?', options: ['Post-Incident Review', 'Recovery', 'Detection', 'Notify media'], correctAnswer: 1, explanation: 'Recovery comes after containment and eradication. Post-Incident Review follows recovery.' },
    ],
    relatedConcepts: ['Disaster Recovery', 'Security Operations', 'Monitoring'],
  },
  {
    id: 'd7-monitoring',
    title: 'Monitoring & Security Operations',
    subtopics: ['SIEM', 'Log Management', 'Threat Intelligence', 'SOC Operations', 'Continuous Monitoring'],
    overview: 'Security operations centers (SOC) use SIEM for centralized log analysis, threat detection, and incident response. Continuous monitoring provides real-time visibility into security posture.',
    whyItMatters: 'Without monitoring, organizations are blind to attacks. SIEM correlates events across systems to detect patterns that individual logs would miss.',
    cisspFocus: 'CISSP tests SIEM functions, log types (security, system, application), log protection, and the importance of accurate timestamps for event correlation.',
    keyConcepts: [
      'SIEM: Security Information and Event Management — centralized log collection and analysis',
      'Log Types: Security logs (auth, access), System logs (OS events), Application logs (app events)',
      'Log Protection: Encryption, write-once media, access controls',
      'NTP: Network Time Protocol ensures accurate timestamps across systems',
      'Threat Intelligence: Feeds providing threat indicators (IPs, hashes, domains)',
    ],
    examples: [
      'A SIEM correlates failed login attempts from multiple sources and generates an alert indicating a possible brute-force attack in progress.',
      'An organization uses NTP to synchronize all system clocks, ensuring logs can be accurately correlated during incident investigation.',
    ],
    commonMistakes: [
      'Believing logs are an afterthought (they are critical for detection and forensics)',
      'Forgetting to protect logs from tampering',
      'Not synchronizing clocks across systems',
    ],
    examTips: [
      'SIEM = Centralized log analysis + correlation + alerting',
      'Protect logs with encryption and access controls',
      'NTP synchronization is critical for accurate event correlation',
      'Logs must include: timestamp, source, user, action, result',
    ],
    keyTakeaways: [
      'SIEM provides centralized monitoring and event correlation',
      'Logs must be protected and time-synchronized',
      'Continuous monitoring enables early threat detection',
    ],
    knowledgeCheck: [
      { question: 'What is the PRIMARY purpose of a SIEM?', options: ['Firewall management', 'Centralized log collection and analysis', 'Password management', 'Data backup'], correctAnswer: 1, explanation: 'SIEM collects and analyzes log data for real-time security monitoring and event correlation.' },
      { question: 'Why is NTP important for security monitoring?', options: ['It encrypts logs', 'It ensures accurate timestamps for event correlation', 'It prevents log tampering', 'It compresses log data'], correctAnswer: 1, explanation: 'NTP synchronizes clocks across systems, ensuring accurate timestamps for correlating events during incident investigation.' },
    ],
    relatedConcepts: ['Incident Response', 'Security Assessment', 'Network Security'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN 8: Software Development Security
   ═══════════════════════════════════════════════════════════════════════════ */

const domain8Topics: LearningTopic[] = [
  {
    id: 'd8-sdlc',
    title: 'Secure SDLC & DevSecOps',
    subtopics: ['SDLC Phases', 'Shift Left', 'DevSecOps', 'OWASP Top 10', 'Threat Modeling', 'Code Review'],
    overview: 'Secure SDLC integrates security into every phase of software development. "Shift left" means addressing security early. DevSecOps automates security in CI/CD pipelines.',
    whyItMatters: 'Fixing vulnerabilities in production costs significantly more than during design. Shift-left reduces cost and risk by catching issues early in development.',
    cisspFocus: 'CISSP tests the SDLC phases and when security activities should occur. Know OWASP Top 10 vulnerabilities, threat modeling (STRIDE, PASTA), and code review types.',
    keyConcepts: [
      'SDLC Phases: Requirements → Design → Development → Testing → Deployment → Maintenance',
      'Shift Left: Address security as early as possible in the SDLC',
      'DevSecOps: Automates security testing in CI/CD pipelines ("security as code")',
      'OWASP Top 10: Most critical web application security risks',
      'STRIDE: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation',
      'Code Review: Manual (peer review) and automated (SAST)',
    ],
    examples: [
      'A development team identifies security requirements during the requirements phase, performs threat modeling during design, uses SAST during development, and DAST before deployment.',
      'A CI/CD pipeline automatically runs SAST, dependency scanning, and container scanning on every commit, blocking builds that introduce critical vulnerabilities.',
    ],
    commonMistakes: [
      'Waiting until testing phase to address security',
      'Confusing STRIDE (threat modeling) with OWASP (vulnerability categories)',
      'Believing automated tools replace manual code review',
    ],
    examTips: [
      'Security starts in REQUIREMENTS phase (not testing)',
      'Shift left = earlier in SDLC = cheaper to fix',
      'STRIDE is a threat modeling framework; OWASP Top 10 lists common vulnerabilities',
      'SAST finds code issues; DAST finds runtime issues',
    ],
    keyTakeaways: [
      'Security must be integrated from the requirements phase',
      'DevSecOps automates security in CI/CD pipelines',
      'OWASP Top 10 and STRIDE are key frameworks for software security',
    ],
    knowledgeCheck: [
      { question: 'When should security requirements be identified in the SDLC?', options: ['Testing phase', 'Requirements phase', 'Deployment phase', 'Maintenance phase'], correctAnswer: 1, explanation: 'Security requirements should be identified during the requirements phase to build security in from the start.' },
      { question: 'What does "shift left" mean in secure development?', options: ['Moving to the cloud', 'Addressing security earlier in the SDLC', 'Using left-aligned code', 'Decreasing testing time'], correctAnswer: 1, explanation: '"Shift left" means integrating security activities earlier in the development lifecycle.' },
    ],
    relatedConcepts: ['Security Testing', 'Threat Modeling', 'DevSecOps'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   All Domains Export
   ═══════════════════════════════════════════════════════════════════════════ */

export const domainContent: DomainContent[] = [
  {
    id: 1,
    title: 'Security and Risk Management',
    shortName: 'Security & Risk',
    description: 'Confidentiality, integrity, availability, security governance, compliance, risk management, business continuity, and professional ethics.',
    examWeight: 15,
    topics: domain1Topics,
  },
  {
    id: 2,
    title: 'Asset Security',
    shortName: 'Asset Security',
    description: 'Information and asset classification, ownership, privacy, retention, and data security controls.',
    examWeight: 10,
    topics: domain2Topics,
  },
  {
    id: 3,
    title: 'Security Architecture and Engineering',
    shortName: 'Architecture & Eng.',
    description: 'Security models, architecture, evaluation criteria, cryptography, and physical security.',
    examWeight: 13,
    topics: domain3Topics,
  },
  {
    id: 4,
    title: 'Communication and Network Security',
    shortName: 'Network Security',
    description: 'Network architecture, secure communication channels, network attacks, and monitoring systems.',
    examWeight: 13,
    topics: domain4Topics,
  },
  {
    id: 5,
    title: 'Identity and Access Management (IAM)',
    shortName: 'IAM',
    description: 'Identity management, access control models, provisioning, and authentication mechanisms.',
    examWeight: 13,
    topics: domain5Topics,
  },
  {
    id: 6,
    title: 'Security Assessment and Testing',
    shortName: 'Assessment & Testing',
    description: 'Security testing, assessments, audits, and vulnerability management.',
    examWeight: 12,
    topics: domain6Topics,
  },
  {
    id: 7,
    title: 'Security Operations',
    shortName: 'SecOps',
    description: 'Operations, incident response, disaster recovery, investigations, and monitoring.',
    examWeight: 13,
    topics: domain7Topics,
  },
  {
    id: 8,
    title: 'Software Development Security',
    shortName: 'Software Security',
    description: 'Secure development lifecycle, application security, and software assurance.',
    examWeight: 11,
    topics: domain8Topics,
  },
];

/**
 * Get domain content by domain ID.
 */
export function getDomainContent(domainId: number): DomainContent | undefined {
  return domainContent.find(d => d.id === domainId);
}

/**
 * Get a specific topic across all domains.
 */
export function getTopic(domainId: number, topicId: string): LearningTopic | undefined {
  const domain = getDomainContent(domainId);
  return domain?.topics.find(t => t.id === topicId);
}

/**
 * Get total estimated learning hours across all domains.
 */
export function getTotalLearningHours(): number {
  const totalTopics = domainContent.reduce((s, d) => s + d.topics.length, 0);
  return Math.round(totalTopics * 1.5); // ~1.5 hours per topic
}
