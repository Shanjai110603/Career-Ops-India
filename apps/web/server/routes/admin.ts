import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { schema, syncMarkdownWithDatabase } from '@career-ops/db';
import { testConnection } from '@career-ops/ai';
import { db, now, logAudit, recalculateAllJobs } from '../helpers.js';

export const adminRouter = new Hono();

const DB_PATH = resolve('./data/career-ops.db');

adminRouter.get('/api/profiles', (c) => {
  const result = db.select().from(schema.profiles).where(eq(schema.profiles.isActive, true)).orderBy(desc(schema.profiles.updatedAt)).all();
  return c.json(result);
});

adminRouter.post('/api/profiles', async (c) => {
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

adminRouter.get('/api/role-packs', (c) => {
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

adminRouter.post('/api/role-packs', async (c) => {
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

adminRouter.get('/api/ai-providers', (c) => {
  const providers = db.select().from(schema.aiProviders).orderBy(schema.aiProviders.sortOrder).all();
  return c.json(providers.map(p => ({ ...p, api_key: p.apiKey ? '••••••' + String(p.apiKey).slice(-4) : null })));
});

adminRouter.post('/api/ai-providers', async (c) => {
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

adminRouter.post('/api/ai-providers/:id/test', async (c) => {
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

adminRouter.delete('/api/ai-providers/:id', (c) => {
  const id = c.req.param('id');
  db.delete(schema.aiProviders).where(eq(schema.aiProviders.id, id)).run();
  logAudit('ai_provider_deleted', 'ai_providers', id);
  return c.json({ success: true });
});

adminRouter.get('/api/settings', (c) => {
  const { category } = c.req.query();
  const query = db.select().from(schema.settings);
  const result = category ? query.where(eq(schema.settings.category, category)).all() : query.all();
  return c.json(result);
});

adminRouter.put('/api/settings', async (c) => {
  const b = await c.req.json();
  db.update(schema.settings).set({
    value: String(b.value),
    updatedAt: now()
  }).where(eq(schema.settings.key, b.key)).run();

  logAudit('settings_update', 'settings', b.key, { value: b.value });
  return c.json({ success: true });
});

adminRouter.get('/api/job-sources', (c) => {
  const result = db.select().from(schema.jobSources).orderBy(schema.jobSources.sortOrder).all();
  return c.json(result);
});

adminRouter.post('/api/job-sources', async (c) => {
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

adminRouter.get('/api/audit-log', (c) => {
  const { limit } = c.req.query();
  const result = db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.timestamp)).limit(parseInt(limit || '100')).all();
  return c.json(result);
});

adminRouter.post('/api/backup', async (c) => {
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

adminRouter.get('/api/backups', (c) => {
  const result = db.select().from(schema.backups).orderBy(desc(schema.backups.createdAt)).all();
  return c.json(result);
});

adminRouter.post('/api/sync', async (c) => {
  try {
    await syncMarkdownWithDatabase();
    return c.json({ success: true, message: 'Sync completed successfully!' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

adminRouter.get('/api/analytics', (c) => {
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
