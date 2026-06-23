/* =========================================================================
 * Career-Ops India — Hono TypeScript API Server
 * Full REST API — using Drizzle ORM and Monorepo Packages
 * ========================================================================= */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

// Import monorepo packages
import { getDb, schema } from '@career-ops/db';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { scoreJob, scoreCareerSwitch } from '@career-ops/core';
import { callAI, testConnection } from '@career-ops/ai';
import { STATES, CITIES, REGION_GROUPS } from '@career-ops/locations';

const app = new Hono();
app.use('*', cors());

const now = () => new Date().toISOString();
const DB_PATH = resolve('./data/career-ops.db');

// Initialize database
const db = getDb();

function logAudit(action: string, entityType?: string, entityId?: string, details?: any) {
  try {
    db.insert(schema.auditLog).values({
      id: randomUUID(),
      action,
      entityType: entityType || null,
      entityId: entityId || null,
      details: details ? JSON.stringify(details) : null,
      timestamp: now()
    }).run();
  } catch (e) {
    console.error('Failed to log audit event:', e);
  }
}

/** Helper: Load prompt templates from modes/ folder */
function getPromptTemplate(filename: string): string {
  const path = resolve(`./modes/${filename}`);
  if (existsSync(path)) {
    return readFileSync(path, 'utf-8');
  }
  return '';
}

/** Helper: Compile Drizzle resume row to Markdown (cv.md format) */
export function compileResumeToMarkdown(resume: any): string {
  let md = `# ${resume.name || 'Resume'}\n\n`;
  const sections = typeof resume.sections === 'string' ? JSON.parse(resume.sections) : resume.sections || {};
  
  if (sections.personalInfo) {
    const p = sections.personalInfo;
    md += `**Email:** ${p.email || ''} | **Phone:** ${p.phone || ''} | **Location:** ${p.location || ''}\n`;
    if (p.linkedin) md += `**LinkedIn:** ${p.linkedin}\n`;
    md += `\n`;
  }
  
  if (sections.summary) {
    md += `## Professional Summary\n\n${sections.summary}\n\n`;
  }
  
  if (sections.skills && sections.skills.length > 0) {
    md += `## Skills\n\n${Array.isArray(sections.skills) ? sections.skills.join(', ') : sections.skills}\n\n`;
  }
  
  if (sections.experience && sections.experience.length > 0) {
    md += `## Professional Experience\n\n`;
    for (const exp of sections.experience) {
      md += `### ${exp.title} at ${exp.company}\n`;
      md += `*Duration: ${exp.duration || ''}*\n\n`;
      md += `${exp.description || ''}\n\n`;
    }
  }
  
  if (sections.education && sections.education.length > 0) {
    md += `## Education\n\n`;
    for (const edu of sections.education) {
      md += `- **${edu.degree}** from ${edu.institution} (${edu.year})\n`;
    }
    md += `\n`;
  }
  
  if (sections.projects && sections.projects.length > 0) {
    md += `## Projects\n\n`;
    for (const proj of sections.projects) {
      md += `### ${proj.name}\n`;
      if (proj.tech) md += `*Technologies: ${proj.tech}*\n\n`;
      md += `${proj.description || ''}\n\n`;
    }
  }
  
  return md;
}

/** Helper: Calculate job score and flags based on the active profile */
export function calculateJobScores(job: any, profile: any) {
  if (!profile) {
    return {
      fitScore: 0,
      riskScore: 0,
      overallScore: 0,
      grade: 'F',
      qualityFlags: ['No active profile to evaluate fit']
    };
  }

  const userSkills = JSON.parse(profile.skills || '[]');
  const userPreferredWorkModes = JSON.parse(profile.preferredWorkModes || '[]');

  const workModeMap: Record<string, string> = {
    'remote': 'remote',
    'hybrid': 'hybrid',
    'onsite': 'onsite',
    'wfh': 'remote',
    'india_remote': 'remote'
  };
  const jobWorkMode = workModeMap[job.workMode || ''] || 'onsite';

  const scoringInput = {
    jobTitle: job.title || '',
    jobDescription: job.description || '',
    companyName: job.company || '',
    salaryLPA: job.salaryMinLPA || job.salaryMaxLPA || undefined,
    requiredExperienceYears: job.experienceMin || undefined,
    userExperienceYears: profile.experienceYears || 0,
    userSkills,
    requiredSkills: [],
    preferredSkills: [],
    userLocation: profile.location || '',
    jobLocation: job.location || '',
    jobWorkMode,
    userPreferredWorkModes,
    isCareerSwitch: !!profile.isCareerSwitching,
    userCurrentRole: profile.currentRole || '',
    userTargetRole: profile.switchToRole || '',
    hasBond: !!job.hasBond,
    bondYears: job.bondYears !== undefined ? parseInt(job.bondYears) : undefined,
    isConsultancy: !!job.isConsultancy,
    hasVagueDescription: !!job.hasVagueDescription || (job.description && job.description.length < 150),
    salaryDisclosed: !!(job.salaryMinLPA || job.salaryMaxLPA || job.salaryText),
    companyVerified: !!job.companyVerified
  };

  const result = scoreJob(scoringInput);
  return {
    fitScore: result.dimensions.roleFit,
    riskScore: result.dimensions.riskScore,
    overallScore: result.overall,
    grade: result.grade,
    qualityFlags: result.flags
  };
}

