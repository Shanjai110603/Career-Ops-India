/* =========================================================================
 * Career-Ops India — Role Packs System
 * Predefined and customizable role definitions for job matching
 * India-specific title normalization included
 * ========================================================================= */

export interface RolePack {
  id: string;
  name: string;
  family: string;
  description: string;
  keywords: string[];
  excludeKeywords: string[];
  synonyms: string[];
  alternativeTitles: string[];
  skills: string[];
  salaryRangeLPA: { fresher: [number, number]; mid: [number, number]; senior: [number, number] };
  preferredWorkModes: string[];
  interviewTopics: string[];
  resumeStrategy: string;
  enabled: boolean;
  isCustom: boolean;
}

export const DEFAULT_ROLE_PACKS: RolePack[] = [
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    family: 'engineering',
    description: 'Software development, web development, backend, frontend, full-stack roles',
    keywords: ['software', 'developer', 'engineer', 'programmer', 'full stack', 'backend', 'frontend', 'web developer', 'sde', 'swe'],
    excludeKeywords: ['intern only', 'volunteer'],
    synonyms: ['SDE', 'SWE', 'Programmer', 'Coder'],
    alternativeTitles: ['Software Developer', 'Web Developer', 'Application Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'Associate Software Engineer', 'Junior Developer', 'Senior Developer', 'Lead Developer', 'Staff Engineer'],
    skills: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs', 'TypeScript'],
    salaryRangeLPA: { fresher: [3, 8], mid: [8, 20], senior: [20, 50] },
    preferredWorkModes: ['remote', 'hybrid', 'onsite'],
    interviewTopics: ['Data Structures', 'Algorithms', 'System Design', 'OOP', 'Database Design', 'API Design'],
    resumeStrategy: 'Highlight projects, tech stack, and quantified impact. Use action verbs. Include GitHub/portfolio links.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    family: 'data',
    description: 'Data analysis, BI, MIS, reporting, analytics roles',
    keywords: ['data analyst', 'business analyst', 'bi analyst', 'mis', 'reporting', 'analytics', 'data science'],
    excludeKeywords: [],
    synonyms: ['BI Analyst', 'MIS Executive', 'Reporting Analyst', 'Data Associate'],
    alternativeTitles: ['MIS Executive', 'Business Intelligence Analyst', 'Reporting Analyst', 'Research Analyst', 'Junior Data Analyst', 'Data Associate', 'Analytics Executive'],
    skills: ['Excel', 'SQL', 'Python', 'Power BI', 'Tableau', 'Statistics', 'Data Visualization'],
    salaryRangeLPA: { fresher: [3, 6], mid: [6, 15], senior: [15, 30] },
    preferredWorkModes: ['hybrid', 'remote', 'onsite'],
    interviewTopics: ['SQL Queries', 'Excel Functions', 'Statistics', 'Data Cleaning', 'Visualization', 'Business Metrics'],
    resumeStrategy: 'Show data projects with measurable outcomes. Include tools proficiency. Highlight business impact of analyses.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    family: 'product',
    description: 'Product management, product owner, program management roles',
    keywords: ['product manager', 'product owner', 'program manager', 'apm', 'associate product'],
    excludeKeywords: [],
    synonyms: ['PM', 'PO', 'APM', 'Program Manager'],
    alternativeTitles: ['Associate Product Manager', 'Product Lead', 'Product Owner', 'Technical Product Manager', 'Group Product Manager'],
    skills: ['Product Strategy', 'User Research', 'Agile', 'Scrum', 'PRDs', 'Wireframing', 'SQL', 'Analytics'],
    salaryRangeLPA: { fresher: [6, 12], mid: [12, 25], senior: [25, 50] },
    preferredWorkModes: ['hybrid', 'onsite'],
    interviewTopics: ['Product Sense', 'Metrics', 'Prioritization', 'User Research', 'Technical Understanding', 'Business Strategy'],
    resumeStrategy: 'Focus on product metrics, user impact, stakeholder management. Show 0-to-1 builds and feature launches.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'sales-bde',
    name: 'Sales / BDE',
    family: 'sales',
    description: 'Sales, business development, account management roles',
    keywords: ['sales', 'business development', 'bde', 'account manager', 'revenue', 'bdm', 'sales executive'],
    excludeKeywords: [],
    synonyms: ['BDE', 'BDM', 'Sales Executive', 'Account Executive'],
    alternativeTitles: ['Business Development Executive', 'Sales Manager', 'Area Sales Manager', 'Regional Sales Manager', 'Inside Sales', 'Tele Sales', 'Key Account Manager', 'Revenue Executive'],
    skills: ['Negotiation', 'CRM', 'Cold Calling', 'Lead Generation', 'Pipeline Management', 'Salesforce', 'Communication'],
    salaryRangeLPA: { fresher: [2, 5], mid: [5, 12], senior: [12, 25] },
    preferredWorkModes: ['onsite', 'field_role', 'hybrid'],
    interviewTopics: ['Sales Process', 'Objection Handling', 'Target Achievement', 'CRM Tools', 'Negotiation', 'Client Management'],
    resumeStrategy: 'Highlight revenue numbers, target achievement %, client acquisition. Quantify everything.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    family: 'support',
    description: 'Customer support, service, success, help desk roles',
    keywords: ['customer support', 'customer service', 'help desk', 'support executive', 'customer success', 'customer care'],
    excludeKeywords: [],
    synonyms: ['Support Executive', 'Customer Care', 'Help Desk'],
    alternativeTitles: ['Customer Delight Executive', 'Customer Experience Executive', 'Support Specialist', 'Technical Support Executive', 'Customer Success Manager', 'Service Desk Analyst'],
    skills: ['Communication', 'Ticketing Systems', 'Problem Solving', 'Zendesk', 'Freshdesk', 'CRM', 'Empathy'],
    salaryRangeLPA: { fresher: [1.8, 4], mid: [4, 8], senior: [8, 15] },
    preferredWorkModes: ['onsite', 'wfh', 'hybrid', 'rotational_shift'],
    interviewTopics: ['Conflict Resolution', 'Escalation Process', 'SLA Management', 'Communication Skills', 'Customer Retention'],
    resumeStrategy: 'Show CSAT scores, resolution rates, ticket volumes handled. Highlight communication and de-escalation.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'hr-recruiter',
    name: 'HR / Recruiter',
    family: 'hr',
    description: 'Human resources, recruitment, talent acquisition, HR operations',
    keywords: ['hr', 'human resources', 'recruiter', 'talent acquisition', 'hr executive', 'hr manager', 'people operations'],
    excludeKeywords: [],
    synonyms: ['HR Executive', 'People Ops', 'Talent Acquisition'],
    alternativeTitles: ['HR Executive', 'HR Manager', 'Talent Acquisition Specialist', 'Recruiter', 'HR Business Partner', 'People Operations', 'HR Generalist', 'HR Coordinator'],
    skills: ['Recruitment', 'HRIS', 'Employee Relations', 'Payroll', 'Compliance', 'Interviewing', 'Onboarding'],
    salaryRangeLPA: { fresher: [2.5, 5], mid: [5, 12], senior: [12, 25] },
    preferredWorkModes: ['onsite', 'hybrid'],
    interviewTopics: ['Recruitment Process', 'Employee Engagement', 'Labor Laws', 'Performance Management', 'HR Metrics'],
    resumeStrategy: 'Show hiring metrics, time-to-fill, offer acceptance rates. Highlight employee engagement initiatives.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'operations',
    name: 'Operations / Admin',
    family: 'operations',
    description: 'Operations management, admin, process management, office coordination',
    keywords: ['operations', 'admin', 'office', 'coordination', 'process', 'ops manager', 'executive assistant'],
    excludeKeywords: [],
    synonyms: ['Ops Manager', 'Admin Executive', 'Coordinator'],
    alternativeTitles: ['Operations Manager', 'Operations Executive', 'Process Associate', 'Admin Executive', 'Office Manager', 'Coordinator', 'Management Trainee', 'Executive Assistant'],
    skills: ['Process Management', 'Excel', 'Coordination', 'Vendor Management', 'Scheduling', 'Documentation'],
    salaryRangeLPA: { fresher: [2, 4.5], mid: [4.5, 10], senior: [10, 20] },
    preferredWorkModes: ['onsite', 'hybrid'],
    interviewTopics: ['Process Improvement', 'Vendor Management', 'Project Coordination', 'Time Management', 'MIS Reporting'],
    resumeStrategy: 'Show process improvements, cost savings, team coordination. Highlight organizational and multitasking skills.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'finance-accounts',
    name: 'Finance / Accounts',
    family: 'finance',
    description: 'Finance, accounting, audit, taxation roles',
    keywords: ['finance', 'accounts', 'accounting', 'audit', 'taxation', 'ca', 'chartered accountant', 'financial analyst'],
    excludeKeywords: [],
    synonyms: ['CA', 'Accountant', 'Financial Analyst'],
    alternativeTitles: ['Accounts Executive', 'Financial Analyst', 'Tax Consultant', 'Audit Associate', 'Accounts Manager', 'CA Articleship', 'Finance Manager', 'Billing Executive'],
    skills: ['Tally', 'SAP', 'Excel', 'GST', 'Income Tax', 'Financial Reporting', 'Audit', 'Accounting Standards'],
    salaryRangeLPA: { fresher: [3, 7], mid: [7, 15], senior: [15, 35] },
    preferredWorkModes: ['onsite', 'hybrid'],
    interviewTopics: ['Accounting Principles', 'GST', 'Income Tax', 'Financial Statements', 'Audit Process', 'Tally/SAP'],
    resumeStrategy: 'Highlight certifications (CA, CMA, CS). Show audit volumes, tax filings handled, compliance track record.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'qa-testing',
    name: 'QA / Testing',
    family: 'quality',
    description: 'Quality assurance, software testing, automation testing roles',
    keywords: ['qa', 'testing', 'quality assurance', 'test engineer', 'sdet', 'automation testing', 'manual testing'],
    excludeKeywords: [],
    synonyms: ['QA Engineer', 'Tester', 'SDET'],
    alternativeTitles: ['QA Engineer', 'Test Engineer', 'SDET', 'Automation Tester', 'Manual Tester', 'QA Lead', 'Quality Analyst', 'Performance Tester'],
    skills: ['Selenium', 'Cypress', 'JUnit', 'Postman', 'JIRA', 'Test Planning', 'Bug Reporting', 'API Testing'],
    salaryRangeLPA: { fresher: [3, 6], mid: [6, 15], senior: [15, 30] },
    preferredWorkModes: ['remote', 'hybrid', 'onsite'],
    interviewTopics: ['Test Strategies', 'Automation Frameworks', 'Bug Life Cycle', 'API Testing', 'Performance Testing'],
    resumeStrategy: 'Show test coverage improvements, bug detection rates, automation ROI. List frameworks and tools.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    family: 'marketing',
    description: 'Digital marketing, content marketing, SEO, social media marketing',
    keywords: ['marketing', 'digital marketing', 'seo', 'social media', 'content marketing', 'growth marketing', 'brand'],
    excludeKeywords: [],
    synonyms: ['Digital Marketer', 'Growth Hacker', 'SEO Specialist'],
    alternativeTitles: ['Digital Marketing Executive', 'Marketing Manager', 'SEO Analyst', 'Social Media Manager', 'Content Marketing Manager', 'Growth Marketing Manager', 'Brand Manager'],
    skills: ['SEO', 'Google Ads', 'Social Media', 'Content Strategy', 'Analytics', 'Email Marketing', 'Copywriting'],
    salaryRangeLPA: { fresher: [2.5, 5], mid: [5, 12], senior: [12, 25] },
    preferredWorkModes: ['remote', 'hybrid'],
    interviewTopics: ['Campaign Strategy', 'ROI Measurement', 'SEO Techniques', 'Content Strategy', 'Analytics Tools'],
    resumeStrategy: 'Show campaign results with metrics (CTR, ROAS, traffic growth). Include portfolio of campaigns.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'devops-cloud',
    name: 'DevOps / Cloud',
    family: 'infrastructure',
    description: 'DevOps, cloud engineering, SRE, infrastructure roles',
    keywords: ['devops', 'cloud', 'sre', 'site reliability', 'infrastructure', 'aws', 'azure', 'gcp', 'kubernetes'],
    excludeKeywords: [],
    synonyms: ['SRE', 'Cloud Engineer', 'Infrastructure Engineer'],
    alternativeTitles: ['DevOps Engineer', 'Cloud Engineer', 'SRE', 'Platform Engineer', 'Infrastructure Engineer', 'Release Engineer'],
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux', 'Monitoring', 'Scripting'],
    salaryRangeLPA: { fresher: [4, 8], mid: [8, 20], senior: [20, 45] },
    preferredWorkModes: ['remote', 'hybrid'],
    interviewTopics: ['CI/CD Pipelines', 'Container Orchestration', 'Cloud Architecture', 'Monitoring', 'Security', 'Linux Admin'],
    resumeStrategy: 'Show infrastructure scale managed, deployment frequency, uptime improvements. List certifications.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'design-ux',
    name: 'UI/UX Design',
    family: 'design',
    description: 'UI design, UX design, product design, visual design roles',
    keywords: ['ui', 'ux', 'design', 'product design', 'visual design', 'interaction design', 'figma'],
    excludeKeywords: [],
    synonyms: ['Product Designer', 'UX Researcher', 'Visual Designer'],
    alternativeTitles: ['UI/UX Designer', 'Product Designer', 'UX Researcher', 'Visual Designer', 'Interaction Designer', 'Design Lead'],
    skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems', 'Wireframing'],
    salaryRangeLPA: { fresher: [3, 6], mid: [6, 15], senior: [15, 30] },
    preferredWorkModes: ['remote', 'hybrid'],
    interviewTopics: ['Design Process', 'User Research', 'Usability Testing', 'Design Systems', 'Accessibility'],
    resumeStrategy: 'Include portfolio link prominently. Show before/after of design improvements with metrics.',
    enabled: true,
    isCustom: false,
  },
];

