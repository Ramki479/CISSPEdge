import type { Question } from '../types';

/**
 * Enhanced scenario-based CISSP questions across all 17 skill areas.
 * Each question includes per-option explanations and skill area mappings
 * for the skills assessment engine.
 */

/* ─── Skill Area Index ───────────────────────────────────────────────────────
 *   1  → Information Security Governance
 *   2  → Risk Management
 *   3  → Security Architecture and Engineering
 *   4  → Network Security
 *   5  → Identity and Access Management (IAM)
 *   6  → Security Operations
 *   7  → Security Assessment and Testing
 *   8  → Software Development Security
 *   9  → Incident Response and Forensics
 *   10 → Cloud Security
 *   11 → Zero Trust Architecture
 *   12 → Threat Modeling
 *   13 → Business Continuity and Disaster Recovery
 *   14 → Security Leadership and Communication
 *   15 → Analytical and Critical Thinking
 *   16 → Data Protection and Privacy
 *   17 → Compliance and Legal
 * ──────────────────────────────────────────────────────────────────────────── */

export const enhancedQuestions: Question[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 1: Information Security Governance
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-gov-01', domainId: 1, type: 'scenario', difficulty: 'hard',
    text: 'As the newly appointed CISO of a multinational corporation, you discover that the organization lacks a formal security governance framework. Business units have been making independent security decisions, resulting in inconsistent controls and compliance gaps. What is the BEST first step to establish effective security governance?',
    options: [
      'Deploy an enterprise-wide SIEM solution to gain visibility across all business units',
      'Develop and implement a comprehensive information security policy framework aligned with business objectives',
      'Conduct penetration tests on all business units to identify vulnerabilities',
      'Purchase cyber insurance to transfer identified risks to a third party',
    ],
    correctAnswer: 1,
    explanation: 'The correct first step is to develop a security policy framework. Governance requires establishing the foundational policies, standards, and procedures that define management\'s intent, assign responsibilities, and provide the basis for consistent security decisions across the organization. A SIEM (option A) is a tactical tool that comes after governance is established. Penetration testing (option C) identifies vulnerabilities but doesn\'t establish governance. Cyber insurance (option D) is a risk transfer mechanism that should be part of a broader risk management program, not a substitute for governance.',
    optionExplanations: [
      { text: 'Deploy an enterprise-wide SIEM solution to gain visibility across all business units', explanation: 'A SIEM is a valuable technical control for security monitoring, but it is a tactical solution that addresses detection capabilities. It does not establish the strategic governance framework, policies, and accountabilities needed to guide security decisions across the organization. Deploying SIEM without governance leads to alerts without ownership.' },
      { text: 'Develop and implement a comprehensive information security policy framework aligned with business objectives', explanation: 'CORRECT. Security governance begins with establishing a policy framework that defines management direction, assigns responsibilities, and creates accountability. This includes security policies, standards, baselines, guidelines, and procedures that align with business objectives and regulatory requirements.' },
      { text: 'Conduct penetration tests on all business units to identify vulnerabilities', explanation: 'Penetration testing is an important security assessment activity, but it operates at the tactical/operational level. Without governance structures to own, prioritize, and remediate findings, penetration tests provide limited long-term value. Governance must come first.' },
      { text: 'Purchase cyber insurance to transfer identified risks to a third party', explanation: 'Cyber insurance is a risk transfer mechanism that can be part of a risk management program. However, it does not establish governance. Insurers also require evidence of governance and security controls before providing coverage.' },
    ],
    concepts: ['Security Governance', 'Policy Framework', 'CISO Responsibilities', 'Strategic Management'],
    skillAreas: ['Information Security Governance', 'Security Leadership and Communication'],
  },
  {
    id: 'eq-gov-02', domainId: 1, type: 'scenario', difficulty: 'medium',
    text: 'A financial institution\'s board of directors wants to understand the organization\'s security posture and whether they are meeting regulatory obligations. The CISO needs to present a meaningful report. Which approach BEST communicates security governance effectiveness to the board?',
    options: [
      'Present detailed technical vulnerability scan results and patch status reports',
      'Provide a dashboard showing key risk indicators (KRIs), compliance status, and security program metrics aligned to business impact',
      'List all security incidents from the past quarter with technical root cause analysis',
      'Demonstrate a live penetration test during the board meeting',
    ],
    correctAnswer: 1,
    explanation: 'Boards need strategic, risk-focused information. KRIs, compliance dashboards, and business-aligned metrics give board members the information they need to make informed decisions about risk acceptance, resource allocation, and strategic direction. Detailed technical data (options A and C) is too granular. Live demonstrations (option D) are theatrical and impractical for governance reporting.',
    optionExplanations: [
      { text: 'Present detailed technical vulnerability scan results and patch status reports', explanation: 'While technically important, vulnerability data is too granular for board-level reporting. Boards need summarized, risk-based information that connects security status to business outcomes, not raw technical data.' },
      { text: 'Provide a dashboard showing key risk indicators (KRIs), compliance status, and security program metrics aligned to business impact', explanation: 'CORRECT. Board-level reporting should present security in business context. KRIs, compliance status, trend analysis, and metrics tied to business objectives enable informed governance decisions.' },
      { text: 'List all security incidents from the past quarter with technical root cause analysis', explanation: 'Incident data is important, but technical root cause analysis belongs in operational reviews. The board needs summarized incident trends, business impact, and lessons learned — not technical details of each event.' },
      { text: 'Demonstrate a live penetration test during the board meeting', explanation: 'Live demonstrations are impractical, risky, and provide limited governance value. They may entertain but do not help the board understand the strategic security posture or make informed decisions.' },
    ],
    concepts: ['Board Reporting', 'Key Risk Indicators', 'Security Metrics', 'Governance Communication'],
    skillAreas: ['Information Security Governance', 'Security Leadership and Communication'],
  },
  {
    id: 'eq-gov-03', domainId: 1, type: 'multiple-choice', difficulty: 'medium',
    text: 'A CISO is building a security program from scratch. Which document should be developed FIRST to establish the foundation for all other security activities?',
    options: [
      'Incident Response Plan',
      'Information Security Policy',
      'Network Architecture Diagram',
      'Business Continuity Plan',
    ],
    correctAnswer: 1,
    explanation: 'The Information Security Policy is the foundational governance document that communicates management\'s intent, establishes the security program\'s scope and objectives, and provides the authority for all subordinate standards, procedures, and guidelines. All other plans (IR, BCP) depend on the policy framework for authority and direction.',
    optionExplanations: [
      { text: 'Incident Response Plan', explanation: 'Important but not foundational. The IR plan is a operational document that should be developed within the context of the security policy framework. Without policy authority, an IR plan lacks organizational mandate.' },
      { text: 'Information Security Policy', explanation: 'CORRECT. The information security policy is the highest-level document in the governance hierarchy. It establishes management direction, defines the security program, and provides the mandate for all subordinate documents and controls.' },
      { text: 'Network Architecture Diagram', explanation: 'A technical artifact that supports security operations but is not a governance document. Architecture decisions should align with policies, not precede them.' },
      { text: 'Business Continuity Plan', explanation: 'A BCP is an important operational plan, but it should align with the security policy framework. The policy framework establishes the BCP\'s scope and requirements.' },
    ],
    concepts: ['Security Policy', 'Governance Hierarchy', 'Program Development'],
    skillAreas: ['Information Security Governance'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 2: Risk Management
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-risk-01', domainId: 1, type: 'scenario', difficulty: 'hard',
    text: 'A healthcare organization is evaluating whether to implement a new telemedicine platform. The project team has identified that patient data will be transmitted over the internet and stored in the cloud. The risk manager needs to determine the most appropriate approach. Which risk management process should be applied FIRST?',
    options: [
      'Conduct a quantitative risk analysis to calculate ALE and compare to control costs',
      'Perform a qualitative risk assessment to identify, evaluate, and prioritize risks based on likelihood and impact',
      'Immediately implement encryption controls before any analysis',
      'Transfer all risk to the cloud provider through contract agreements',
    ],
    correctAnswer: 1,
    explanation: 'A qualitative risk assessment should be performed first to identify and prioritize risks before deciding on treatment strategies. This allows the organization to understand which risks are most critical, determine risk appetite, and make informed decisions about whether to mitigate, transfer, accept, or avoid each risk.',
    optionExplanations: [
      { text: 'Conduct a quantitative risk analysis to calculate ALE and compare to control costs', explanation: 'Quantitative analysis can be valuable, but it requires reliable data (asset values, exposure factors, occurrence rates) that may not yet be available. Qualitative assessment is typically performed first to identify and prioritize risks.' },
      { text: 'Perform a qualitative risk assessment to identify, evaluate, and prioritize risks based on likelihood and impact', explanation: 'CORRECT. Qualitative risk assessment uses scenario-based evaluation of likelihood and impact to prioritize risks. It is the appropriate first step to understand the risk landscape before deciding on treatment strategies.' },
      { text: 'Immediately implement encryption controls before any analysis', explanation: 'While encryption is a good security practice, implementing controls without understanding the full risk picture may lead to misallocation of resources. Controls should be selected based on risk assessment findings.' },
      { text: 'Transfer all risk to the cloud provider through contract agreements', explanation: 'Risk cannot be fully transferred through contracts. The organization retains ultimate accountability for patient data under HIPAA. Cloud providers can share responsibility, but the healthcare organization remains liable.' },
    ],
    concepts: ['Risk Assessment', 'Qualitative Risk', 'Risk Treatment', 'Healthcare Security'],
    skillAreas: ['Risk Management', 'Compliance and Legal'],
  },
  {
    id: 'eq-risk-02', domainId: 1, type: 'scenario', difficulty: 'hard',
    text: 'A CISO is presenting risk analysis results to the board. A critical application has a SLE of $2 million and an ARO of 0.3. Mitigation controls would cost $500,000 per year. Based on quantitative analysis, which recommendation is MOST justified?',
    options: [
      'Accept the risk because the ALE is less than the control cost',
      'Implement the controls because the ALE exceeds the control cost',
      'Transfer the risk through insurance without implementing controls',
      'Avoid the risk by decommissioning the application',
    ],
    correctAnswer: 1,
    explanation: 'The ALE = SLE × ARO = $2,000,000 × 0.3 = $600,000 per year. Since the control cost ($500,000) is less than the ALE ($600,000), implementing controls is economically justified. The net benefit is $100,000 per year in reduced expected loss.',
    optionExplanations: [
      { text: 'Accept the risk because the ALE is less than the control cost', explanation: 'Incorrect calculation. The ALE ($600,000) actually exceeds the control cost ($500,000), making risk acceptance the more expensive option over time.' },
      { text: 'Implement the controls because the ALE exceeds the control cost', explanation: 'CORRECT. ALE = $600,000/year. Controls cost $500,000/year. The controls save $100,000/year in expected losses, making mitigation economically justified.' },
      { text: 'Transfer the risk through insurance without implementing controls', explanation: 'Insurance transfers financial risk but premiums are based on risk level. Insurers may require controls before providing coverage, and premiums may exceed $500,000.' },
      { text: 'Avoid the risk by decommissioning the application', explanation: 'Avoidance eliminates the risk but also eliminates the business value the application provides. This should only be considered if the risk exceeds the business benefit.' },
    ],
    concepts: ['Quantitative Risk Analysis', 'ALE', 'SLE', 'ROI', 'Risk Treatment'],
    skillAreas: ['Risk Management', 'Analytical and Critical Thinking'],
  },
  {
    id: 'eq-risk-03', domainId: 1, type: 'scenario', difficulty: 'medium',
    text: 'During a risk assessment, you identify that a legacy system contains sensitive customer data and cannot be patched due to vendor end-of-life. The system is critical to operations. What is the BEST risk management approach?',
    options: [
      'Immediately disconnect the system from the network',
      'Implement compensating controls such as network segmentation, strict access controls, and enhanced monitoring',
      'Accept the risk without additional action because the system is critical',
      'Replace the system with a newer version immediately',
    ],
    correctAnswer: 1,
    explanation: 'When a system cannot be patched, compensating controls provide defense-in-depth. Network segmentation limits exposure, strict access controls reduce the attack surface, and enhanced monitoring enables early detection of compromise. This balances security with operational needs while a more permanent solution is pursued.',
    optionExplanations: [
      { text: 'Immediately disconnect the system from the network', explanation: 'While this eliminates the network-based risk, it also eliminates the business function the system provides. Compensating controls allow the business to continue operating with reduced risk.' },
      { text: 'Implement compensating controls such as network segmentation, strict access controls, and enhanced monitoring', explanation: 'CORRECT. Compensating controls provide alternative protection when primary controls cannot be applied. Segmentation, access controls, and monitoring create defense-in-depth without disrupting operations.' },
      { text: 'Accept the risk without additional action because the system is critical', explanation: 'Risk acceptance without implementing compensating controls is not responsible governance. The organization should only accept residual risk after implementing reasonable controls.' },
      { text: 'Replace the system with a newer version immediately', explanation: 'While replacement is the ideal long-term solution, immediate replacement may not be feasible due to cost, migration complexity, or availability. Compensating controls bridge the gap.' },
    ],
    concepts: ['Compensating Controls', 'Legacy Systems', 'Risk Mitigation', 'Defense-in-Depth'],
    skillAreas: ['Risk Management', 'Security Operations'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 3: Security Architecture and Engineering
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-arch-01', domainId: 3, type: 'scenario', difficulty: 'hard',
    text: 'A defense contractor is designing a system that processes classified information. The system must prevent users with Top Secret clearance from accidentally disclosing classified data to users with Secret clearance. Which security model BEST addresses this requirement?',
    options: [
      'Biba integrity model',
      'Bell-LaPadula confidentiality model',
      'Clark-Wilson integrity model',
      'Chinese Wall model',
    ],
    correctAnswer: 1,
    explanation: 'The Bell-LaPadula model enforces confidentiality through "no read up" (subjects cannot read objects at a higher classification) and "no write down" (subjects cannot write to objects at a lower classification). The "no write down" property specifically prevents Top Secret subjects from writing data to Secret objects, preventing the downward flow of classified information.',
    optionExplanations: [
      { text: 'Biba integrity model', explanation: 'The Biba model addresses integrity, not confidentiality. It prevents unauthorized modification of data using "no write up" and "no read down". It does not address the disclosure concern described.' },
      { text: 'Bell-LaPadula confidentiality model', explanation: 'CORRECT. Bell-LaPadula is a mandatory access control model focused on confidentiality. Its "*" (star) property prevents write-down, ensuring high-clearance subjects cannot write data to lower-classification objects.' },
      { text: 'Clark-Wilson integrity model', explanation: 'Clark-Wilson focuses on integrity through well-formed transactions and separation of duties. It is commonly used in commercial applications to prevent fraud but does not address confidentiality or classification.' },
      { text: 'Chinese Wall model', explanation: 'The Chinese Wall (Brewer-Nash) model addresses conflict of interest by preventing access to competing organizations\' data. It does not address classification-based confidentiality.' },
    ],
    concepts: ['Bell-LaPadula', 'Confidentiality Models', 'Mandatory Access Control', 'Classification'],
    skillAreas: ['Security Architecture and Engineering'],
  },
  {
    id: 'eq-arch-02', domainId: 3, type: 'scenario', difficulty: 'expert',
    text: 'A financial institution is designing a new payment processing system that must ensure transaction integrity, prevent fraudulent modifications, and provide non-repudiation. The system uses symmetric encryption for data at rest and asymmetric encryption for communications. What cryptographic enhancement would BEST provide non-repudiation for transactions?',
    options: [
      'Implement AES-256 encryption for all transaction data',
      'Use digital signatures with the sender\'s private key for each transaction',
      'Deploy a hardware security module (HSM) for key storage',
      'Implement TLS 1.3 for all API communications',
    ],
    correctAnswer: 1,
    explanation: 'Non-repudiation requires that the sender cannot deny having sent a transaction. Digital signatures uniquely bind the sender to the transaction because only the sender possesses their private key. The recipient can verify the signature using the sender\'s public key. AES (option A) provides confidentiality but not non-repudiation. HSM (option C) secures keys but doesn\'t inherently provide non-repudiation. TLS (option D) provides channel security but doesn\'t provide transaction-level non-repudiation.',
    optionExplanations: [
      { text: 'Implement AES-256 encryption for all transaction data', explanation: 'AES provides confidentiality (protecting data from unauthorized disclosure) but does not provide non-repudiation. With symmetric encryption, both parties share the same key, so either could have created a message.' },
      { text: 'Use digital signatures with the sender\'s private key for each transaction', explanation: 'CORRECT. Digital signatures use asymmetric cryptography where the sender signs with their private key. The recipient verifies with the sender\'s public key. Only the sender could have created the signature, providing non-repudiation.' },
      { text: 'Deploy a hardware security module (HSM) for key storage', explanation: 'HSMs provide tamper-resistant storage for cryptographic keys and accelerate cryptographic operations. While important for key management, they do not independently provide non-repudiation.' },
      { text: 'Implement TLS 1.3 for all API communications', explanation: 'TLS provides encryption, authentication, and integrity for data in transit but does not provide transaction-level non-repudiation. TLS protects the channel, not the individual transactions.' },
    ],
    concepts: ['Non-repudiation', 'Digital Signatures', 'Asymmetric Cryptography', 'PKI'],
    skillAreas: ['Security Architecture and Engineering', 'Analytical and Critical Thinking'],
  },
  {
    id: 'eq-arch-03', domainId: 3, type: 'multiple-choice', difficulty: 'medium',
    text: 'An organization is designing a secure facility for its data center. Which physical security control is MOST effective at preventing unauthorized physical access?',
    options: [
      'Single factor authentication at the main entrance',
      'Defense-in-depth with multiple layers: perimeter fence, mantraps, biometric access, and security guards',
      'Security cameras at all entrances and exits',
      'A single, highly secure vault door at the server room entrance',
    ],
    correctAnswer: 1,
    explanation: 'Physical security should follow the defense-in-depth principle with multiple overlapping layers. Perimeter controls (fence, gates), building controls (mantraps, guards), and interior controls (biometrics, access cards) create multiple barriers that an attacker must overcome. Single controls (A, C, D) can be bypassed; multiple layers dramatically increase security.',
    optionExplanations: [
      { text: 'Single factor authentication at the main entrance', explanation: 'Single factor can be compromised. Combined with other controls it becomes part of a defense-in-depth strategy, but alone it is insufficient for a data center protecting sensitive assets.' },
      { text: 'Defense-in-depth with multiple layers: perimeter fence, mantraps, biometric access, and security guards', explanation: 'CORRECT. Defense-in-depth provides multiple independent layers of protection. If one layer fails, subsequent layers still provide protection. This is the recommended approach for critical facility security.' },
      { text: 'Security cameras at all entrances and exits', explanation: 'Cameras are detective controls — they record incidents but do not prevent unauthorized access. They are valuable as part of a comprehensive strategy but not sufficient alone.' },
      { text: 'A single, highly secure vault door at the server room entrance', explanation: 'A vault door is a strong physical barrier, but if an attacker breaches the outer perimeter, they have free access to the facility until reaching the vault. Multiple layers are more effective.' },
    ],
    concepts: ['Physical Security', 'Defense-in-Depth', 'Data Center Security', 'Access Control'],
    skillAreas: ['Security Architecture and Engineering', 'Security Operations'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 4: Network Security
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-net-01', domainId: 4, type: 'scenario', difficulty: 'hard',
    text: 'A hospital is redesigning its network to support IoT medical devices, EHR systems, guest Wi-Fi, and administrative workstations. What network architecture BEST balances security, compliance (HIPAA), and operational requirements?',
    options: [
      'Create a flat network with all devices on the same subnet for ease of management',
      'Implement network segmentation with separate VLANs for medical devices, EHR systems, guest Wi-Fi, and administrative systems, with strict ACLs between zones',
      'Place all systems behind a single firewall with no internal segmentation',
      'Use a DMZ for all internal systems and treat everything as untrusted',
    ],
    correctAnswer: 1,
    explanation: 'Network segmentation using VLANs is the recommended approach for healthcare environments. Medical devices (which often have limited security capabilities) are isolated from the main network. EHR systems are protected with strict access controls. Guest Wi-Fi is completely separated from internal systems. ACLs control what traffic passes between zones, following the principle of least privilege.',
    optionExplanations: [
      { text: 'Create a flat network with all devices on the same subnet for ease of management', explanation: 'A flat network allows unrestricted lateral movement. If an attacker compromises a guest device, they can directly access medical devices and EHR systems. This violates HIPAA security requirements.' },
      { text: 'Implement network segmentation with separate VLANs for medical devices, EHR systems, guest Wi-Fi, and administrative systems, with strict ACLs between zones', explanation: 'CORRECT. Segmentation isolates different trust zones, prevents lateral movement, and enables zone-specific security policies. This approach aligns with HIPAA, NIST, and network security best practices.' },
      { text: 'Place all systems behind a single firewall with no internal segmentation', explanation: 'A single perimeter firewall without internal segmentation provides no protection against internal threats or lateral movement. Once inside the perimeter, attackers have full access.' },
      { text: 'Use a DMZ for all internal systems and treat everything as untrusted', explanation: 'A DMZ is designed for public-facing services. Placing all internal systems in a DMZ would create unnecessary complexity and may not provide the right security posture for internal systems.' },
    ],
    concepts: ['Network Segmentation', 'VLAN', 'ACL', 'IoT Security', 'Healthcare', 'Defense-in-Depth'],
    skillAreas: ['Network Security', 'Security Operations'],
  },
  {
    id: 'eq-net-02', domainId: 4, type: 'scenario', difficulty: 'hard',
    text: 'A security analyst detects unusual outbound traffic from a database server to an unknown IP address in a foreign country. The traffic is occurring outside of normal business hours. What is the MOST appropriate immediate response?',
    options: [
      'Block the IP address at the firewall and continue monitoring',
      'Isolate the database server from the network and begin forensic investigation',
      'Ignore the traffic as it may be a routine update',
      'Shut down the entire database cluster',
    ],
    correctAnswer: 1,
    explanation: 'Unusual outbound traffic to an unknown foreign IP outside business hours is a strong indicator of compromise (likely C2 communication or data exfiltration). The server should be isolated to prevent further data loss while preserving evidence for forensic investigation. Blocking just the IP (option A) is insufficient — the attacker may have multiple C2 servers. Ignoring (option C) is negligent. Shutting down the entire cluster (option D) may be excessive and could cause business disruption.',
    optionExplanations: [
      { text: 'Block the IP address at the firewall and continue monitoring', explanation: 'Blocking the known C2 IP is partially correct, but sophisticated attackers often have multiple fallback C2 servers. The server itself may be compromised and should be isolated for investigation.' },
      { text: 'Isolate the database server from the network and begin forensic investigation', explanation: 'CORRECT. Isolation prevents further data exfiltration and potential lateral movement while preserving the system state for forensic analysis. A full investigation can then determine the scope of compromise.' },
      { text: 'Ignore the traffic as it may be a routine update', explanation: 'Outbound traffic to a foreign IP outside business hours from a database server is unlikely to be a routine update. Ignoring potential indicators of compromise is a serious failure in security operations.' },
      { text: 'Shut down the entire database cluster', explanation: 'Shutting down the entire cluster is excessive and may cause significant business disruption. Isolating the affected server achieves containment while preserving availability for other systems.' },
    ],
    concepts: ['Network Monitoring', 'Indicators of Compromise', 'C2 Communication', 'Incident Response'],
    skillAreas: ['Network Security', 'Incident Response and Forensics', 'Security Operations'],
  },
  {
    id: 'eq-net-03', domainId: 4, type: 'scenario', difficulty: 'medium',
    text: 'A company wants to provide secure remote access for employees working from home. They need to ensure that corporate data remains protected and that the remote connection does not introduce vulnerabilities. Which solution BEST meets these requirements?',
    options: [
      'Require employees to use personal VPN services of their choice',
      'Deploy a corporate VPN with MFA authentication, endpoint compliance checking, and split-tunneling disabled',
      'Allow direct RDP access to workstations through the firewall',
      'Provide employees with cloud-based file sharing and skip the VPN',
    ],
    correctAnswer: 1,
    explanation: 'A corporate-managed VPN with MFA provides encrypted tunnels, ensures only authorized users connect, enforces endpoint security posture, and prevents split-tunneling to ensure all traffic goes through corporate security controls. Personal VPNs (option A) provide no organizational control. Direct RDP (option C) is extremely dangerous. Cloud file sharing (option D) doesn\'t address access to internal applications.',
    optionExplanations: [
      { text: 'Require employees to use personal VPN services of their choice', explanation: 'Personal VPNs provide no organizational control, auditing, or security policy enforcement. The organization cannot verify the security of personal VPN services.' },
      { text: 'Deploy a corporate VPN with MFA authentication, endpoint compliance checking, and split-tunneling disabled', explanation: 'CORRECT. A corporate VPN provides encrypted tunnels authenticated by MFA. Endpoint compliance checking ensures devices meet security requirements. Disabling split-tunneling forces traffic through corporate security controls.' },
      { text: 'Allow direct RDP access to workstations through the firewall', explanation: 'Direct RDP exposure to the internet is extremely dangerous. RDP has a history of critical vulnerabilities and is a primary target for ransomware attacks. It should never be directly exposed.' },
      { text: 'Provide employees with cloud-based file sharing and skip the VPN', explanation: 'Cloud file sharing addresses file access but not access to internal applications, databases, or systems. It is not a complete remote access solution.' },
    ],
    concepts: ['VPN', 'Remote Access', 'MFA', 'Endpoint Security', 'Secure Communications'],
    skillAreas: ['Network Security', 'Identity and Access Management (IAM)'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 5: Identity and Access Management (IAM)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-iam-01', domainId: 5, type: 'scenario', difficulty: 'hard',
    text: 'A large enterprise is migrating from on-premise Active Directory to a cloud-based identity solution. They have 50,000 users across 20 countries and need to support both cloud (SaaS) and on-premise applications during a 2-year migration period. What identity architecture BEST supports this scenario?',
    options: [
      'Create separate identity stores for each region and application',
      'Implement a hybrid identity solution with directory synchronization, federated authentication (SAML/OIDC), and seamless SSO',
      'Migrate all users to cloud identity immediately and recreate on-premise AD as needed',
      'Maintain on-premise AD only and use VPN for cloud application access',
    ],
    correctAnswer: 1,
    explanation: 'A hybrid identity solution provides the best transitional architecture. Directory synchronization keeps passwords/hashes synchronized between on-prem AD and Azure AD/cloud IDP. Federation (SAML, OIDC) enables SSO across both environments. Users authenticate once and access all authorized resources regardless of location. This provides a smooth migration path.',
    optionExplanations: [
      { text: 'Create separate identity stores for each region and application', explanation: 'Siloed identity stores create management overhead, inconsistent policies, poor user experience, and security gaps. Users would need multiple credentials and IT would struggle to maintain consistent access policies.' },
      { text: 'Implement a hybrid identity solution with directory synchronization, federated authentication (SAML/OIDC), and seamless SSO', explanation: 'CORRECT. Hybrid identity provides a unified identity layer across on-premise and cloud. Directory sync keeps identities consistent, federation enables cross-environment SSO, and the migration can proceed incrementally.' },
      { text: 'Migrate all users to cloud identity immediately and recreate on-premise AD as needed', explanation: 'An immediate full migration is high-risk and disruptive. On-premise applications may require AD authentication that cloud-only identity cannot provide. A gradual hybrid approach is more practical.' },
      { text: 'Maintain on-premise AD only and use VPN for cloud application access', explanation: 'Using VPN for cloud applications defeats the purpose of cloud adoption, creates poor user experience, and adds latency. Modern IAM should support cloud-native authentication.' },
    ],
    concepts: ['Hybrid Identity', 'Federation', 'SAML', 'OIDC', 'SSO', 'Directory Synchronization'],
    skillAreas: ['Identity and Access Management (IAM)', 'Cloud Security'],
  },
  {
    id: 'eq-iam-02', domainId: 5, type: 'scenario', difficulty: 'medium',
    text: 'An employee is terminated from the organization. What is the MOST critical IAM action that should be taken immediately?',
    options: [
      'Send an email notification to all employees about the termination',
      'Disable all of the terminated employee\'s accounts and revoke active sessions',
      'Delete the employee\'s files and email data',
      'Remove the employee\'s badge from the access control system',
    ],
    correctAnswer: 1,
    explanation: 'The immediate priority is to disable accounts and revoke sessions to prevent unauthorized access. This includes network accounts, application access, VPN, email, and cloud services. While badge removal (option D) is also important, digital accounts pose the greatest immediate risk of data theft or sabotage. Files and email (option C) should be preserved for potential legal or business needs, not deleted.',
    optionExplanations: [
      { text: 'Send an email notification to all employees about the termination', explanation: 'Communicating terminations broadly may create workplace issues and potentially violate privacy laws. Notification should be limited to those with a business need to know.' },
      { text: 'Disable all of the terminated employee\'s accounts and revoke active sessions', explanation: 'CORRECT. Account disabling prevents the former employee from accessing systems. Session revocation ensures any active sessions are terminated immediately, preventing damage during the transition period.' },
      { text: 'Delete the employee\'s files and email data', explanation: 'Deleting data may destroy evidence needed for legal proceedings or business continuity. Data should be preserved for a period defined in the retention policy before permanent deletion.' },
      { text: 'Remove the employee\'s badge from the access control system', explanation: 'Physical access removal is important but should be done in parallel with digital account disablement. Digital access poses a greater immediate risk of data loss.' },
    ],
    concepts: ['Account Termination', 'Offboarding', 'Access Revocation', 'Identity Lifecycle'],
    skillAreas: ['Identity and Access Management (IAM)', 'Security Operations'],
  },
  {
    id: 'eq-iam-03', domainId: 5, type: 'scenario', difficulty: 'hard',
    text: 'A company is implementing MFA for all users. Some employees in remote areas have limited cellular connectivity and no reliable smartphone access. What is the BEST approach to ensure security while maintaining accessibility?',
    options: [
      'Exempt remote employees from MFA requirements',
      'Provide hardware TOTP tokens and implement offline-capable MFA methods',
      'Require all employees to relocate to areas with better connectivity',
      'Use SMS-based authentication for all employees since it works on all phones',
    ],
    correctAnswer: 1,
    explanation: 'Hardware TOTP (Time-based One-Time Password) tokens provide strong MFA without requiring cellular connectivity or smartphones. The tokens generate codes locally using a shared secret and the current time. This is the NIST-recommended approach for users who cannot use smartphone-based authenticators. SMS (option D) is increasingly discouraged due to SIM-swapping attacks and requires cellular connectivity.',
    optionExplanations: [
      { text: 'Exempt remote employees from MFA requirements', explanation: 'Exempting users creates security gaps that attackers can exploit. MFA should be universal to be effective. Exceptions should only be made when absolutely necessary and with compensating controls.' },
      { text: 'Provide hardware TOTP tokens and implement offline-capable MFA methods', explanation: 'CORRECT. Hardware TOTP tokens generate codes without network connectivity. They provide strong second-factor authentication that works reliably in low-connectivity environments.' },
      { text: 'Require all employees to relocate to areas with better connectivity', explanation: 'Requiring relocation is impractical and likely impossible for most organizations. Security controls should accommodate operational realities, not force employees to change their circumstances.' },
      { text: 'Use SMS-based authentication for all employees since it works on all phones', explanation: 'SMS-based MFA has well-documented security issues, including SIM-swapping attacks and interception vulnerabilities. NIST specifically deprecated SMS as an out-of-band verifier.' },
    ],
    concepts: ['MFA', 'TOTP', 'Hardware Tokens', 'Authentication Accessibility'],
    skillAreas: ['Identity and Access Management (IAM)', 'Security Leadership and Communication'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 6: Security Operations
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-secops-01', domainId: 7, type: 'scenario', difficulty: 'hard',
    text: 'A SOC analyst receives an alert that a user account executed a PowerShell command that downloaded a file from an external IP and immediately executed it. The user reports they did not initiate this activity. What is the MOST appropriate immediate action?',
    options: [
      'Close the alert as a false positive since the user denied initiating the activity',
      'Isolate the affected workstation from the network and begin investigation',
      'Delete the downloaded file from the workstation',
      'Reset the user\'s password and require them to run a full antivirus scan',
    ],
    correctAnswer: 1,
    explanation: 'This scenario strongly indicates a potential compromise — a process executing laterally or remotely on the user\'s workstation without their knowledge. The workstation should be isolated to prevent further damage, lateral movement, or data exfiltration. The file and system should be preserved for forensic analysis. Password reset (option D) is insufficient since the attacker may already have persistence on the system.',
    optionExplanations: [
      { text: 'Close the alert as a false positive since the user denied initiating the activity', explanation: 'User denial does not make it a false positive. This is likely malware that executed without user knowledge. Dismissing the alert could allow the attacker to establish persistence.' },
      { text: 'Isolate the affected workstation from the network and begin investigation', explanation: 'CORRECT. Isolation prevents lateral movement and data exfiltration while preserving evidence. The SOC can then analyze the file, check for persistence mechanisms, and determine the scope.' },
      { text: 'Delete the downloaded file from the workstation', explanation: 'Deleting the file destroys evidence and does not address potential root cause, persistence mechanisms, or lateral movement. The system should be preserved for forensic analysis.' },
      { text: 'Reset the user\'s password and require them to run a full antivirus scan', explanation: 'Password reset addresses credential-based threats but does not address system-level compromise. The attacker may have persistence that survives password changes.' },
    ],
    concepts: ['SOC Operations', 'Alert Triage', 'Containment', 'Malware Analysis', 'Lateral Movement'],
    skillAreas: ['Security Operations', 'Incident Response and Forensics'],
  },
  {
    id: 'eq-secops-02', domainId: 7, type: 'scenario', difficulty: 'medium',
    text: 'A security team is implementing a vulnerability management program. They have identified 5,000 vulnerabilities across the enterprise. What is the BEST approach to prioritize remediation efforts?',
    options: [
      'Attempt to patch all 5,000 vulnerabilities as quickly as possible',
      'Prioritize based on CVSS scores, asset criticality, threat intelligence, and exploitability in the organization\'s environment',
      'Only patch vulnerabilities rated as "critical" by the scanner',
      'Wait for the next scheduled patch cycle to address all vulnerabilities',
    ],
    correctAnswer: 1,
    explanation: 'Not all vulnerabilities pose equal risk. Prioritization should consider the CVSS score (severity), the criticality of the affected asset, whether active exploits exist in the wild, and whether compensating controls already mitigate the risk. This risk-based approach ensures resources are focused on the most impactful vulnerabilities.',
    optionExplanations: [
      { text: 'Attempt to patch all 5,000 vulnerabilities as quickly as possible', explanation: 'Patching everything immediately is impractical and may cause operational disruptions without proper testing. Some "vulnerabilities" may be false positives or already mitigated.' },
      { text: 'Prioritize based on CVSS scores, asset criticality, threat intelligence, and exploitability in the organization\'s environment', explanation: 'CORRECT. Risk-based prioritization considers multiple factors to focus on vulnerabilities that pose the greatest real-world risk. This is the industry-standard approach.' },
      { text: 'Only patch vulnerabilities rated as "critical" by the scanner', explanation: 'Critical-rated vulnerabilities should be high priority, but medium-rated vulnerabilities affecting critical assets with active exploits may also need immediate attention.' },
      { text: 'Wait for the next scheduled patch cycle to address all vulnerabilities', explanation: 'Passive patching on a fixed schedule ignores the urgency of actively exploited vulnerabilities. The program should include both scheduled patching and emergency out-of-cycle patching.' },
    ],
    concepts: ['Vulnerability Management', 'Risk Prioritization', 'CVSS', 'Patch Management'],
    skillAreas: ['Security Operations', 'Security Assessment and Testing'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 7: Security Assessment and Testing
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-assess-01', domainId: 6, type: 'scenario', difficulty: 'hard',
    text: 'A penetration testing team is engaged to test a financial application. The rules of engagement specify that the test must not cause service disruption. During the test, the team discovers a SQL injection vulnerability that could potentially lead to data exfiltration. What is the MOST appropriate course of action?',
    options: [
      'Exploit the SQL injection fully to demonstrate the maximum business impact',
      'Document the vulnerability as a finding without exploiting it, in accordance with ROE',
      'Ignore the vulnerability since it might cause disruption',
      'Notify law enforcement immediately',
    ],
    correctAnswer: 1,
    explanation: 'The rules of engagement are a binding agreement between the testing team and the organization. If the ROE prohibits exploitation that could cause disruption, the team must document the finding and explain the potential impact without actual exploitation. Professional ethics require adhering to the agreed scope. Option A violates the ROE. Option C fails to report a critical finding.',
    optionExplanations: [
      { text: 'Exploit the SQL injection fully to demonstrate the maximum business impact', explanation: 'Full exploitation without authorization in the ROE violates the testing agreement and could cause legal liability. The team must work within the agreed boundaries.' },
      { text: 'Document the vulnerability as a finding without exploiting it, in accordance with ROE', explanation: 'CORRECT. The finding should be documented with evidence of the injection point, the potential impact (data exfiltration), and remediation recommendations. The organization can authorize further testing if desired.' },
      { text: 'Ignore the vulnerability since it might cause disruption', explanation: 'Ignoring a critical SQL injection vulnerability is irresponsible and violates the purpose of the engagement. The organization engaged the testers specifically to find and report vulnerabilities.' },
      { text: 'Notify law enforcement immediately', explanation: 'Law enforcement notification is premature at this stage. The finding should first be reported to the organization through the agreed reporting channels so they can assess and respond.' },
    ],
    concepts: ['Penetration Testing', 'Rules of Engagement', 'SQL Injection', 'Professional Ethics'],
    skillAreas: ['Security Assessment and Testing', 'Analytical and Critical Thinking'],
  },
  {
    id: 'eq-assess-02', domainId: 6, type: 'scenario', difficulty: 'medium',
    text: 'An organization conducts quarterly vulnerability scans. Between scheduled scans, a critical vulnerability (CVSS 9.8) affecting their public-facing web application is announced with active exploits in the wild. What should the security team do?',
    options: [
      'Wait for the next scheduled quarterly scan to assess the vulnerability',
      'Conduct an emergency out-of-cycle scan and prioritize remediation based on the results',
      'Apply all available patches without testing to minimize exposure',
      'Ignore the vulnerability since the scanner hasn\'t identified it yet',
    ],
    correctAnswer: 1,
    explanation: 'Critical vulnerabilities with active exploits require immediate response. An emergency out-of-cycle scan should be conducted to verify the application\'s exposure, followed by prioritized remediation. The team should follow their vulnerability management policy for emergency response, including testing patches before deployment to avoid operational disruption.',
    optionExplanations: [
      { text: 'Wait for the next scheduled quarterly scan to assess the vulnerability', explanation: 'Waiting months to address a vulnerability with active exploits is negligent. The window of exposure would be unacceptably long for a critical vulnerability.' },
      { text: 'Conduct an emergency out-of-cycle scan and prioritize remediation based on the results', explanation: 'CORRECT. Vulnerability management programs should include procedures for emergency response. Immediate assessment, remediation prioritization, and deployment are appropriate for critical vulnerabilities.' },
      { text: 'Apply all available patches without testing to minimize exposure', explanation: 'While urgency is appropriate, applying patches without testing may cause operational disruptions. The organization should have emergency change management procedures for this scenario.' },
      { text: 'Ignore the vulnerability since the scanner hasn\'t identified it yet', explanation: 'Waiting for a scanner to identify a known vulnerability with active exploits is reactive and dangerous. Threat intelligence should drive proactive assessment.' },
    ],
    concepts: ['Vulnerability Management', 'Emergency Response', 'CVSS', 'Threat Intelligence'],
    skillAreas: ['Security Assessment and Testing', 'Security Operations'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 8: Software Development Security
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-sdlc-01', domainId: 8, type: 'scenario', difficulty: 'hard',
    text: 'A development team is adopting a DevOps approach with frequent deployments. The security team is concerned that rapid releases will bypass security controls. Which approach BEST integrates security into the DevOps pipeline?',
    options: [
      'Require a manual security review before each production deployment',
      'Implement automated SAST/DAST scanning in the CI/CD pipeline with quality gates that block vulnerable code',
      'Deploy to production first and perform security testing after release',
      'Separate the development and security teams to maintain independence',
    ],
    correctAnswer: 1,
    explanation: 'Automated security testing integrated into the CI/CD pipeline (DevSecOps) enables rapid releases without compromising security. SAST scans source code for vulnerabilities during build, DAST tests running applications in staging, and quality gates automatically block deployments that fail security thresholds. This shifts security left while maintaining velocity.',
    optionExplanations: [
      { text: 'Require a manual security review before each production deployment', explanation: 'Manual reviews create bottlenecks that slow down DevOps pipelines. While valuable for high-risk changes, manual reviews for every deployment defeats the purpose of rapid, automated releases.' },
      { text: 'Implement automated SAST/DAST scanning in the CI/CD pipeline with quality gates that block vulnerable code', explanation: 'CORRECT. Automated scanning integrated into the pipeline provides continuous security validation without slowing development. Quality gates enforce security standards automatically.' },
      { text: 'Deploy to production first and perform security testing after release', explanation: 'Shifting security right (testing after deployment) exposes production systems to vulnerabilities. Security should be integrated before deployment, as part of the pipeline.' },
      { text: 'Separate the development and security teams to maintain independence', explanation: 'Separation creates adversarial relationships and slows both teams. DevSecOps emphasizes collaboration and shared responsibility for security.' },
    ],
    concepts: ['DevSecOps', 'SAST', 'DAST', 'CI/CD Security', 'Shift Left'],
    skillAreas: ['Software Development Security', 'Security Assessment and Testing'],
  },
  {
    id: 'eq-sdlc-02', domainId: 8, type: 'scenario', difficulty: 'hard',
    text: 'A developer is writing code that accepts user input and displays it on a public profile page. The developer wants to prevent cross-site scripting (XSS) attacks. What is the MOST effective defense?',
    options: [
      'Use prepared statements for all database queries',
      'Implement context-aware output encoding and a Content Security Policy (CSP)',
      'Store all user input encrypted in the database',
      'Use HTTPS for all page requests',
    ],
    correctAnswer: 1,
    explanation: 'XSS prevention requires output encoding (escaping user input based on the HTML context where it appears) and defense-in-depth with CSP. Output encoding ensures that user input is treated as data, not executable code. CSP provides a second layer by restricting what scripts can execute. Prepared statements (option A) prevent SQL injection, not XSS. Encryption (option C) protects data at rest but doesn\'t prevent XSS.',
    optionExplanations: [
      { text: 'Use prepared statements for all database queries', explanation: 'Prepared statements prevent SQL injection by separating SQL logic from data. They do not prevent XSS, which is a client-side injection attack.' },
      { text: 'Implement context-aware output encoding and a Content Security Policy (CSP)', explanation: 'CORRECT. Output encoding neutralizes malicious scripts by escaping special characters. CSP provides defense-in-depth by controlling which scripts can execute in the browser.' },
      { text: 'Store all user input encrypted in the database', explanation: 'Encryption protects data at rest but does not prevent the display of malicious content. The encrypted data would still be rendered as HTML/JavaScript when decrypted for display.' },
      { text: 'Use HTTPS for all page requests', explanation: 'HTTPS provides transport-layer security (encryption in transit) but does not prevent XSS. It protects against man-in-the-middle attacks, not client-side injection.' },
    ],
    concepts: ['XSS', 'Output Encoding', 'CSP', 'Secure Coding', 'Input Validation'],
    skillAreas: ['Software Development Security'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 9: Incident Response and Forensics
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-ir-01', domainId: 7, type: 'scenario', difficulty: 'hard',
    text: 'A company\'s security team discovers that an attacker has been present in the network for 8 months, accessing sensitive data and maintaining persistence through multiple backdoors. The attacker is still active. Which incident response phase is MOST critical to execute properly before beginning eradication?',
    options: [
      'Preparation — ensure the IR plan covers long-term compromises',
      'Detection and Analysis — fully understand the scope, methods, and impact of the compromise',
      'Containment — immediately isolate all affected systems',
      'Post-Incident Activity — begin documenting lessons learned',
    ],
    correctAnswer: 2,
    explanation: 'For an active, long-term compromise, containment is the most critical immediate priority. The attacker is still present, potentially exfiltrating data or causing damage. However, careful planning is needed — simply cutting systems off may alert the attacker. The team should develop a containment strategy that balances preserving evidence with stopping the active threat. Full analysis (option B) should happen in parallel but containment takes priority.',
    optionExplanations: [
      { text: 'Preparation — ensure the IR plan covers long-term compromises', explanation: 'Preparation should have occurred before the incident. While lessons from this incident will inform future preparation, it is not the most critical immediate action.' },
      { text: 'Detection and Analysis — fully understand the scope, methods, and impact of the compromise', explanation: 'Analysis is critical and should proceed in parallel, but the active threat requires containment as the priority. Analysis without containment allows ongoing damage.' },
      { text: 'Containment — immediately isolate all affected systems', explanation: 'CORRECT. For an active threat, containment is the highest priority. The team needs to stop the bleeding while preserving evidence for analysis and potential legal action.' },
      { text: 'Post-Incident Activity — begin documenting lessons learned', explanation: 'Post-incident activities occur after containment, eradication, and recovery. It is premature to focus on lessons learned while the attacker is still active.' },
    ],
    concepts: ['Incident Response', 'Containment', 'APT', 'IR Phases'],
    skillAreas: ['Incident Response and Forensics', 'Security Operations'],
  },
  {
    id: 'eq-ir-02', domainId: 7, type: 'scenario', difficulty: 'hard',
    text: 'A forensic investigator is analyzing a compromised server. The organization intends to pursue legal action against the attacker. What is the MOST important consideration when collecting evidence?',
    options: [
      'Collect as much data as possible, regardless of method',
      'Maintain a documented chain of custody and use forensically sound acquisition methods',
      'Reboot the server before collecting evidence to ensure fresh logs',
      'Copy files to the investigator\'s personal laptop for analysis',
    ],
    correctAnswer: 1,
    explanation: 'Chain of custody is critical for evidence admissibility in legal proceedings. Every person who handles evidence must be documented, and the evidence must be preserved in its original state. Forensic soundness requires using write-blockers, cryptographic hashes, and proper acquisition procedures. Failure to maintain chain of custody can result in evidence being excluded.',
    optionExplanations: [
      { text: 'Collect as much data as possible, regardless of method', explanation: 'Collecting data without proper forensic procedures may render evidence inadmissible. Quality and integrity of evidence matter more than quantity.' },
      { text: 'Maintain a documented chain of custody and use forensically sound acquisition methods', explanation: 'CORRECT. Chain of custody documents who handled evidence, when, and what was done. Forensic soundness (write-blockers, hashing, bit-for-bit copies) ensures evidence integrity. Both are essential for legal admissibility.' },
      { text: 'Reboot the server before collecting evidence to ensure fresh logs', explanation: 'Rebooting destroys volatile evidence (memory, running processes, network connections) and may trigger anti-forensic mechanisms. Evidence should be collected without altering the system state.' },
      { text: 'Copy files to the investigator\'s personal laptop for analysis', explanation: 'Using personal devices for forensic analysis violates chain of custody and introduces contamination risks. Forensic workstations and tools should be used.' },
    ],
    concepts: ['Digital Forensics', 'Chain of Custody', 'Evidence Handling', 'Forensic Soundness'],
    skillAreas: ['Incident Response and Forensics'],
  },
  {
    id: 'eq-ir-03', domainId: 7, type: 'scenario', difficulty: 'medium',
    text: 'After containing and eradicating a ransomware incident, the recovery team restores systems from backups. What is the MOST important step to take AFTER systems are restored?',
    options: [
      'Immediately return systems to production without further verification',
      'Conduct thorough testing to verify data integrity and system functionality, then perform a post-incident review',
      'Delete all backup copies to prevent reinfection',
      'Notify the media about the successful recovery',
    ],
    correctAnswer: 1,
    explanation: 'After recovery, systems must be tested to ensure they are functioning correctly and data integrity is verified. The post-incident review is then conducted to document lessons learned, identify improvements to the incident response process, and implement preventative controls. This drives continuous improvement in the organization\'s security capabilities.',
    optionExplanations: [
      { text: 'Immediately return systems to production without further verification', explanation: 'Rushing systems back without testing risks reintroducing vulnerabilities or discovering data corruption after users are impacted.' },
      { text: 'Conduct thorough testing to verify data integrity and system functionality, then perform a post-incident review', explanation: 'CORRECT. Testing verifies that recovery was successful and systems are secure. The post-incident review captures lessons learned for continuous improvement.' },
      { text: 'Delete all backup copies to prevent reinfection', explanation: 'Deleting backups eliminates the ability to recover from future incidents and contradicts the 3-2-1 backup rule. Clean, tested backups are essential.' },
      { text: 'Notify the media about the successful recovery', explanation: 'Media notifications should follow the organization\'s communication plan and legal counsel guidance. Premature disclosure may reveal recovery details that could aid future attackers.' },
    ],
    concepts: ['Recovery', 'Post-Incident Review', 'Lessons Learned', 'Incident Response'],
    skillAreas: ['Incident Response and Forensics', 'Business Continuity and Disaster Recovery'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 10: Cloud Security
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-cloud-01', domainId: 3, type: 'scenario', difficulty: 'hard',
    text: 'A company is migrating sensitive customer data to AWS. The CISO is concerned about maintaining security in the cloud. Which statement BEST describes the shared responsibility model for IaaS?',
    options: [
      'The cloud provider is responsible for ALL security, including customer data',
      'The customer is responsible for ALL security, including the physical infrastructure',
      'The provider secures the cloud infrastructure; the customer secures everything deployed within it (data, configurations, access)',
      'Security responsibilities are split 50/50 between provider and customer',
    ],
    correctAnswer: 2,
    explanation: 'In the shared responsibility model, AWS (or any cloud provider) is responsible for the security OF the cloud — the physical data centers, hardware, network infrastructure, and hypervisor. The customer is responsible for security IN the cloud — customer data, encryption, operating systems, network configurations, firewall rules, IAM, and application security. This is a critical concept that is frequently misunderstood.',
    optionExplanations: [
      { text: 'The cloud provider is responsible for ALL security, including customer data', explanation: 'This is a dangerous misconception. The provider does not assume responsibility for customer data, access management, configurations, or application security.' },
      { text: 'The customer is responsible for ALL security, including the physical infrastructure', explanation: 'The customer cannot be responsible for the provider\'s physical data center security. This responsibility rests with the cloud provider.' },
      { text: 'The provider secures the cloud infrastructure; the customer secures everything deployed within it (data, configurations, access)', explanation: 'CORRECT. This accurately describes the shared responsibility model. The provider secures infrastructure; the customer secures their use of that infrastructure.' },
      { text: 'Security responsibilities are split 50/50 between provider and customer', explanation: 'The split is not an even 50/50. It varies by service model (IaaS, PaaS, SaaS) and is based on what each party controls, not a simple percentage.' },
    ],
    concepts: ['Cloud Security', 'Shared Responsibility Model', 'AWS', 'IaaS'],
    skillAreas: ['Cloud Security', 'Security Architecture and Engineering'],
  },
  {
    id: 'eq-cloud-02', domainId: 3, type: 'scenario', difficulty: 'expert',
    text: 'A security architect is designing a multi-cloud strategy using AWS, Azure, and GCP. They need to ensure consistent security policies, visibility, and access controls across all three platforms. What is the BEST architectural approach?',
    options: [
      'Manage each cloud separately with platform-native tools',
      'Implement a Cloud Access Security Broker (CASB) and a unified cloud security posture management (CSPM) solution',
      'Use a single cloud provider for all workloads to avoid complexity',
      'Connect all three clouds with a VPN and manage policies manually',
    ],
    correctAnswer: 1,
    explanation: 'A CASB provides visibility into cloud application usage, enforces data security policies, and protects against threats across multiple cloud environments. CSPM automates security configuration management, compliance monitoring, and risk assessment across cloud platforms. Together, they provide consistent security governance across a multi-cloud environment.',
    optionExplanations: [
      { text: 'Manage each cloud separately with platform-native tools', explanation: 'Managing each cloud separately leads to inconsistent policies, operational inefficiency, and potential security gaps. Unified tools provide consistent visibility and control.' },
      { text: 'Implement a Cloud Access Security Broker (CASB) and a unified cloud security posture management (CSPM) solution', explanation: 'CORRECT. CASB provides visibility and data security across cloud services. CSPM automates configuration compliance and risk assessment. Together they enable consistent multi-cloud security.' },
      { text: 'Use a single cloud provider for all workloads to avoid complexity', explanation: 'Single-cloud strategies are simpler but may not meet all business requirements. Multi-cloud is often necessary for regulatory, resilience, or capability reasons.' },
      { text: 'Connect all three clouds with a VPN and manage policies manually', explanation: 'VPN connectivity addresses network-level integration but does not provide unified security management, policy enforcement, or compliance monitoring across cloud environments.' },
    ],
    concepts: ['Multi-Cloud', 'CASB', 'CSPM', 'Cloud Governance', 'Security Architecture'],
    skillAreas: ['Cloud Security', 'Security Architecture and Engineering'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 11: Zero Trust Architecture
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-zt-01', domainId: 3, type: 'scenario', difficulty: 'expert',
    text: 'A traditional perimeter-based security model has failed an organization, which suffered a breach when an attacker moved laterally from a compromised internal workstation to access a sensitive database. The CISO wants to implement Zero Trust architecture. Which capability is MOST foundational to Zero Trust?',
    options: [
      'Installing more firewalls at the network perimeter',
      'Implementing micro-segmentation and least-privilege access with continuous verification',
      'Deploying a VPN for all remote users',
      'Requiring complex passwords for all accounts',
    ],
    correctAnswer: 1,
    explanation: 'Zero Trust is based on "never trust, always verify." Micro-segmentation divides the network into small, isolated zones so that compromising one zone does not grant access to others. Least-privilege access ensures users and systems only have the minimum permissions needed. Continuous verification means every access request is authenticated and authorized, regardless of location. The lateral movement described in the scenario would be prevented because the compromised workstation would not automatically have access to the database.',
    optionExplanations: [
      { text: 'Installing more firewalls at the network perimeter', explanation: 'Perimeter firewalls are a traditional castle-and-moat approach that Zero Trust explicitly moves away from. The breach demonstrated that perimeter defenses are insufficient.' },
      { text: 'Implementing micro-segmentation and least-privilege access with continuous verification', explanation: 'CORRECT. Micro-segmentation prevents lateral movement by isolating workloads. Least-privilege ensures minimal access. Continuous verification authenticates every request regardless of source.' },
      { text: 'Deploying a VPN for all remote users', explanation: 'VPNs extend the perimeter to remote users but do not address lateral movement within the network. Modern Zero Trust replaces VPNs with ZTNA.' },
      { text: 'Requiring complex passwords for all accounts', explanation: 'Password complexity is a basic security practice but is not the foundation of Zero Trust. MFA, least-privilege, and micro-segmentation are more fundamental to the Zero Trust model.' },
    ],
    concepts: ['Zero Trust', 'Micro-segmentation', 'Least Privilege', 'Continuous Verification', 'ZTNA'],
    skillAreas: ['Zero Trust Architecture', 'Security Architecture and Engineering'],
  },
  {
    id: 'eq-zt-02', domainId: 4, type: 'scenario', difficulty: 'hard',
    text: 'An organization is implementing Zero Trust Network Access (ZTNA) to replace their legacy VPN. What is the PRIMARY security advantage of ZTNA over traditional VPN?',
    options: [
      'ZTNA provides faster network speeds than VPN',
      'ZTNA grants application-level access rather than network-level access, reducing lateral movement risk',
      'ZTNA is easier to deploy than VPN',
      'ZTNA eliminates the need for encryption',
    ],
    correctAnswer: 1,
    explanation: 'Traditional VPNs place users on the corporate network, giving them network-level access that can enable lateral movement. ZTNA provides implicit application access — users connect directly to specific applications, not the network. The application is invisible to unauthorized users, and there is no network-level connectivity that could be exploited for lateral movement. This is a fundamental architectural difference.',
    optionExplanations: [
      { text: 'ZTNA provides faster network speeds than VPN', explanation: 'Performance is not the primary security advantage. ZTNA may be faster in some cases due to direct connections, but this is a side benefit, not the core security value.' },
      { text: 'ZTNA grants application-level access rather than network-level access, reducing lateral movement risk', explanation: 'CORRECT. ZTNA\'s application-centric model means users connect only to authorized applications, not the entire network. This eliminates the lateral movement attack vector that VPNs enable.' },
      { text: 'ZTNA is easier to deploy than VPN', explanation: 'Deployment complexity varies by implementation. The primary advantage is security, not ease of deployment.' },
      { text: 'ZTNA eliminates the need for encryption', explanation: 'ZTNA still requires encryption (typically TLS) for data in transit. It does not eliminate the need for encryption.' },
    ],
    concepts: ['ZTNA', 'VPN', 'Lateral Movement', 'Application Access', 'Zero Trust'],
    skillAreas: ['Zero Trust Architecture', 'Network Security'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 12: Threat Modeling
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-tm-01', domainId: 8, type: 'scenario', difficulty: 'expert',
    text: 'A development team is designing a new payment processing system. The security architect wants to identify potential security threats early in the SDLC. Which threat modeling methodology is BEST suited for this scenario?',
    options: [
      'Running a vulnerability scanner on similar applications',
      'Using the STRIDE methodology to systematically evaluate threats per system component',
      'Waiting for penetration test results after development',
      'Reviewing OWASP Top 10 vulnerabilities',
    ],
    correctAnswer: 1,
    explanation: 'STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) is a structured threat modeling methodology that can be applied during design. It helps identify threats by considering each security concern against each system component (data flows, data stores, processes, interactors). This proactive approach identifies design flaws before code is written, when they are cheapest to fix.',
    optionExplanations: [
      { text: 'Running a vulnerability scanner on similar applications', explanation: 'Vulnerability scanners identify known vulnerabilities in running applications. They cannot identify design-level threats or be applied in the design phase.' },
      { text: 'Using the STRIDE methodology to systematically evaluate threats per system component', explanation: 'CORRECT. STRIDE provides a systematic approach to identify threats during the design phase. Each letter represents a threat category that is evaluated against each system component.' },
      { text: 'Waiting for penetration test results after development', explanation: 'Penetration testing occurs late in the SDLC when vulnerabilities are most expensive to fix. Threat modeling should be performed during the design phase (shift left).' },
      { text: 'Reviewing OWASP Top 10 vulnerabilities', explanation: 'OWASP Top 10 is a valuable awareness document but is not a systematic threat modeling methodology. It lists common web vulnerabilities but does not provide a structured threat analysis process.' },
    ],
    concepts: ['Threat Modeling', 'STRIDE', 'SDLC', 'Shift Left'],
    skillAreas: ['Threat Modeling', 'Software Development Security'],
  },
  {
    id: 'eq-tm-02', domainId: 8, type: 'scenario', difficulty: 'expert',
    text: 'During a threat modeling exercise for an e-commerce application, the team identifies a threat where an attacker could modify the price field in an API request to purchase items at a lower cost. What STRIDE category does this threat belong to, and what is the BEST mitigation?',
    options: [
      'Information Disclosure — encrypt the API traffic with TLS',
      'Tampering — implement server-side validation and integrity checks on all API requests',
      'Spoofing — implement strong authentication',
      'Denial of Service — implement rate limiting',
    ],
    correctAnswer: 1,
    explanation: 'Modification of data is a Tampering threat. The best mitigation is server-side validation — the server should never trust client-supplied data like prices. All critical values should be validated against server-side data (e.g., look up the actual price from the database). Input integrity checks (HMAC, digital signatures) can also prevent tampering with request parameters.',
    optionExplanations: [
      { text: 'Information Disclosure — encrypt the API traffic with TLS', explanation: 'Information Disclosure involves unauthorized access to data, not modification. TLS prevents eavesdropping but does not prevent the client from sending modified data.' },
      { text: 'Tampering — implement server-side validation and integrity checks on all API requests', explanation: 'CORRECT. Modifying API parameters is a Tampering threat. Server-side validation ensures the server uses authoritative data sources for prices rather than trusting client input.' },
      { text: 'Spoofing — implement strong authentication', explanation: 'Spoofing involves impersonating another user or system. While authentication is important, this specific threat (price modification) is a Tampering issue, not Spoofing.' },
      { text: 'Denial of Service — implement rate limiting', explanation: 'Denial of Service threats involve making resources unavailable. Price manipulation is not a DoS threat.' },
    ],
    concepts: ['STRIDE', 'Tampering', 'Input Validation', 'Threat Modeling', 'API Security'],
    skillAreas: ['Threat Modeling', 'Software Development Security', 'Analytical and Critical Thinking'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 13: Business Continuity and Disaster Recovery
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-bcdr-01', domainId: 7, type: 'scenario', difficulty: 'hard',
    text: 'A company\'s critical financial system has an RTO of 2 hours and an RPO of 15 minutes. The system processes $1 million per hour in transactions. What disaster recovery architecture is MOST appropriate?',
    options: [
      'Cold site with weekly backups — acceptable for non-critical systems',
      'Hot site with synchronous data replication — can achieve the 2-hour RTO and 15-minute RPO',
      'Warm site with daily backups — meets the RTO but not the RPO',
      'No DR site — rely on cloud auto-scaling',
    ],
    correctAnswer: 1,
    explanation: 'A hot site with synchronous replication is the only architecture that can meet both the 2-hour RTO and 15-minute RPO. Hot sites are fully equipped and ready for immediate operation. Synchronous replication ensures data is mirrored in near-real-time, keeping data loss to seconds/minutes well within the 15-minute RPO. The financial impact of downtime ($1M/hour) justifies the cost of a hot site.',
    optionExplanations: [
      { text: 'Cold site with weekly backups — acceptable for non-critical systems', explanation: 'Cold sites require days or weeks to become operational. Weekly backups mean up to 7 days of data loss — far exceeding the 15-minute RPO.' },
      { text: 'Hot site with synchronous data replication — can achieve the 2-hour RTO and 15-minute RPO', explanation: 'CORRECT. Hot sites are immediately operational for the 2-hour RTO. Synchronous replication provides near-real-time data mirroring for the 15-minute RPO.' },
      { text: 'Warm site with daily backups — meets the RTO but not the RPO', explanation: 'Warm sites may meet the RTO but daily backups mean up to 24 hours of data loss, exceeding the 15-minute RPO. Warm sites also require configuration and data restoration.' },
      { text: 'No DR site — rely on cloud auto-scaling', explanation: 'Cloud auto-scaling handles load increases but does not address disaster scenarios where the primary site or cloud region becomes unavailable. A formal DR strategy is needed.' },
    ],
    concepts: ['RTO', 'RPO', 'Hot Site', 'Synchronous Replication', 'Disaster Recovery'],
    skillAreas: ['Business Continuity and Disaster Recovery', 'Risk Management'],
  },
  {
    id: 'eq-bcdr-02', domainId: 1, type: 'scenario', difficulty: 'medium',
    text: 'A business continuity manager is conducting a Business Impact Analysis (BIA) for a manufacturing company. What is the PRIMARY purpose of the BIA?',
    options: [
      'To identify which employees should be laid off during a disruption',
      'To identify critical business functions, their dependencies, and the impact of disruption over time',
      'To purchase insurance for all identified risks',
      'To design the network architecture for the backup site',
    ],
    correctAnswer: 1,
    explanation: 'A BIA identifies critical business functions, the resources they depend on (people, technology, facilities), and the financial and operational impacts of disruption over time. It determines Maximum Tolerable Downtime (MTD), which informs RTO and RPO objectives. The BIA is the foundation for developing both BCP and DRP strategies.',
    optionExplanations: [
      { text: 'To identify which employees should be laid off during a disruption', explanation: 'Personnel decisions are not the purpose of a BIA. The BIA identifies critical functions, dependencies, and recovery requirements.' },
      { text: 'To identify critical business functions, their dependencies, and the impact of disruption over time', explanation: 'CORRECT. The BIA identifies what is critical, what it depends on, and how long the organization can survive without each function. This drives recovery prioritization.' },
      { text: 'To purchase insurance for all identified risks', explanation: 'Insurance purchasing is part of risk transfer, which follows risk assessment. The BIA identifies potential impacts but does not directly drive insurance decisions.' },
      { text: 'To design the network architecture for the backup site', explanation: 'Network architecture is a technical implementation decision that occurs after the BIA defines recovery requirements.' },
    ],
    concepts: ['BIA', 'Business Impact Analysis', 'MTD', 'Recovery Requirements'],
    skillAreas: ['Business Continuity and Disaster Recovery'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 14: Security Leadership and Communication
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-lead-01', domainId: 1, type: 'scenario', difficulty: 'hard',
    text: 'A CISO needs to secure budget approval for a new security initiative. The board is focused on revenue growth and cost reduction. Which approach is MOST likely to secure board approval?',
    options: [
      'Present detailed technical specifications of the proposed security tools',
      'Frame the investment in business terms: risk reduction, regulatory compliance, competitive advantage, and ROI',
      'Threaten to resign if the budget is not approved',
      'Implement the solution using existing operational budget without board approval',
    ],
    correctAnswer: 1,
    explanation: 'Board members are business leaders who make decisions based on business value, not technical details. The CISO should present the security investment in terms the board understands: risk reduction measured in potential loss avoidance, compliance requirements, customer trust and competitive advantage, and ROI analysis. This business-aligned communication is a critical leadership skill for security executives.',
    optionExplanations: [
      { text: 'Present detailed technical specifications of the proposed security tools', explanation: 'Board members typically lack the technical background to evaluate tool specifications. Technical details obscure the business case and reduce the likelihood of approval.' },
      { text: 'Frame the investment in business terms: risk reduction, regulatory compliance, competitive advantage, and ROI', explanation: 'CORRECT. Business-aligned communication connects security investments to board priorities. Risk reduction, compliance, competitive advantage, and ROI are board-relevant metrics.' },
      { text: 'Threaten to resign if the budget is not approved', explanation: 'Threatening resignation is unprofessional and damages the CISO\'s credibility and working relationships. It may also result in the resignation being accepted.' },
      { text: 'Implement the solution using existing operational budget without board approval', explanation: 'Circumventing the board undermines governance and could have professional consequences. Transparency and proper governance are essential for effective security leadership.' },
    ],
    concepts: ['Executive Communication', 'Budget Justification', 'Board Reporting', 'Security Leadership'],
    skillAreas: ['Security Leadership and Communication', 'Information Security Governance'],
  },
  {
    id: 'eq-lead-02', domainId: 1, type: 'scenario', difficulty: 'medium',
    text: 'A security manager is leading a cross-functional team to implement a new security policy. The development team is resistant, citing that the policy will slow down releases. What is the BEST leadership approach?',
    options: [
      'Mandate compliance through executive authority without discussion',
      'Engage the development team to understand their concerns and collaboratively find solutions that achieve security objectives without unduly impacting velocity',
      'Exempt the development team from the policy requirements',
      'Escalate the issue to HR for disciplinary action',
    ],
    correctAnswer: 1,
    explanation: 'Effective security leadership involves collaboration, not confrontation. By engaging developers, the security manager can understand their specific concerns about velocity, identify practical solutions (such as automated security controls that don\'t slow releases), and build buy-in. Security champions within development teams can help bridge the gap between security requirements and development velocity.',
    optionExplanations: [
      { text: 'Mandate compliance through executive authority without discussion', explanation: 'Mandating compliance without collaboration breeds resentment and resistance. Developers may find ways to bypass security controls if they feel they are imposed without consideration of their needs.' },
      { text: 'Engage the development team to understand their concerns and collaboratively find solutions that achieve security objectives without unduly impacting velocity', explanation: 'CORRECT. Collaborative leadership builds relationships, creates buy-in, and often leads to better solutions that balance security and business needs.' },
      { text: 'Exempt the development team from the policy requirements', explanation: 'Exempting a team creates a dangerous precedent and security gap. Different approaches may be warranted, but complete exemption is rarely appropriate.' },
      { text: 'Escalate the issue to HR for disciplinary action', explanation: 'HR escalation is premature and escalates conflict unnecessarily. Collaboration and problem-solving should be attempted first.' },
    ],
    concepts: ['Security Leadership', 'Cross-Functional Collaboration', 'Change Management', 'DevSecOps'],
    skillAreas: ['Security Leadership and Communication', 'Software Development Security'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 15: Analytical and Critical Thinking
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-analytical-01', domainId: 0, type: 'scenario', difficulty: 'expert',
    text: 'A security analyst receives three simultaneous alerts: (1) a critical vulnerability announcement for the web server, (2) a user reporting a phishing email, and (3) an IDS alert showing possible data exfiltration from a database server. The team can only respond to one incident at a time. What is the BEST triage decision?',
    options: [
      'Address the critical vulnerability first since it affects the most systems',
      'Prioritize the data exfiltration alert as it indicates a potentially active breach with ongoing data loss',
      'Investigate the phishing email first since users are involved',
      'Escalate all three to management without taking action',
    ],
    correctAnswer: 1,
    explanation: 'Active data exfiltration represents the highest immediate risk — data is being stolen right now. While the critical vulnerability (option A) is important, it has been present since the last scan; it can be addressed after containing the active breach. The phishing email (option C) is likely a lower-priority user-reported event. This triage decision requires critical thinking about urgency, impact, and available resources.',
    optionExplanations: [
      { text: 'Address the critical vulnerability first since it affects the most systems', explanation: 'While critical, the vulnerability was likely present for some time (since the last scan). An active breach with ongoing data loss represents a higher immediate priority.' },
      { text: 'Prioritize the data exfiltration alert as it indicates a potentially active breach with ongoing data loss', explanation: 'CORRECT. Active data loss is the highest priority. The analyst correctly applies risk-based triage — stopping active data loss prevents immediate damage.' },
      { text: 'Investigate the phishing email first since users are involved', explanation: 'Phishing is important but typically lower priority than an active breach. User-reported phishing may have been in the user\'s inbox for hours.' },
      { text: 'Escalate all three to management without taking action', explanation: 'Escalation without triage abrogates the analyst\'s responsibility. Triage decisions are a core SOC skill.' },
    ],
    concepts: ['Triage', 'Risk Prioritization', 'Incident Response', 'Critical Thinking', 'Decision Making'],
    skillAreas: ['Analytical and Critical Thinking', 'Incident Response and Forensics', 'Security Operations'],
  },
  {
    id: 'eq-analytical-02', domainId: 0, type: 'scenario', difficulty: 'expert',
    text: 'A security architect is evaluating two security solutions for the same problem. Solution A costs $500,000 upfront with $50,000 annual maintenance and prevents 95% of attacks. Solution B costs $200,000 upfront with $75,000 annual maintenance and prevents 85% of attacks. The expected annual loss from attacks without either solution is $1,000,000. Over 5 years, which solution provides better ROI, and what other factors should be considered?',
    options: [
      'Solution A is clearly better because it provides higher prevention',
      'Solution B is cheaper upfront; choose based on budget availability alone',
      'Calculate 5-year TCO: A = $750,000 vs B = $575,000. Compare residual risk: A = $50,000/yr vs B = $150,000/yr. A has better total cost-benefit over 5 years',
      'Neither solution is worth implementing since both have ongoing costs',
    ],
    correctAnswer: 2,
    explanation: '5-year TCO: A = $500K + (5 × $50K) = $750K. B = $200K + (5 × $75K) = $575K. Residual risk: A = $1M × 5% = $50K/yr. B = $1M × 15% = $150K/yr. After 5 years: A total = $750K + (5 × $50K) = $1,000K. B total = $575K + (5 × $150K) = $1,325K. Solution A saves $325K more over 5 years. Other factors: Solution A\'s upfront cost is higher, which affects cash flow. Vendor lock-in, operational complexity, and non-quantified benefits (e.g., reputation, compliance) should also be considered.',
    optionExplanations: [
      { text: 'Solution A is clearly better because it provides higher prevention', explanation: 'This answer ignores cost. Higher prevention may not be cost-justified if the additional prevention costs more than the expected loss reduction.' },
      { text: 'Solution B is cheaper upfront; choose based on budget availability alone', explanation: 'Upfront cost is only one factor. Total cost of ownership and residual risk costs should be considered for a complete ROI analysis.' },
      { text: 'Calculate 5-year TCO: A = $750,000 vs B = $575,000. Compare residual risk: A = $50,000/yr vs B = $150,000/yr. A has better total cost-benefit over 5 years', explanation: 'CORRECT. This answer demonstrates comprehensive cost-benefit analysis including TCO, residual risk value, and recognizes additional qualitative factors.' },
      { text: 'Neither solution is worth implementing since both have ongoing costs', explanation: 'The expected annual loss of $1M far exceeds the cost of either solution over 5 years. Both solutions provide significant risk reduction value.' },
    ],
    concepts: ['ROI', 'Cost-Benefit Analysis', 'TCO', 'Residual Risk', 'Decision Making'],
    skillAreas: ['Analytical and Critical Thinking', 'Risk Management'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 16: Data Protection and Privacy
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-data-01', domainId: 2, type: 'scenario', difficulty: 'hard',
    text: 'A healthcare organization stores patient records in a database. A developer needs to use realistic patient data for application testing but must comply with HIPAA privacy requirements. What is the BEST approach to protect patient privacy while enabling effective testing?',
    options: [
      'Use real patient data since it is for internal testing only',
      'Implement data masking to replace sensitive PHI with realistic but fictional data',
      'Require all developers to sign NDAs before accessing real data',
      'Use production data but delete it after testing',
    ],
    correctAnswer: 1,
    explanation: 'Data masking (also called de-identification) replaces sensitive PHI elements (names, SSNs, medical record numbers) with realistic but fictional substitutes. The masked data maintains referential integrity and realism for testing without exposing actual patient information. This allows effective testing while protecting patient privacy and maintaining HIPAA compliance.',
    optionExplanations: [
      { text: 'Use real patient data since it is for internal testing only', explanation: 'Using real PHI in non-production environments increases exposure risk and may violate HIPAA. Testing environments often have weaker controls than production.' },
      { text: 'Implement data masking to replace sensitive PHI with realistic but fictional data', explanation: 'CORRECT. Data masking preserves data utility for testing while removing sensitive elements. This enables realistic testing without exposing PHI.' },
      { text: 'Require all developers to sign NDAs before accessing real data', explanation: 'NDAs do not change the classification of PHI or reduce the risk of exposure. They are a legal instrument, not a data protection control.' },
      { text: 'Use production data but delete it after testing', explanation: 'Deleting after use does not prevent exposure during testing and may not be complete. Data masking is a more reliable protection method.' },
    ],
    concepts: ['Data Masking', 'PHI', 'HIPAA', 'Data Protection', 'Test Data Management'],
    skillAreas: ['Data Protection and Privacy', 'Compliance and Legal'],
  },
  {
    id: 'eq-data-02', domainId: 2, type: 'scenario', difficulty: 'hard',
    text: 'An e-commerce company collects customer data for order processing. They now want to use this data for a new AI-driven personalized marketing system. Under GDPR, what must the company do FIRST?',
    options: [
      'Proceed with using the data since it was collected from customers',
      'Obtain explicit consent from customers for the new processing purpose',
      'Anonymize the data before using it for marketing',
      'Notify the data protection authority and wait for approval',
    ],
    correctAnswer: 1,
    explanation: 'Under GDPR\'s purpose limitation principle, personal data must be collected for specified, explicit, and legitimate purposes and not further processed in a manner incompatible with those purposes. Using data for a new purpose (AI marketing) that was not originally disclosed requires obtaining fresh explicit consent from data subjects. Transparency and consent are fundamental GDPR requirements.',
    optionExplanations: [
      { text: 'Proceed with using the data since it was collected from customers', explanation: 'GDPR prohibits using data for purposes incompatible with the original collection purpose without obtaining new consent. This violates the purpose limitation principle.' },
      { text: 'Obtain explicit consent from customers for the new processing purpose', explanation: 'CORRECT. GDPR requires explicit consent for new processing purposes. The organization must inform customers about the new use and obtain their freely given, specific consent.' },
      { text: 'Anonymize the data before using it for marketing', explanation: 'Anonymization (irreversibly removing PII) would make GDPR less restrictive, but fully effective anonymization is difficult to achieve and may reduce marketing effectiveness.' },
      { text: 'Notify the data protection authority and wait for approval', explanation: 'Notification may be required for high-risk processing, but obtaining customer consent is the primary requirement. DPA approval does not replace consent.' },
    ],
    concepts: ['GDPR', 'Consent', 'Purpose Limitation', 'Data Protection', 'Privacy'],
    skillAreas: ['Data Protection and Privacy', 'Compliance and Legal'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILL AREA 17: Compliance and Legal
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-legal-01', domainId: 1, type: 'scenario', difficulty: 'hard',
    text: 'A US-based company processes credit card payments for customers globally. They recently experienced a breach that may have exposed cardholder data. Which compliance requirements are MOST likely applicable?',
    options: [
      'Only PCI DSS since it involves credit card data',
      'PCI DSS, and potentially GDPR if EU cardholder data was involved, plus state breach notification laws',
      'Only SOX since it is a US company',
      'Only HIPAA since medical information may be implied',
    ],
    correctAnswer: 1,
    explanation: 'PCI DSS applies to any organization that processes, stores, or transmits credit card data. GDPR may apply if the breach involves personal data of EU residents (GDPR has extraterritorial jurisdiction). US state breach notification laws (all 50 states have them) require notification to affected individuals and state authorities. Multiple regulations can apply simultaneously.',
    optionExplanations: [
      { text: 'Only PCI DSS since it involves credit card data', explanation: 'PCI DSS is applicable, but it is rarely the only requirement. GDPR has broad extraterritorial reach, and state breach notification laws universally apply.' },
      { text: 'PCI DSS, and potentially GDPR if EU cardholder data was involved, plus state breach notification laws', explanation: 'CORRECT. PCI DSS governs cardholder data security. GDPR applies to personal data of EU individuals regardless of where the company is based. State breach notification laws require timely notification.' },
      { text: 'Only SOX since it is a US company', explanation: 'SOX applies to financial reporting controls for publicly traded companies. It does not specifically address credit card data security.' },
      { text: 'Only HIPAA since medical information may be implied', explanation: 'HIPAA applies to healthcare providers and health plans, not to general e-commerce. There is no indication medical information is involved.' },
    ],
    concepts: ['PCI DSS', 'GDPR', 'Breach Notification', 'Multi-Jurisdictional Compliance'],
    skillAreas: ['Compliance and Legal', 'Data Protection and Privacy'],
  },
  {
    id: 'eq-legal-02', domainId: 1, type: 'scenario', difficulty: 'medium',
    text: 'A security manager is negotiating a contract with a cloud service provider. Which contractual element is MOST important for ensuring the provider maintains adequate security?',
    options: [
      'The contract price and payment terms',
      'Service Level Agreement (SLA) with specific security requirements, right to audit, and breach notification obligations',
      'The provider\'s marketing materials describing their security',
      'The contract termination date',
    ],
    correctAnswer: 1,
    explanation: 'The SLA is the most critical contractual element for security. It should specify security requirements (encryption, access controls, incident response), performance metrics, right to audit (or SOC 2 reports), breach notification timelines, data handling requirements, and liability for security failures. The SLA makes security requirements legally enforceable and provides recourse if the provider fails to meet them.',
    optionExplanations: [
      { text: 'The contract price and payment terms', explanation: 'Price is important for business but does not establish security requirements or provide recourse for security failures.' },
      { text: 'Service Level Agreement (SLA) with specific security requirements, right to audit, and breach notification obligations', explanation: 'CORRECT. The SLA contractually binds the provider to specific security requirements. Right to audit enables verification, and breach notification obligations ensure timely communication.' },
      { text: 'The provider\'s marketing materials describing their security', explanation: 'Marketing materials are not legally binding. Security claims must be included in the enforceable contract, not just promotional materials.' },
      { text: 'The contract termination date', explanation: 'Termination terms are important but do not establish security requirements. Security provisions should be effective for the contract duration.' },
    ],
    concepts: ['SLA', 'Third-Party Risk', 'Vendor Management', 'Contract Security', 'Cloud Governance'],
    skillAreas: ['Compliance and Legal', 'Cloud Security', 'Risk Management'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL SCENARIO-BASED QUESTIONS (Cross-skill)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eq-cross-01', domainId: 3, type: 'scenario', difficulty: 'expert',
    text: 'A security architect is designing a secure communication system for a military application. The system must ensure that messages remain confidential, the sender\'s identity is verified, and the message has not been tampered with. The system operates in a high-latency environment where symmetric key exchange is not possible. Which cryptographic approach BEST meets all requirements?',
    options: [
      'Use symmetric encryption with a pre-shared key',
      'Use asymmetric encryption for key exchange and digital signatures for authentication and integrity',
      'Use hash functions only for integrity checking',
      'Use steganography to hide messages in other data',
    ],
    correctAnswer: 1,
    explanation: 'Asymmetric cryptography (public key infrastructure) solves all three requirements without needing a pre-shared key. Public key encryption provides confidentiality. Digital signatures (sign with private key, verify with public key) provide authentication (proves sender identity) and integrity (signature verification detects tampering). Non-repudiation is also provided. This is ideal for environments where secure key exchange is impractical.',
    optionExplanations: [
      { text: 'Use symmetric encryption with a pre-shared key', explanation: 'Symmetric encryption provides confidentiality but does not provide non-repudiation (both parties share the same key). Key distribution in a high-latency environment is also problematic.' },
      { text: 'Use asymmetric encryption for key exchange and digital signatures for authentication and integrity', explanation: 'CORRECT. Asymmetric encryption enables secure key exchange without pre-shared secrets. Digital signatures provide authentication, integrity, and non-repudiation.' },
      { text: 'Use hash functions only for integrity checking', explanation: 'Hash functions verify integrity but do not provide confidentiality or authentication. They are insufficient alone.' },
      { text: 'Use steganography to hide messages in other data', explanation: 'Steganography hides the existence of communication but does not provide encryption, authentication, or integrity. It is not a complete cryptographic solution.' },
    ],
    concepts: ['Asymmetric Cryptography', 'Digital Signatures', 'PKI', 'Key Exchange', 'Non-repudiation'],
    skillAreas: ['Security Architecture and Engineering', 'Analytical and Critical Thinking'],
  },
  {
    id: 'eq-cross-02', domainId: 4, type: 'scenario', difficulty: 'expert',
    text: 'A company\'s security team detects that an attacker has compromised a user workstation and is attempting to move laterally to access a finance database. The network currently has flat VLANs with no segmentation between workstations and databases. What is the MOST effective immediate containment action?',
    options: [
      'Change the compromised user\'s password',
      'Disable the switch port the workstation is connected to and implement network segmentation to isolate workstations from databases',
      'Run antivirus on the compromised workstation',
      'Block all outbound internet traffic',
    ],
    correctAnswer: 1,
    explanation: 'Disabling the switch port immediately stops lateral movement from the compromised system. Implementing network segmentation at the switch level (creating separate VLANs for workstations and databases, with ACLs blocking workstation-to-database direct traffic) addresses the architectural weakness that enabled lateral movement. Password changes (option A) don\'t help if the attacker has system-level access. Antivirus (option C) is slow and may not detect the threat.',
    optionExplanations: [
      { text: 'Change the compromised user\'s password', explanation: 'If the attacker has system-level persistence (not just credential-based access), password changes will not prevent continued access or lateral movement.' },
      { text: 'Disable the switch port the workstation is connected to and implement network segmentation to isolate workstations from databases', explanation: 'CORRECT. Disabling the port immediately stops the active lateral movement. Network segmentation addresses the root cause — the flat network that allowed direct workstation-to-database access.' },
      { text: 'Run antivirus on the compromised workstation', explanation: 'Antivirus scanning is slow and may not detect sophisticated threats or custom malware. The immediate priority is containment, not remediation.' },
      { text: 'Block all outbound internet traffic', explanation: 'Blocking internet traffic may prevent C2 communication but does not stop lateral movement to the database. Targeted containment is more effective.' },
    ],
    concepts: ['Network Segmentation', 'Lateral Movement', 'Containment', 'VLAN', 'Defense-in-Depth'],
    skillAreas: ['Network Security', 'Incident Response and Forensics', 'Zero Trust Architecture'],
  },
  {
    id: 'eq-cross-03', domainId: 6, type: 'scenario', difficulty: 'expert',
    text: 'During a security assessment, an auditor discovers that developers have direct production database access and can modify data without oversight. The organization needs to address this while maintaining development velocity. Which combination of controls BEST addresses this finding?',
    options: [
      'Remove all developer access to production',
      'Implement a privileged access management (PAM) solution with just-in-time access, session recording, and approval workflows for production database changes',
      'Require developers to submit all changes through the help desk',
      'Implement database auditing and review logs monthly',
    ],
    correctAnswer: 1,
    explanation: 'A PAM solution provides the right balance: developers can request temporary, just-in-time access when needed for legitimate purposes (maintaining velocity). Session recording captures all activities for security review. Approval workflows ensure changes are authorized. This addresses the separation of duties concern while enabling developers to perform necessary production support. Monthly log review (option D) is detective but does not prevent unauthorized access.',
    optionExplanations: [
      { text: 'Remove all developer access to production', explanation: 'Complete removal may block legitimate operational needs like emergency fixes or troubleshooting. A balanced approach with controlled access is better than complete restriction.' },
      { text: 'Implement a privileged access management (PAM) solution with just-in-time access, session recording, and approval workflows for production database changes', explanation: 'CORRECT. PAM provides controlled, audited, and temporary access. Just-in-time access enables velocity, session recording provides accountability, and approvals enforce separation of duties.' },
      { text: 'Require developers to submit all changes through the help desk', explanation: 'The help desk is not designed to manage or authorize database changes for developers. This approach creates bottlenecks without providing meaningful security controls.' },
      { text: 'Implement database auditing and review logs monthly', explanation: 'Auditing and log review are detective controls only. They detect violations after they occur but do not prevent unauthorized access or enforce separation of duties.' },
    ],
    concepts: ['PAM', 'Separation of Duties', 'Database Security', 'Access Control', 'Privileged Access'],
    skillAreas: ['Identity and Access Management (IAM)', 'Security Assessment and Testing', 'Security Operations'],
  },
  {
    id: 'eq-cross-04', domainId: 7, type: 'scenario', difficulty: 'hard',
    text: 'A SOC team is building a new security monitoring program. They need to detect attacks that are not signature-based and may involve novel techniques. What detection strategy should be PRIORITIZED to address this requirement?',
    options: [
      'Deploy traditional signature-based IDS/IPS',
      'Implement UEBA (User and Entity Behavior Analytics) with machine learning-based anomaly detection integrated with the SIEM',
      'Rely on manual log review by senior analysts',
      'Deploy additional firewalls to block unknown threats',
    ],
    correctAnswer: 1,
    explanation: 'UEBA establishes baselines of normal user and system behavior and uses machine learning to detect anomalous activities that may indicate novel attacks. Unlike signature-based detection (option A), UEBA can detect zero-day exploits, insider threats, and novel attack patterns by identifying deviations from established baselines. Integration with SIEM provides correlation and alerting.',
    optionExplanations: [
      { text: 'Deploy traditional signature-based IDS/IPS', explanation: 'Signature-based detection is effective against known threats but cannot detect novel attacks that have no known signature. This is insufficient for the stated requirement.' },
      { text: 'Implement UEBA (User and Entity Behavior Analytics) with machine learning-based anomaly detection integrated with the SIEM', explanation: 'CORRECT. UEBA detects behavioral anomalies that may indicate novel attacks. Machine learning models adapt to the environment and detect deviations from normal patterns.' },
      { text: 'Rely on manual log review by senior analysts', explanation: 'Manual log review does not scale and is ineffective for real-time detection. Analysts cannot review all logs across the enterprise in real-time.' },
      { text: 'Deploy additional firewalls to block unknown threats', explanation: 'Firewalls are preventive controls that filter based on known rules. They cannot detect unknown or novel threats that do not match existing rules.' },
    ],
    concepts: ['UEBA', 'SIEM', 'Anomaly Detection', 'Machine Learning', 'Threat Detection'],
    skillAreas: ['Security Operations', 'Security Assessment and Testing', 'Analytical and Critical Thinking'],
  },
  {
    id: 'eq-cross-05', domainId: 1, type: 'scenario', difficulty: 'expert',
    text: 'A CISO is developing a multi-year security strategy. The organization faces increasing regulatory requirements, a growing remote workforce, and a shift to cloud services. Which strategic framework is BEST suited to guide this transformation?',
    options: [
      'Purchase and deploy specific security products for each identified risk',
      'Use the NIST Cybersecurity Framework (CSF) to assess current state, define target state, and develop a prioritized improvement roadmap',
      'Adopt ISO 27001 certification as the sole strategic objective',
      'Create a compliance checklist based on current regulations',
    ],
    correctAnswer: 1,
    explanation: 'The NIST CSF provides a comprehensive, risk-based framework for improving cybersecurity across five functions: Identify, Protect, Detect, Respond, Recover. It is designed for exactly this scenario — guiding strategic security transformation. It helps organizations assess their current maturity, define a target state, prioritize investments, and communicate security posture to stakeholders. It can incorporate regulatory requirements, cloud security, and remote workforce considerations.',
    optionExplanations: [
      { text: 'Purchase and deploy specific security products for each identified risk', explanation: 'A product-centric approach addresses individual risks but does not provide strategic coherence. Products should be selected within a strategic framework, not drive the strategy.' },
      { text: 'Use the NIST Cybersecurity Framework (CSF) to assess current state, define target state, and develop a prioritized improvement roadmap', explanation: 'CORRECT. NIST CSF provides a strategic, risk-based framework that addresses the full security lifecycle. It enables systematic improvement and aligns security with business objectives.' },
      { text: 'Adopt ISO 27001 certification as the sole strategic objective', explanation: 'ISO 27001 certification is a valuable objective but focuses on an ISMS. It may not fully address all strategic needs like cloud transformation and remote workforce.' },
      { text: 'Create a compliance checklist based on current regulations', explanation: 'A compliance checklist is reactive and does not provide a proactive strategic framework. Compliance is a minimum baseline, not a strategic vision.' },
    ],
    concepts: ['NIST CSF', 'Security Strategy', 'Maturity Model', 'Strategic Planning'],
    skillAreas: ['Information Security Governance', 'Security Leadership and Communication', 'Risk Management'],
  },
];