/** Recalculates match scores for all job listings in the database when profile changes */
async function recalculateAllJobs() {
  try {
    const activeProfile = db.select().from(schema.profiles).where(eq(schema.profiles.isActive, true)).limit(1).all()[0];
    if (!activeProfile) return;

    const allJobs = db.select().from(schema.jobs).all();
    for (const job of allJobs) {
      const scores = calculateJobScores(job, activeProfile);
      db.update(schema.jobs).set({
        fitScore: scores.fitScore,
        riskScore: scores.riskScore,
        overallScore: scores.overallScore,
        grade: scores.grade,
        qualityFlags: JSON.stringify(scores.qualityFlags),
        updatedAt: now()
      }).where(eq(schema.jobs.id, job.id)).run();
    }
    console.log('✅ Recalculated scores for all jobs.');
  } catch (err) {
    console.error('Failed to recalculate jobs:', err);
  }
}

/** Safe JSON Parser for AI completions */
function parseAIResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

/* ─── Health ─── */
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: now(), version: '1.0.0' }));

/* ─── Profiles ─── */
app.get('/api/profiles', (c) => {
  const result = db.select().from(schema.profiles).where(eq(schema.profiles.isActive, true)).orderBy(desc(schema.profiles.updatedAt)).all();
  return c.json(result);
});

app.post('/api/profiles', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  const values = {
    id,
    name: b.name || '',
    email: b.email || null,
    phone: b.phone || null,
    location: b.location || null,
    stateCode: b.stateCode || null,
    experienceYears: b.experienceYears !== undefined ? parseFloat(b.experienceYears) : 0,
    currentRole: b.currentRole || null,
    targetRoles: JSON.stringify(b.targetRoles || []),
    skills: JSON.stringify(b.skills || []),
    education: JSON.stringify(b.education || {}),
    summary: b.summary || null,
    linkedinUrl: b.linkedinUrl || null,
    portfolioUrl: b.portfolioUrl || null,
    githubUrl: b.githubUrl || null,
    preferredWorkModes: JSON.stringify(b.preferredWorkModes || []),
    preferredLocations: JSON.stringify(b.preferredLocations || []),
    salaryExpectationLPA: b.salaryExpectationLPA !== undefined ? parseFloat(b.salaryExpectationLPA) : null,
    noticePeriodDays: b.noticePeriodDays !== undefined ? parseInt(b.noticePeriodDays) : null,
    isCareerSwitching: !!b.isCareerSwitching,
    switchFromRole: b.switchFromRole || null,
    switchToRole: b.switchToRole || null,
    switchMode: b.switchMode || null,
    rolePackIds: JSON.stringify(b.rolePackIds || []),
    isActive: true,
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.profiles).where(eq(schema.profiles.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.profiles).set(values).where(eq(schema.profiles.id, id)).run();
  } else {
    db.insert(schema.profiles).values(values).run();
  }

  logAudit(exists ? 'profile_updated' : 'profile_created', 'profiles', id);
  
  // Re-score all jobs in the background as the profile metrics changed
  setTimeout(() => recalculateAllJobs(), 100);

  return c.json({ id, success: true });
});

/* ─── Jobs ─── */
app.get('/api/jobs', (c) => {
  const { search, location, workMode, minSalary, maxSalary, sort, limit } = c.req.query();
  
  let queryBuilder = db.select().from(schema.jobs);
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(schema.jobs.title, `%${search}%`),
        like(schema.jobs.company, `%${search}%`),
        like(schema.jobs.description, `%${search}%`)
      )
    );
  }

  if (location) {
    conditions.push(
      or(
        like(schema.jobs.location, `%${location}%`),
        like(schema.jobs.city, `%${location}%`),
        eq(schema.jobs.stateCode, location)
      )
    );
  }

  if (workMode) {
    conditions.push(eq(schema.jobs.workMode, workMode));
  }

  if (minSalary) {
    conditions.push(eq(schema.jobs.salaryMinLPA, parseFloat(minSalary)));
  }

  if (maxSalary) {
    conditions.push(eq(schema.jobs.salaryMaxLPA, parseFloat(maxSalary)));
  }

  let finalQuery = conditions.length > 0 ? queryBuilder.where(and(...conditions)) : queryBuilder;

  if (sort === 'score') {
    finalQuery = finalQuery.orderBy(desc(schema.jobs.overallScore));
  } else {
    finalQuery = finalQuery.orderBy(desc(schema.jobs.createdAt));
  }

  const result = finalQuery.limit(parseInt(limit || '50')).all();
  return c.json(result);
});

app.post('/api/jobs', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();

  // Load the active user profile to score this job listing
  const activeProfile = db.select().from(schema.profiles).where(eq(schema.profiles.isActive, true)).limit(1).all()[0];
  
  const scoreData = calculateJobScores(b, activeProfile);

  const values = {
    id,
    title: b.title,
    company: b.company,
    description: b.description || null,
    location: b.location || null,
    stateCode: b.stateCode || null,
    city: b.city || null,
    workMode: b.workMode || null,
    salaryText: b.salaryText || null,
    salaryMinLPA: b.salaryMinLPA !== undefined ? parseFloat(b.salaryMinLPA) : null,
    salaryMaxLPA: b.salaryMaxLPA !== undefined ? parseFloat(b.salaryMaxLPA) : null,
    salaryDisclosed: !!(b.salaryMinLPA || b.salaryMaxLPA || b.salaryText),
    experienceMin: b.experienceMin !== undefined ? parseFloat(b.experienceMin) : null,
    experienceMax: b.experienceMax !== undefined ? parseFloat(b.experienceMax) : null,
    source: b.source || 'manual',
    sourceUrl: b.sourceUrl || null,
    postedDate: b.postedDate || null,
    postedDaysAgo: b.postedDaysAgo !== undefined ? parseInt(b.postedDaysAgo) : null,
    companyUrl: b.companyUrl || null,
    companyVerified: !!b.companyVerified,
    rolePackId: b.rolePackId || null,
    normalizedTitle: b.normalizedTitle || null,
    fingerprint: b.fingerprint || null,
    hasBond: !!b.hasBond,
    bondYears: b.bondYears !== undefined ? parseInt(b.bondYears) : null,
    isConsultancy: !!b.isConsultancy,
    hasVagueDescription: !!b.hasVagueDescription || (b.description && b.description.length < 150),
    
    // Core Engine Computations
    fitScore: scoreData.fitScore,
    riskScore: scoreData.riskScore,
    overallScore: scoreData.overallScore,
    grade: scoreData.grade,
    qualityFlags: JSON.stringify(scoreData.qualityFlags),
    
    scoringDetails: JSON.stringify(scoreData),
    tags: JSON.stringify(b.tags || []),
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.jobs).set(values).where(eq(schema.jobs.id, id)).run();
  } else {
    db.insert(schema.jobs).values(values).run();
  }

  logAudit(exists ? 'job_updated' : 'job_created', 'jobs', id);
  return c.json({ id, success: true, scores: scoreData });
});