/** India-specific title normalization map. Maps messy/ambiguous titles to standard role families. */
export const INDIA_TITLE_MAP: Record<string, { roleFamily: string; rolePackId: string; notes: string }> = {
  'management trainee': { roleFamily: 'operations', rolePackId: 'operations', notes: 'Usually ops/analyst/generalist depending on company' },
  'customer delight executive': { roleFamily: 'support', rolePackId: 'customer-support', notes: 'Customer support in Indian BPOs' },
  'revenue operations associate': { roleFamily: 'sales', rolePackId: 'sales-bde', notes: 'Sales ops / CRM / revenue analytics' },
  'mis executive': { roleFamily: 'data', rolePackId: 'data-analyst', notes: 'Management information systems — really reporting/analytics' },
  'business development executive': { roleFamily: 'sales', rolePackId: 'sales-bde', notes: 'Sales / BD role, common in Indian startups' },
  'process associate': { roleFamily: 'operations', rolePackId: 'operations', notes: 'BPO / operations process role' },
  'technical support executive': { roleFamily: 'support', rolePackId: 'customer-support', notes: 'Support / helpdesk / product support' },
  'branch manager': { roleFamily: 'operations', rolePackId: 'operations', notes: 'Branch operations / regional management' },
  'area sales manager': { roleFamily: 'sales', rolePackId: 'sales-bde', notes: 'Field sales management' },
  'relationship manager': { roleFamily: 'sales', rolePackId: 'sales-bde', notes: 'Client relationship / sales in BFSI' },
  'team leader': { roleFamily: 'operations', rolePackId: 'operations', notes: 'Operations / BPO team lead' },
  'content writer': { roleFamily: 'marketing', rolePackId: 'marketing', notes: 'Content / copywriting' },
  'trainee engineer': { roleFamily: 'engineering', rolePackId: 'software-engineer', notes: 'Entry-level engineering' },
  'graduate engineer trainee': { roleFamily: 'engineering', rolePackId: 'software-engineer', notes: 'GET — common fresher hiring title' },
  'associate consultant': { roleFamily: 'engineering', rolePackId: 'software-engineer', notes: 'IT services / consulting — usually development' },
  'systems engineer': { roleFamily: 'engineering', rolePackId: 'software-engineer', notes: 'TCS/Infosys/Wipro engineering title' },
  'billing executive': { roleFamily: 'finance', rolePackId: 'finance-accounts', notes: 'Accounts / billing operations' },
  'telecaller': { roleFamily: 'sales', rolePackId: 'sales-bde', notes: 'Tele-sales / tele-calling role' },
  'back office executive': { roleFamily: 'operations', rolePackId: 'operations', notes: 'Admin / data entry / operations' },
  'computer operator': { roleFamily: 'operations', rolePackId: 'operations', notes: 'Data entry / office admin' },
};

/** Normalize a job title to a role pack. */
export function normalizeTitle(title: string): { rolePackId: string; roleFamily: string; confidence: number } | null {
  const lower = title.toLowerCase().trim();

  const directMatch = INDIA_TITLE_MAP[lower];
  if (directMatch) {
    return { rolePackId: directMatch.rolePackId, roleFamily: directMatch.roleFamily, confidence: 0.9 };
  }

  for (const [key, value] of Object.entries(INDIA_TITLE_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { rolePackId: value.rolePackId, roleFamily: value.roleFamily, confidence: 0.7 };
    }
  }

  for (const pack of DEFAULT_ROLE_PACKS) {
    if (pack.keywords.some(k => lower.includes(k.toLowerCase()))) {
      return { rolePackId: pack.id, roleFamily: pack.family, confidence: 0.6 };
    }
    if (pack.alternativeTitles.some(t => lower.includes(t.toLowerCase()) || t.toLowerCase().includes(lower))) {
      return { rolePackId: pack.id, roleFamily: pack.family, confidence: 0.7 };
    }
  }

  return null;
}