app.get('/api/jobs/:id', (c) => {
  const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, c.req.param('id'))).limit(1).all()[0];
  if (!job) return c.json({ error: 'Not found' }, 404);
  return c.json(job);
});

app.delete('/api/jobs/:id', (c) => {
  const id = c.req.param('id');
  db.delete(schema.jobs).where(eq(schema.jobs.id, id)).run();
  logAudit('job_deleted', 'jobs', id);
  return c.json({ success: true });
});

/* ─── Applications ─── */
app.get('/api/applications', (c) => {
  const { status, profileId } = c.req.query();
  let queryBuilder = db.select().from(schema.applications);
  const conditions = [];

  if (status) conditions.push(eq(schema.applications.status, status));
  if (profileId) conditions.push(eq(schema.applications.profileId, profileId));

  const result = conditions.length > 0
    ? queryBuilder.where(and(...conditions)).orderBy(desc(schema.applications.updatedAt)).all()
    : queryBuilder.orderBy(desc(schema.applications.updatedAt)).all();

  return c.json(result);
});

app.post('/api/applications', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  const values = {
    id,
    jobId: b.jobId || null,
    profileId: b.profileId || null,
    status: b.status || 'discovered',
    company: b.company,
    jobTitle: b.jobTitle,
    source: b.source || null,
    location: b.location || null,
    workMode: b.workMode || null,
    salaryText: b.salaryText || null,
    rolePackId: b.rolePackId || null,
    fitScore: b.fitScore !== undefined ? parseFloat(b.fitScore) : null,
    riskScore: b.riskScore !== undefined ? parseFloat(b.riskScore) : null,
    switchScore: b.switchScore !== undefined ? parseFloat(b.switchScore) : null,
    notes: b.notes || null,
    recruiterContact: b.recruiterContact || null,
    nextAction: b.nextAction || null,
    followUpDate: b.followUpDate || null,
    appliedDate: b.appliedDate || null,
    resumeVersionId: b.resumeVersionId || null,
    tags: JSON.stringify(b.tags || []),
    attachments: JSON.stringify(b.attachments || []),
    timeline: JSON.stringify(b.timeline || [{ date: now(), event: 'Created', notes: '' }]),
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.applications).where(eq(schema.applications.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.applications).set(values).where(eq(schema.applications.id, id)).run();
  } else {
    db.insert(schema.applications).values(values).run();
  }

  logAudit(exists ? 'application_updated' : 'application_created', 'applications', id);
  return c.json({ id, success: true });
});

app.put('/api/applications/:id', async (c) => {
  const b = await c.req.json();
  const id = c.req.param('id');
  const cleanUpdates: any = {};
  
  for (const [key, value] of Object.entries(b)) {
    if (['id', 'createdAt'].includes(key)) continue;
    cleanUpdates[key] = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
  }
  cleanUpdates.updatedAt = now();

  db.update(schema.applications).set(cleanUpdates).where(eq(schema.applications.id, id)).run();
  logAudit('application_updated', 'applications', id);
  return c.json({ id, success: true });
});

/* ─── Resumes ─── */
app.get('/api/resumes', (c) => {
  const result = db.select().from(schema.resumes).where(eq(schema.resumes.isActive, true)).orderBy(desc(schema.resumes.updatedAt)).all();
  return c.json(result);
});

app.post('/api/resumes', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  const values = {
    id,
    profileId: b.profileId || null,
    name: b.name,
    type: b.type || 'master',
    rolePackId: b.rolePackId || null,
    targetJobId: b.targetJobId || null,
    sections: JSON.stringify(b.sections || {}),
    template: b.template || 'modern',
    format: b.format || 'one_page',
    pdfPath: b.pdfPath || null,
    isActive: true,
    version: b.version !== undefined ? parseInt(b.version) : 1,
    parentId: b.parentId || null,
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.resumes).where(eq(schema.resumes.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.resumes).set(values).where(eq(schema.resumes.id, id)).run();
  } else {
    db.insert(schema.resumes).values(values).run();
  }

  logAudit(exists ? 'resume_updated' : 'resume_created', 'resumes', id);
  return c.json({ id, success: true });
});

/* ─── Role Packs ─── */
app.get('/api/role-packs', (c) => {
  const custom = db.select().from(schema.rolePacks).orderBy(schema.rolePacks.sortOrder).all();
  const builtIn = [
    { id: 'software-engineer', name: 'Software Engineer', family: 'engineering', description: 'Software development roles', keywords: JSON.stringify(['software', 'developer', 'engineer', 'programmer', 'full stack', 'backend', 'frontend', 'sde', 'swe']), skills: JSON.stringify(['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git']), interview_topics: JSON.stringify(['Data Structures', 'System Design', 'OOP']), resume_strategy: 'Highlight projects and quantified impact.', enabled: 1, is_custom: 0 },
    { id: 'data-analyst', name: 'Data Analyst', family: 'data', description: 'Data analysis, BI, reporting', keywords: JSON.stringify(['data analyst', 'business analyst', 'bi analyst', 'mis', 'analytics']), skills: JSON.stringify(['Excel', 'SQL', 'Python', 'Power BI', 'Tableau']), interview_topics: JSON.stringify(['SQL Queries', 'Statistics', 'Data Visualization']), resume_strategy: 'Show data projects with measurable outcomes.', enabled: 1, is_custom: 0 },
    { id: 'product-manager', name: 'Product Manager', family: 'product', description: 'Product management roles', keywords: JSON.stringify(['product manager', 'product owner', 'program manager', 'apm']), skills: JSON.stringify(['Product Strategy', 'User Research', 'Agile', 'SQL', 'Analytics']), interview_topics: JSON.stringify(['Product Sense', 'Metrics', 'Prioritization']), resume_strategy: 'Focus on product metrics and user impact.', enabled: 1, is_custom: 0 },
    { id: 'sales-bde', name: 'Sales / BDE', family: 'sales', description: 'Sales, business development', keywords: JSON.stringify(['sales', 'business development', 'bde', 'account manager', 'bdm']), skills: JSON.stringify(['Negotiation', 'CRM', 'Cold Calling', 'Lead Generation']), interview_topics: JSON.stringify(['Sales Process', 'Target Achievement']), resume_strategy: 'Highlight revenue numbers and target achievement.', enabled: 1, is_custom: 0 },
    { id: 'customer-support', name: 'Customer Support', family: 'support', description: 'Customer support and service', keywords: JSON.stringify(['customer support', 'customer service', 'help desk', 'customer care']), skills: JSON.stringify(['Communication', 'Ticketing', 'Problem Solving', 'Zendesk']), interview_topics: JSON.stringify(['Conflict Resolution', 'SLA Management']), resume_strategy: 'Show CSAT scores and resolution rates.', enabled: 1, is_custom: 0 },
    { id: 'hr-recruiter', name: 'HR / Recruiter', family: 'hr', description: 'HR and talent acquisition', keywords: JSON.stringify(['hr', 'human resources', 'recruiter', 'talent acquisition']), skills: JSON.stringify(['Recruitment', 'HRIS', 'Employee Relations', 'Compliance']), interview_topics: JSON.stringify(['Recruitment Process', 'Labor Laws']), resume_strategy: 'Show hiring metrics and engagement initiatives.', enabled: 1, is_custom: 0 },
    { id: 'operations', name: 'Operations / Admin', family: 'operations', description: 'Operations and admin', keywords: JSON.stringify(['operations', 'admin', 'coordination', 'process']), skills: JSON.stringify(['Process Management', 'Excel', 'Coordination', 'Vendor Management']), interview_topics: JSON.stringify(['Process Improvement', 'Vendor Management']), resume_strategy: 'Show process improvements and cost savings.', enabled: 1, is_custom: 0 },
    { id: 'finance-accounts', name: 'Finance / Accounts', family: 'finance', description: 'Finance and accounting', keywords: JSON.stringify(['finance', 'accounts', 'accounting', 'audit', 'taxation', 'ca']), skills: JSON.stringify(['Tally', 'SAP', 'Excel', 'GST', 'Income Tax']), interview_topics: JSON.stringify(['Accounting Principles', 'GST', 'Financial Statements']), resume_strategy: 'Highlight certifications and compliance track record.', enabled: 1, is_custom: 0 },
    { id: 'qa-testing', name: 'QA / Testing', family: 'quality', description: 'Quality assurance and testing', keywords: JSON.stringify(['qa', 'testing', 'quality assurance', 'sdet', 'automation']), skills: JSON.stringify(['Selenium', 'Cypress', 'JUnit', 'Postman', 'JIRA']), interview_topics: JSON.stringify(['Test Strategies', 'Automation Frameworks']), resume_strategy: 'Show test coverage and automation ROI.', enabled: 1, is_custom: 0 },
    { id: 'marketing', name: 'Marketing', family: 'marketing', description: 'Digital and content marketing', keywords: JSON.stringify(['marketing', 'digital marketing', 'seo', 'social media', 'content']), skills: JSON.stringify(['SEO', 'Google Ads', 'Social Media', 'Analytics', 'Copywriting']), interview_topics: JSON.stringify(['Campaign Strategy', 'ROI Measurement']), resume_strategy: 'Show campaign results with metrics.', enabled: 1, is_custom: 0 },
    { id: 'devops-cloud', name: 'DevOps / Cloud', family: 'infrastructure', description: 'DevOps and cloud engineering', keywords: JSON.stringify(['devops', 'cloud', 'sre', 'aws', 'azure', 'kubernetes']), skills: JSON.stringify(['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux']), interview_topics: JSON.stringify(['CI/CD Pipelines', 'Cloud Architecture']), resume_strategy: 'Show infrastructure scale and uptime improvements.', enabled: 1, is_custom: 0 },
    { id: 'design-ux', name: 'UI/UX Design', family: 'design', description: 'UI and UX design', keywords: JSON.stringify(['ui', 'ux', 'design', 'product design', 'figma']), skills: JSON.stringify(['Figma', 'Sketch', 'User Research', 'Prototyping', 'Design Systems']), interview_topics: JSON.stringify(['Design Process', 'Usability Testing']), resume_strategy: 'Include portfolio link prominently.', enabled: 1, is_custom: 0 },
  ];
  return c.json([...builtIn, ...custom]);
});

app.post('/api/role-packs', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  const values = {
    id,
    name: b.name,
    family: b.family || 'custom',
    description: b.description || null,
    keywords: JSON.stringify(b.keywords || []),
    excludeKeywords: JSON.stringify(b.excludeKeywords || []),
    synonyms: JSON.stringify(b.synonyms || []),
    alternativeTitles: JSON.stringify(b.alternativeTitles || []),
    skills: JSON.stringify(b.skills || []),
    salaryRange: JSON.stringify(b.salaryRange || {}),
    preferredWorkModes: JSON.stringify(b.preferredWorkModes || []),
    interviewTopics: JSON.stringify(b.interviewTopics || []),
    resumeStrategy: b.resumeStrategy || null,
    enabled: b.enabled !== false,
    isCustom: true,
    sortOrder: b.sortOrder !== undefined ? parseInt(b.sortOrder) : 0,
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.rolePacks).where(eq(schema.rolePacks.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.rolePacks).set(values).where(eq(schema.rolePacks.id, id)).run();
  } else {
    db.insert(schema.rolePacks).values(values).run();
  }

  logAudit(exists ? 'rolepack_updated' : 'rolepack_created', 'role_packs', id);
  return c.json({ id, success: true });
});

/* ─── AI Providers ─── */
app.get('/api/ai-providers', (c) => {
  const providers = db.select().from(schema.aiProviders).orderBy(schema.aiProviders.sortOrder).all();
  return c.json(providers.map(p => ({ ...p, api_key: p.apiKey ? '••••••' + String(p.apiKey).slice(-4) : null })));
});

app.post('/api/ai-providers', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  
  const values = {
    id,
    name: b.name,
    type: b.type,
    baseUrl: b.baseUrl || null,
    apiKey: b.apiKey || null,
    defaultModel: b.defaultModel || null,
    fallbackModel: b.fallbackModel || null,
    temperature: b.temperature !== undefined ? parseFloat(b.temperature) : 0.7,
    maxTokens: b.maxTokens !== undefined ? parseInt(b.maxTokens) : null,
    timeout: b.timeout !== undefined ? parseInt(b.timeout) : 30000,
    retries: b.retries !== undefined ? parseInt(b.retries) : 2,
    streaming: !!b.streaming,
    vision: !!b.vision,
    enabled: b.enabled !== false,
    sortOrder: b.sortOrder !== undefined ? parseInt(b.sortOrder) : 0,
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.aiProviders).set(values).where(eq(schema.aiProviders.id, id)).run();
  } else {
    db.insert(schema.aiProviders).values(values).run();
  }

  logAudit(exists ? 'ai_provider_updated' : 'ai_provider_created', 'ai_providers', id);
  return c.json({ id, success: true });
});

app.post('/api/ai-providers/:id/test', async (c) => {
  const id = c.req.param('id');
  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.id, id)).limit(1).all()[0];
  if (!provider) return c.json({ success: false, message: 'Provider not found' }, 404);

  const testConfig = {
    id: provider.id,
    name: provider.name,
    type: provider.type as any,
    baseUrl: provider.baseUrl || '',
    apiKey: provider.apiKey || '',
    defaultModel: provider.defaultModel || '',
    fallbackModel: provider.fallbackModel || undefined,
    temperature: provider.temperature || 0.7,
    maxTokens: provider.maxTokens || undefined,
    timeout: provider.timeout || 30000,
    retries: provider.retries || 2,
    streaming: !!provider.streaming
  };

  try {
    const result = await testConnection(testConfig);
    return c.json(result);
  } catch (err: any) {
    return c.json({ success: false, message: err.message });
  }
});

app.delete('/api/ai-providers/:id', (c) => {
  const id = c.req.param('id');
  db.delete(schema.aiProviders).where(eq(schema.aiProviders.id, id)).run();
  logAudit('ai_provider_deleted', 'ai_providers', id);
  return c.json({ success: true });
});

/* ─── Settings ─── */
app.get('/api/settings', (c) => {
  const { category } = c.req.query();
  const query = db.select().from(schema.settings);
  const result = category ? query.where(eq(schema.settings.category, category)).all() : query.all();
  return c.json(result);
});

app.put('/api/settings', async (c) => {
  const b = await c.req.json();
  db.update(schema.settings).set({
    value: String(b.value),
    updatedAt: now()
  }).where(eq(schema.settings.key, b.key)).run();

  logAudit('settings_update', 'settings', b.key, { value: b.value });
  return c.json({ success: true });
});

/* ─── Real AI Dispatch & Scoring Mappings ─── */

app.post('/api/ai/evaluate-job', async (c) => {
  const b = await c.req.json();
  const jobId = b.jobId;

  const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).limit(1).all()[0];
  if (!job) return c.json({ error: 'Job not found' }, 404);

  const activeProfile = db.select().from(schema.profiles).where(eq(schema.profiles.isActive, true)).limit(1).all()[0];
  if (!activeProfile) return c.json({ error: 'No active profile found. Create one first.' }, 400);

  const activeResume = db.select().from(schema.resumes).where(eq(schema.resumes.profileId, activeProfile.id)).limit(1).all()[0];
  const cvMd = activeResume ? compileResumeToMarkdown(activeResume) : '';

  const sharedContext = getPromptTemplate('_shared.md');
  const ofertaLogic = getPromptTemplate('oferta.md');

  const systemPrompt = `You are career-ops, an AI-powered job search assistant.
You evaluate job offers against the user's CV using a structured A-G scoring system.

Your evaluation methodology is defined below. Follow it exactly.

SYSTEM CONTEXT (_shared.md)
${sharedContext}

EVALUATION MODE (oferta.md)
${ofertaLogic}

CANDIDATE RESUME (cv.md equivalent)
${cvMd}

CANDIDATE PROFILE & TARGETS
Name: ${activeProfile.name}
Experience: ${activeProfile.experienceYears} years
Target Roles: ${activeProfile.targetRoles}
Skills: ${activeProfile.skills}
Salary Expectation (LPA): ${activeProfile.salaryExpectationLPA}

IMPORTANT OPERATING RULES FOR THIS SESSION
1. Generate Blocks A through G in full, in English.
2. At the very end, output a machine-readable summary block in this exact format:

---SCORE_SUMMARY---
COMPANY: ${job.company}
ROLE: ${job.title}
SCORE: <global score as decimal from 1.0 to 5.0, e.g. 4.2>
ARCHETYPE: <detected archetype>
LEGITIMACY: <High Confidence | Proceed with Caution | Suspicious>
---END_SUMMARY---
`;

  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];
  
  if (!provider) {
    // Dynamic Fallback
    const scoreData = calculateJobScores(job, activeProfile);
    return c.json({
      evaluationText: `## Rule-Based Evaluation (No AI Provider Configured)
Overall score: ${scoreData.overallScore}/100 (${scoreData.grade}).
Flags: ${scoreData.qualityFlags.join(', ')}`,
      company: job.company,
      role: job.title,
      score: (scoreData.overallScore / 20).toFixed(1),
      archetype: 'Engineering',
      legitimacy: scoreData.riskScore > 30 ? 'Proceed with Caution' : 'High Confidence'
    });
  }

  try {
    const aiConfig = { ...provider, type: provider.type as any } as any;
    const response = await callAI(aiConfig, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `JOB DESCRIPTION TO EVALUATE:\n\nTitle: ${job.title}\nCompany: ${job.company}\nDescription:\n${job.description || ''}` }
    ]);

    const summaryMatch = response.text.match(/---SCORE_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/);
    let company = job.company;
    let role = job.title;
    let score = '3.0';
    let archetype = 'Engineering';
    let legitimacy = 'High Confidence';

    if (summaryMatch) {
      const block = summaryMatch[1];
      const extract = (key: string) => {
        const prefix = `${key}:`;
        const lines = block.split('\n');
        for (const line of lines) {
          const trimmed = line.trimStart();
          if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length).trim();
        }
        return '';
      };
      company = extract('COMPANY') || company;
      role = extract('ROLE') || role;
      score = extract('SCORE') || score;
      archetype = extract('ARCHETYPE') || archetype;
      legitimacy = extract('LEGITIMACY') || legitimacy;
    }

    const numericScore = parseFloat(score);
    const overallScore = isNaN(numericScore) ? 60 : Math.round(numericScore * 20);

    db.update(schema.jobs).set({
      overallScore,
      grade: overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B+' : overallScore >= 60 ? 'B' : 'C',
      scoringDetails: JSON.stringify({ evaluationText: response.text, archetype, legitimacy }),
      updatedAt: now()
    }).where(eq(schema.jobs.id, job.id)).run();

    return c.json({
      evaluationText: response.text,
      company,
      role,
      score,
      archetype,
      legitimacy
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/ai/career-switch', async (c) => {
  const b = await c.req.json();
  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];

  if (!provider) {
    // FALLBACK
    const transferable = (b.transferableSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const missing = (b.missingSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    return c.json({
      switchScore: Math.min(100, 45 + transferable.length * 7),
      transitionReadiness: transferable.length > 0 ? Math.round((transferable.length / (transferable.length + missing.length || 1)) * 100) : 40,
      bridgeRolePotential: Math.min(100, 50 + transferable.length * 5),
      transferable,
      missing,
      recommendations: [
        `Learn missing competencies: ${missing.slice(0, 3).join(', ')}.`,
        'Highlight your transferable skills prominently at the top of your resume.',
        'Target bridge roles in adjacent domains to gain practical exposure.'
      ],
      plan7Day: ['Tailor resume/LinkedIn headline to emphasize transferable skills', 'Connect with 3 industry peers', 'Draft career change cover letter', 'Learn the basics of 1 missing skill'],
      plan30Day: ['Complete an introductory online course', 'Build a starter project using target skills', 'Apply to 5 transition positions', 'Read 2 industry case studies'],
      plan90Day: ['Build a complex portfolio piece', 'Do 2 mock interviews with target role questions', 'Apply to 15 roles', 'Contribute to open source projects']
    });
  }

  const prompt = `You are a professional career coach. Create a transition plan from "${b.currentRole}" to "${b.targetRole}".
Transferable Skills: ${b.transferableSkills}
Missing Skills to Learn: ${b.missingSkills}
Motivation: ${b.motivation || 'N/A'}
Timeline: ${b.timeline || '6'} months

Return a valid JSON object with the following fields:
- switchScore: number (0-100 score of switch compatibility)
- transitionReadiness: number (0-100 percentage based on skills matches)
- bridgeRolePotential: number (0-100 score indicating if candidate needs a bridge role first)
- transferable: string[] (parsed list of transferable skills)
- missing: string[] (parsed list of skills to acquire)
- recommendations: string[] (3 bullet points of career switch recommendations)
- plan7Day: string[] (4 items of action plan)
- plan30Day: string[] (4 items of action plan)
- plan90Day: string[] (4 items of action plan)

Ensure the output is ONLY valid JSON. Do not write any conversational intro or markdown blocks.`;

  try {
    const aiConfig = { ...provider, type: provider.type as any } as any;
    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    const parsed = parseAIResponse(response.text);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: 'AI generation failed: ' + err.message }, 500);
  }
});

app.post('/api/ai/interview-prep', async (c) => {
  const b = await c.req.json();
  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];
  const interviewLogic = getPromptTemplate('interview-prep.md');

  if (!provider) {
    // FALLBACK
    return c.json({
      hrQuestions: [
        'Why do you want to work at ' + b.company + '?',
        'Walk me through a difficult engineering challenge you solved.',
        'What are your expected salary components?',
        'How do you manage deadlines and stress?'
      ],
      roleQuestions: [
        'Explain the core architecture of your last project.',
        'How do you write test cases to ensure reliability?',
        'How would you handle service failures in production?',
        'What design pattern matches a pub-sub requirement?'
      ],
      salaryQuestions: ['What is your expected CTC?', 'Are you open to negotiation on offered components?'],
      switchQuestions: ['Why are you transitioning roles?', 'How will your previous experience translate?'],
      noticePeriodQuestions: ['What is your notice period?', 'Can it be negotiated or bought out?']
    });
  }

  const prompt = `You are career-ops, an AI-powered interviewer. 
Your interviewing guidelines are defined here:
${interviewLogic}

Generate a targeted set of interview questions and tips for: "${b.jobTitle}" at "${b.company}".
Return a valid JSON object with the following fields:
- hrQuestions: string[] (4 behavioral questions)
- roleQuestions: string[] (5 role-specific or technical questions)
- salaryQuestions: string[] (2 salary discussion/negotiation questions)
- switchQuestions: string[] (3 questions addressing domain changes if any)
- noticePeriodQuestions: string[] (2 questions regarding notice period and availability)

Return ONLY the valid JSON block. No descriptions or markdown code blocks.`;

  try {
    const aiConfig = { ...provider, type: provider.type as any } as any;
    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    const parsed = parseAIResponse(response.text);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: 'AI generation failed: ' + err.message }, 500);
  }
});

app.post('/api/ai/skill-gap', async (c) => {
  const b = await c.req.json();
  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];

  if (!provider) {
    // FALLBACK
    const current = (b.currentSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const required = (b.requiredSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const transferable = current.filter((s: string) => required.some(r => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase())));
    const missing = required.filter((r: string) => !current.some(s => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase())));

    return c.json({
      transferableSkills: transferable,
      missingSkills: missing,
      shouldApplyNow: missing.length <= 2,
      recommendation: missing.length === 0 ? 'No gap found.' : missing.length <= 2 ? 'Minor gap — apply now.' : 'Significant gap — learn first.',
      plan7Day: missing.slice(0, 2).map((s: string) => `Learn basics of ${s}`),
      plan30Day: missing.slice(0, 3).map((s: string) => `Build simple projects using ${s}`),
      plan90Day: missing.map((s: string) => `Acquire course certifications in ${s}`)
    });
  }

  const prompt = `Analyze the skill gap for the target role: "${b.targetRole}".
Current Skills: ${b.currentSkills}
Required Skills: ${b.requiredSkills}

Return a valid JSON object containing:
- transferableSkills: string[] (overlapping skills)
- missingSkills: string[] (skills to develop)
- shouldApplyNow: boolean (true if gaps are manageable)
- recommendation: string (curriculum advice)
- plan7Day: string[] (3 learning roadmap goals for the first week)
- plan30Day: string[] (3 goals for the first month)
- plan90Day: string[] (3 goals for the first 3 months)

Return ONLY valid JSON. No conversational introductions.`;

  try {
    const aiConfig = { ...provider, type: provider.type as any } as any;
    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    const parsed = parseAIResponse(response.text);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: 'AI generation failed: ' + err.message }, 500);
  }
});

/* ─── Interview Prep ─── */
app.get('/api/interview-preps', (c) => {
  const result = db.select().from(schema.interviewPreps).orderBy(desc(schema.interviewPreps.createdAt)).all();
  return c.json(result);
});

app.post('/api/interview-preps', async (c) => {
  const b = await c.req.json();
  const id = randomUUID();
  db.insert(schema.interviewPreps).values({
    id,
    applicationId: b.applicationId || null,
    profileId: b.profileId || null,
    jobTitle: b.jobTitle,
    company: b.company,
    hrQuestions: JSON.stringify(b.hrQuestions || []),
    roleQuestions: JSON.stringify(b.roleQuestions || []),
    salaryQuestions: JSON.stringify(b.salaryQuestions || []),
    switchQuestions: JSON.stringify(b.switchQuestions || []),
    noticePeriodQuestions: JSON.stringify(b.noticePeriodQuestions || []),
    suggestedAnswers: JSON.stringify(b.suggestedAnswers || {}),
    notes: b.notes || null,
    createdAt: now(),
    updatedAt: now()
  }).run();

  logAudit('interview_prep_created', 'interview_preps', id);
  return c.json({ id, success: true });
});

/* ─── Skill Gap Plans ─── */
app.get('/api/skill-gap-plans', (c) => {
  const result = db.select().from(schema.skillGapPlans).orderBy(desc(schema.skillGapPlans.createdAt)).all();
  return c.json(result);
});

app.post('/api/skill-gap-plans', async (c) => {
  const b = await c.req.json();
  const id = randomUUID();
  db.insert(schema.skillGapPlans).values({
    id,
    profileId: b.profileId || null,
    rolePackId: b.rolePackId || null,
    targetRole: b.targetRole || null,
    transferableSkills: JSON.stringify(b.transferableSkills || []),
    missingSkills: JSON.stringify(b.missingSkills || []),
    evidenceGaps: JSON.stringify(b.evidenceGaps || []),
    projectGaps: JSON.stringify(b.projectGaps || []),
    certificationGaps: JSON.stringify(b.certificationGaps || []),
    plan7Day: JSON.stringify(b.plan7Day || []),
    plan30Day: JSON.stringify(b.plan30Day || []),
    plan90Day: JSON.stringify(b.plan90Day || []),
    shouldApplyNow: !!b.shouldApplyNow,
    recommendation: b.recommendation || null,
    createdAt: now(),
    updatedAt: now()
  }).run();

  logAudit('skill_gap_created', 'skill_gap_plans', id);
  return c.json({ id, success: true });
});

/* ─── Job Sources ─── */
app.get('/api/job-sources', (c) => {
  const result = db.select().from(schema.jobSources).orderBy(schema.jobSources.sortOrder).all();
  return c.json(result);
});

app.post('/api/job-sources', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  const values = {
    id,
    name: b.name,
    type: b.type || 'portal',
    baseUrl: b.baseUrl || null,
    enabled: b.enabled !== false,
    priority: b.priority !== undefined ? parseInt(b.priority) : 5,
    scanSchedule: b.scanSchedule || null,
    lastScanAt: b.lastScanAt || null,
    filters: JSON.stringify(b.filters || {}),
    dedupRules: JSON.stringify(b.dedupRules || {}),
    rateLimit: b.rateLimit !== undefined ? parseInt(b.rateLimit) : null,
    sortOrder: b.sortOrder !== undefined ? parseInt(b.sortOrder) : 0,
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.jobSources).where(eq(schema.jobSources.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.jobSources).set(values).where(eq(schema.jobSources.id, id)).run();
  } else {
    db.insert(schema.jobSources).values(values).run();
  }

  logAudit(exists ? 'job_source_updated' : 'job_source_created', 'job_sources', id);
  return c.json({ id, success: true });
});

/* ─── Audit Log ─── */
app.get('/api/audit-log', (c) => {
  const { limit } = c.req.query();
  const result = db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.timestamp)).limit(parseInt(limit || '100')).all();
  return c.json(result);
});

/* ─── Backups ─── */
app.post('/api/backup', async (c) => {
  const backupDir = './data/backups';
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  const backupPath = resolve(backupDir, filename);

  try {
    const data = readFileSync(DB_PATH);
    writeFileSync(backupPath, data);
    const size = data.length;

    db.insert(schema.backups).values({
      id: randomUUID(),
      filename,
      size,
      path: backupPath,
      type: 'full',
      status: 'completed',
      createdAt: now()
    }).run();

    logAudit('backup_created', 'backup', filename, { size });
    return c.json({ success: true, filename, size });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/backups', (c) => {
  const result = db.select().from(schema.backups).orderBy(desc(schema.backups.createdAt)).all();
  return c.json(result);
});

/* ─── Static Location APIs ─── */
app.get('/api/locations/states', (c) => c.json(STATES));

app.get('/api/locations/cities', (c) => {
  const { search, stateCode } = c.req.query();
  if (search) {
    const q = search.toLowerCase();
    const matches = CITIES.filter(city => city.name.toLowerCase().includes(q) || city.district.toLowerCase().includes(q));
    return c.json(matches.slice(0, 20));
  }
  if (stateCode) {
    return c.json(CITIES.filter(city => city.stateCode === stateCode));
  }
  return c.json(CITIES);
});

app.get('/api/locations/regions', (c) => c.json(REGION_GROUPS));

app.get('/api/locations/work-modes', (c) => c.json({
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site / WFO',
  wfh: 'Work from Home',
  india_remote: 'Remote (India)',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
  walk_in: 'Walk-in',
  field_role: 'Field Role',
  part_time: 'Part-time',
  full_time: 'Full-time',
}));

/* ─── Analytics ─── */
app.get('/api/analytics', (c) => {
  try {
    const allJobs = db.select().from(schema.jobs).all();
    const allApps = db.select().from(schema.applications).all();

    const statusMap: Record<string, number> = {};
    for (const app of allApps) {
      statusMap[app.status] = (statusMap[app.status] || 0) + 1;
    }
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    const scoredJobs = allJobs.filter(j => j.overallScore !== null && j.overallScore !== undefined);
    const avgScore = scoredJobs.length > 0 ? scoredJobs.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / scoredJobs.length : 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const jobsThisWeek = allJobs.filter(j => j.createdAt >= sevenDaysAgo).length;

    const companyMap: Record<string, number> = {};
    for (const j of allJobs) {
      if (j.company) companyMap[j.company] = (companyMap[j.company] || 0) + 1;
    }
    const topCompanies = Object.entries(companyMap)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return c.json({
      totalJobs: allJobs.length,
      totalApplications: allApps.length,
      statusBreakdown,
      averageScore: avgScore,
      jobsThisWeek,
      topCompanies
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/* ─── Status list ─── */
app.get('/api/statuses', (c) => c.json([
  { id: 'discovered', label: 'Discovered', color: '#64748b' },
  { id: 'saved', label: 'Saved', color: '#6366f1' },
  { id: 'shortlisted', label: 'Shortlisted', color: '#8b5cf6' },
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'interview_scheduled', label: 'Interview Scheduled', color: '#f97316' },
  { id: 'offer_received', label: 'Offer Received', color: '#22c55e' },
  { id: 'accepted', label: 'Accepted', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' },
]));

/* ─── Start server ─── */
const port = parseInt(process.env.PORT || '3000');
serve({ fetch: app.fetch, port });
console.log(`🚀 Career-Ops India API running on http://localhost:${port}`);
