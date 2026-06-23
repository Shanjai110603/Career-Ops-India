/* =========================================================================
 * Career-Ops India — Hono API Server
 * Full REST API — using sql.js (WASM SQLite, zero native deps)
 * ========================================================================= */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const app = new Hono();
app.use('*', cors());

const now = () => new Date().toISOString();
const DB_PATH = resolve('./data/career-ops.db');

// ─── sql.js Database Init ───
let db;

async function initDb() {
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs();

  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create all tables
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT,
      location TEXT, state_code TEXT, experience_years REAL DEFAULT 0,
      current_role TEXT, target_roles TEXT, skills TEXT, education TEXT,
      summary TEXT, linkedin_url TEXT, portfolio_url TEXT, github_url TEXT,
      preferred_work_modes TEXT, preferred_locations TEXT,
      salary_expectation_lpa REAL, notice_period_days INTEGER,
      is_career_switching INTEGER DEFAULT 0, switch_from_role TEXT,
      switch_to_role TEXT, switch_mode TEXT, role_pack_ids TEXT,
      is_active INTEGER DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS role_packs (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, family TEXT NOT NULL,
      description TEXT, keywords TEXT NOT NULL, exclude_keywords TEXT,
      synonyms TEXT, alternative_titles TEXT, skills TEXT, salary_range TEXT,
      preferred_work_modes TEXT, interview_topics TEXT, resume_strategy TEXT,
      enabled INTEGER DEFAULT 1, is_custom INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, company TEXT NOT NULL,
      description TEXT, location TEXT, state_code TEXT, city TEXT,
      work_mode TEXT, salary_text TEXT, salary_min_lpa REAL,
      salary_max_lpa REAL, salary_disclosed INTEGER DEFAULT 0,
      experience_min REAL, experience_max REAL, source TEXT,
      source_url TEXT, posted_date TEXT, posted_days_ago INTEGER,
      company_url TEXT, company_verified INTEGER DEFAULT 0,
      role_pack_id TEXT, normalized_title TEXT, fingerprint TEXT,
      has_bond INTEGER DEFAULT 0, bond_years INTEGER,
      is_consultancy INTEGER DEFAULT 0, has_vague_description INTEGER DEFAULT 0,
      quality_flags TEXT, fit_score REAL, risk_score REAL,
      overall_score REAL, grade TEXT, scoring_details TEXT,
      tags TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY, job_id TEXT, profile_id TEXT,
      status TEXT NOT NULL DEFAULT 'discovered', company TEXT NOT NULL,
      job_title TEXT NOT NULL, source TEXT, location TEXT, work_mode TEXT,
      salary_text TEXT, role_pack_id TEXT, fit_score REAL, risk_score REAL,
      switch_score REAL, notes TEXT, recruiter_contact TEXT,
      next_action TEXT, follow_up_date TEXT, applied_date TEXT,
      resume_version_id TEXT, tags TEXT, attachments TEXT, timeline TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY, profile_id TEXT, name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'master', role_pack_id TEXT,
      target_job_id TEXT, sections TEXT NOT NULL, template TEXT DEFAULT 'modern',
      format TEXT DEFAULT 'one_page', pdf_path TEXT,
      is_active INTEGER DEFAULT 1, version INTEGER DEFAULT 1,
      parent_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_providers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
      base_url TEXT, api_key TEXT, default_model TEXT, fallback_model TEXT,
      temperature REAL DEFAULT 0.7, max_tokens INTEGER,
      timeout INTEGER DEFAULT 30000, retries INTEGER DEFAULT 2,
      streaming INTEGER DEFAULT 0, vision INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_task_assignments (
      id TEXT PRIMARY KEY, task_type TEXT NOT NULL, provider_id TEXT,
      model TEXT, temperature REAL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS interview_preps (
      id TEXT PRIMARY KEY, application_id TEXT, profile_id TEXT,
      job_title TEXT NOT NULL, company TEXT NOT NULL,
      hr_questions TEXT, role_questions TEXT, experience_questions TEXT,
      switch_questions TEXT, salary_questions TEXT, relocation_questions TEXT,
      notice_period_questions TEXT, suggested_answers TEXT, notes TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS skill_gap_plans (
      id TEXT PRIMARY KEY, profile_id TEXT, role_pack_id TEXT,
      target_role TEXT, transferable_skills TEXT, missing_skills TEXT,
      evidence_gaps TEXT, project_gaps TEXT, certification_gaps TEXT,
      plan_7_day TEXT, plan_30_day TEXT, plan_90_day TEXT,
      should_apply_now INTEGER, recommendation TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general', label TEXT,
      description TEXT, type TEXT DEFAULT 'string',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY, action TEXT NOT NULL, entity_type TEXT,
      entity_id TEXT, details TEXT, user_id TEXT,
      ip_address TEXT, timestamp TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS job_sources (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
      base_url TEXT, enabled INTEGER DEFAULT 1, priority INTEGER DEFAULT 5,
      scan_schedule TEXT, last_scan_at TEXT, filters TEXT,
      dedup_rules TEXT, rate_limit INTEGER, sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY, filename TEXT NOT NULL, size INTEGER,
      path TEXT NOT NULL, type TEXT DEFAULT 'full',
      status TEXT DEFAULT 'completed', created_at TEXT NOT NULL
    );
  `);

  // Indexes
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
    CREATE INDEX IF NOT EXISTS idx_jobs_fingerprint ON jobs(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
  `);

  // Seed default settings
  const defaults = [
    ['deployment_mode', 'local', 'deployment', 'Deployment Mode', 'How the app is deployed', 'string'],
    ['database_provider', 'sqlite', 'database', 'Database Provider', 'Database backend to use', 'string'],
    ['default_timezone', 'Asia/Kolkata', 'workspace', 'Default Timezone', 'Default timezone for the app', 'string'],
    ['date_format', 'DD/MM/YYYY', 'workspace', 'Date Format', 'Date display format', 'string'],
    ['currency', 'INR', 'workspace', 'Currency', 'Default currency', 'string'],
    ['enable_ai', 'true', 'features', 'Enable AI', 'Enable AI-powered features', 'boolean'],
    ['enable_scanner', 'true', 'features', 'Enable Scanner', 'Enable job portal scanning', 'boolean'],
    ['session_timeout', '3600', 'security', 'Session Timeout', 'Session timeout in seconds', 'number'],
    ['audit_logging', 'true', 'security', 'Audit Logging', 'Enable audit logging', 'boolean'],
    ['pii_redaction', 'false', 'security', 'PII Redaction', 'Redact PII in AI calls', 'boolean'],
    ['backup_schedule', 'daily', 'workspace', 'Backup Schedule', 'Auto backup schedule', 'string'],
    ['workspace_name', 'Career-Ops India', 'workspace', 'Workspace Name', 'Name of this workspace', 'string'],
  ];
  for (const [key, value, category, label, description, type] of defaults) {
    db.run('INSERT OR IGNORE INTO settings (key, value, category, label, description, type, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [key, value, category, label, description, type, now()]);
  }

  saveDb();
  console.log('✅ Database initialized');
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

// Helper: run query and return rows as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function logAudit(action, entityType, entityId, details) {
  try {
    db.run('INSERT INTO audit_log (id, action, entity_type, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), action, entityType, entityId, details ? JSON.stringify(details) : null, now()]);
    saveDb();
  } catch { /* non-critical */ }
}

/* ─── Health ─── */
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: now(), version: '1.0.0' }));

/* ─── Profiles ─── */
app.get('/api/profiles', (c) => c.json(queryAll('SELECT * FROM profiles WHERE is_active = 1 ORDER BY updated_at DESC')));

app.post('/api/profiles', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  runSql(`INSERT OR REPLACE INTO profiles (id, name, email, phone, location, state_code, experience_years, current_role, target_roles, skills, education, summary, linkedin_url, portfolio_url, github_url, preferred_work_modes, preferred_locations, salary_expectation_lpa, notice_period_days, is_career_switching, switch_from_role, switch_to_role, switch_mode, role_pack_ids, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [id, b.name||'', b.email||null, b.phone||null, b.location||null, b.stateCode||null, b.experienceYears||0, b.currentRole||null, JSON.stringify(b.targetRoles||[]), JSON.stringify(b.skills||[]), JSON.stringify(b.education||{}), b.summary||null, b.linkedinUrl||null, b.portfolioUrl||null, b.githubUrl||null, JSON.stringify(b.preferredWorkModes||[]), JSON.stringify(b.preferredLocations||[]), b.salaryExpectationLPA||null, b.noticePeriodDays||null, b.isCareerSwitching?1:0, b.switchFromRole||null, b.switchToRole||null, b.switchMode||null, JSON.stringify(b.rolePackIds||[]), b.createdAt||now(), now()]);
  return c.json({ id, success: true });
});

/* ─── Jobs ─── */
app.get('/api/jobs', (c) => {
  const { search, location, workMode, minSalary, maxSalary, sort, limit } = c.req.query();
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (location) { sql += ' AND (location LIKE ? OR city LIKE ? OR state_code = ?)'; params.push(`%${location}%`, `%${location}%`, location); }
  if (workMode) { sql += ' AND work_mode = ?'; params.push(workMode); }
  if (minSalary) { sql += ' AND salary_min_lpa >= ?'; params.push(parseFloat(minSalary)); }
  if (maxSalary) { sql += ' AND salary_max_lpa <= ?'; params.push(parseFloat(maxSalary)); }
  sql += ` ORDER BY ${sort === 'score' ? 'overall_score DESC' : 'created_at DESC'} LIMIT ?`;
  params.push(parseInt(limit || '50'));
  return c.json(queryAll(sql, params));
});

app.post('/api/jobs', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  runSql(`INSERT OR REPLACE INTO jobs (id, title, company, description, location, state_code, city, work_mode, salary_text, salary_min_lpa, salary_max_lpa, salary_disclosed, experience_min, experience_max, source, source_url, posted_date, posted_days_ago, company_url, company_verified, role_pack_id, normalized_title, fingerprint, has_bond, bond_years, is_consultancy, has_vague_description, quality_flags, fit_score, risk_score, overall_score, grade, scoring_details, tags, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.title, b.company, b.description||null, b.location||null, b.stateCode||null, b.city||null, b.workMode||null, b.salaryText||null, b.salaryMinLPA||null, b.salaryMaxLPA||null, b.salaryDisclosed?1:0, b.experienceMin||null, b.experienceMax||null, b.source||'manual', b.sourceUrl||null, b.postedDate||null, b.postedDaysAgo||null, b.companyUrl||null, b.companyVerified?1:0, b.rolePackId||null, null, null, b.hasBond?1:0, b.bondYears||null, b.isConsultancy?1:0, (b.description && b.description.length<100)?1:0, JSON.stringify([]), b.fitScore||null, null, b.overallScore||null, b.grade||null, null, JSON.stringify(b.tags||[]), b.createdAt||now(), now()]);
  return c.json({ id, success: true });
});

app.get('/api/jobs/:id', (c) => {
  const job = queryOne('SELECT * FROM jobs WHERE id = ?', [c.req.param('id')]);
  if (!job) return c.json({ error: 'Not found' }, 404);
  return c.json(job);
});

app.delete('/api/jobs/:id', (c) => {
  runSql('DELETE FROM jobs WHERE id = ?', [c.req.param('id')]);
  return c.json({ success: true });
});

/* ─── Applications ─── */
app.get('/api/applications', (c) => {
  const { status, profileId } = c.req.query();
  let sql = 'SELECT * FROM applications WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (profileId) { sql += ' AND profile_id = ?'; params.push(profileId); }
  sql += ' ORDER BY updated_at DESC';
  return c.json(queryAll(sql, params));
});

app.post('/api/applications', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  runSql(`INSERT OR REPLACE INTO applications (id, job_id, profile_id, status, company, job_title, source, location, work_mode, salary_text, role_pack_id, fit_score, risk_score, switch_score, notes, recruiter_contact, next_action, follow_up_date, applied_date, resume_version_id, tags, attachments, timeline, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.jobId||null, b.profileId||null, b.status||'discovered', b.company, b.jobTitle, b.source||null, b.location||null, b.workMode||null, b.salaryText||null, b.rolePackId||null, b.fitScore||null, b.riskScore||null, b.switchScore||null, b.notes||null, b.recruiterContact||null, b.nextAction||null, b.followUpDate||null, b.appliedDate||null, b.resumeVersionId||null, JSON.stringify(b.tags||[]), JSON.stringify(b.attachments||[]), JSON.stringify(b.timeline||[{date:now(),event:'Created',notes:''}]), b.createdAt||now(), now()]);
  return c.json({ id, success: true });
});

app.put('/api/applications/:id', async (c) => {
  const b = await c.req.json();
  const id = c.req.param('id');
  const updates = [];
  const params = [];
  for (const [key, value] of Object.entries(b)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (['id', 'created_at'].includes(col)) continue;
    updates.push(`${col} = ?`);
    params.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
  }
  updates.push('updated_at = ?');
  params.push(now());
  params.push(id);
  if (updates.length > 1) runSql(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`, params);
  return c.json({ id, success: true });
});

/* ─── Resumes ─── */
app.get('/api/resumes', (c) => c.json(queryAll('SELECT * FROM resumes WHERE is_active = 1 ORDER BY updated_at DESC')));

app.post('/api/resumes', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  runSql(`INSERT OR REPLACE INTO resumes (id, profile_id, name, type, role_pack_id, target_job_id, sections, template, format, pdf_path, is_active, version, parent_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?,?,?)`,
    [id, b.profileId||null, b.name, b.type||'master', b.rolePackId||null, b.targetJobId||null, JSON.stringify(b.sections||{}), b.template||'modern', b.format||'one_page', b.pdfPath||null, b.version||1, b.parentId||null, b.createdAt||now(), now()]);
  return c.json({ id, success: true });
});

/* ─── Role Packs ─── */
app.get('/api/role-packs', (c) => {
  const custom = queryAll('SELECT * FROM role_packs ORDER BY sort_order ASC');
  // Built-in role packs (hardcoded for zero-dependency operation)
  const builtIn = [
    { id:'software-engineer', name:'Software Engineer', family:'engineering', description:'Software development roles', keywords:JSON.stringify(['software','developer','engineer','programmer','full stack','backend','frontend','sde','swe']), skills:JSON.stringify(['JavaScript','Python','Java','React','Node.js','SQL','Git']), interview_topics:JSON.stringify(['Data Structures','System Design','OOP']), resume_strategy:'Highlight projects and quantified impact.', enabled:1, is_custom:0 },
    { id:'data-analyst', name:'Data Analyst', family:'data', description:'Data analysis, BI, reporting', keywords:JSON.stringify(['data analyst','business analyst','bi analyst','mis','analytics']), skills:JSON.stringify(['Excel','SQL','Python','Power BI','Tableau']), interview_topics:JSON.stringify(['SQL Queries','Statistics','Data Visualization']), resume_strategy:'Show data projects with measurable outcomes.', enabled:1, is_custom:0 },
    { id:'product-manager', name:'Product Manager', family:'product', description:'Product management roles', keywords:JSON.stringify(['product manager','product owner','program manager','apm']), skills:JSON.stringify(['Product Strategy','User Research','Agile','SQL','Analytics']), interview_topics:JSON.stringify(['Product Sense','Metrics','Prioritization']), resume_strategy:'Focus on product metrics and user impact.', enabled:1, is_custom:0 },
    { id:'sales-bde', name:'Sales / BDE', family:'sales', description:'Sales, business development', keywords:JSON.stringify(['sales','business development','bde','account manager','bdm']), skills:JSON.stringify(['Negotiation','CRM','Cold Calling','Lead Generation']), interview_topics:JSON.stringify(['Sales Process','Target Achievement']), resume_strategy:'Highlight revenue numbers and target achievement.', enabled:1, is_custom:0 },
    { id:'customer-support', name:'Customer Support', family:'support', description:'Customer support and service', keywords:JSON.stringify(['customer support','customer service','help desk','customer care']), skills:JSON.stringify(['Communication','Ticketing','Problem Solving','Zendesk']), interview_topics:JSON.stringify(['Conflict Resolution','SLA Management']), resume_strategy:'Show CSAT scores and resolution rates.', enabled:1, is_custom:0 },
    { id:'hr-recruiter', name:'HR / Recruiter', family:'hr', description:'HR and talent acquisition', keywords:JSON.stringify(['hr','human resources','recruiter','talent acquisition']), skills:JSON.stringify(['Recruitment','HRIS','Employee Relations','Compliance']), interview_topics:JSON.stringify(['Recruitment Process','Labor Laws']), resume_strategy:'Show hiring metrics and engagement initiatives.', enabled:1, is_custom:0 },
    { id:'operations', name:'Operations / Admin', family:'operations', description:'Operations and admin', keywords:JSON.stringify(['operations','admin','coordination','process']), skills:JSON.stringify(['Process Management','Excel','Coordination','Vendor Management']), interview_topics:JSON.stringify(['Process Improvement','Vendor Management']), resume_strategy:'Show process improvements and cost savings.', enabled:1, is_custom:0 },
    { id:'finance-accounts', name:'Finance / Accounts', family:'finance', description:'Finance and accounting', keywords:JSON.stringify(['finance','accounts','accounting','audit','taxation','ca']), skills:JSON.stringify(['Tally','SAP','Excel','GST','Income Tax']), interview_topics:JSON.stringify(['Accounting Principles','GST','Financial Statements']), resume_strategy:'Highlight certifications and compliance track record.', enabled:1, is_custom:0 },
    { id:'qa-testing', name:'QA / Testing', family:'quality', description:'Quality assurance and testing', keywords:JSON.stringify(['qa','testing','quality assurance','sdet','automation']), skills:JSON.stringify(['Selenium','Cypress','JUnit','Postman','JIRA']), interview_topics:JSON.stringify(['Test Strategies','Automation Frameworks']), resume_strategy:'Show test coverage and automation ROI.', enabled:1, is_custom:0 },
    { id:'marketing', name:'Marketing', family:'marketing', description:'Digital and content marketing', keywords:JSON.stringify(['marketing','digital marketing','seo','social media','content']), skills:JSON.stringify(['SEO','Google Ads','Social Media','Analytics','Copywriting']), interview_topics:JSON.stringify(['Campaign Strategy','ROI Measurement']), resume_strategy:'Show campaign results with metrics.', enabled:1, is_custom:0 },
    { id:'devops-cloud', name:'DevOps / Cloud', family:'infrastructure', description:'DevOps and cloud engineering', keywords:JSON.stringify(['devops','cloud','sre','aws','azure','kubernetes']), skills:JSON.stringify(['AWS','Docker','Kubernetes','CI/CD','Terraform','Linux']), interview_topics:JSON.stringify(['CI/CD Pipelines','Cloud Architecture']), resume_strategy:'Show infrastructure scale and uptime improvements.', enabled:1, is_custom:0 },
    { id:'design-ux', name:'UI/UX Design', family:'design', description:'UI and UX design', keywords:JSON.stringify(['ui','ux','design','product design','figma']), skills:JSON.stringify(['Figma','Sketch','User Research','Prototyping','Design Systems']), interview_topics:JSON.stringify(['Design Process','Usability Testing']), resume_strategy:'Include portfolio link prominently.', enabled:1, is_custom:0 },
  ];
  return c.json([...builtIn, ...custom]);
});

app.post('/api/role-packs', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  runSql(`INSERT OR REPLACE INTO role_packs (id, name, family, description, keywords, exclude_keywords, synonyms, alternative_titles, skills, salary_range, preferred_work_modes, interview_topics, resume_strategy, enabled, is_custom, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)`,
    [id, b.name, b.family||'custom', b.description||null, JSON.stringify(b.keywords||[]), JSON.stringify(b.excludeKeywords||[]), JSON.stringify(b.synonyms||[]), JSON.stringify(b.alternativeTitles||[]), JSON.stringify(b.skills||[]), JSON.stringify(b.salaryRange||{}), JSON.stringify(b.preferredWorkModes||[]), JSON.stringify(b.interviewTopics||[]), b.resumeStrategy||null, b.enabled!==false?1:0, b.sortOrder||0, b.createdAt||now(), now()]);
  return c.json({ id, success: true });
});

/* ─── AI Providers ─── */
app.get('/api/ai-providers', (c) => {
  const providers = queryAll('SELECT * FROM ai_providers ORDER BY sort_order ASC');
  return c.json(providers.map(p => ({ ...p, api_key: p.api_key ? '••••••' + String(p.api_key).slice(-4) : null })));
});

app.post('/api/ai-providers', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  runSql(`INSERT OR REPLACE INTO ai_providers (id, name, type, base_url, api_key, default_model, fallback_model, temperature, max_tokens, timeout, retries, streaming, vision, enabled, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.name, b.type, b.baseUrl||null, b.apiKey||null, b.defaultModel||null, b.fallbackModel||null, b.temperature??0.7, b.maxTokens||null, b.timeout||30000, b.retries||2, b.streaming?1:0, b.vision?1:0, b.enabled!==false?1:0, b.sortOrder||0, b.createdAt||now(), now()]);
  return c.json({ id, success: true });
});

app.post('/api/ai-providers/:id/test', async (c) => {
  const provider = queryOne('SELECT * FROM ai_providers WHERE id = ?', [c.req.param('id')]);
  if (!provider) return c.json({ success: false, message: 'Provider not found' }, 404);
  return c.json({ success: true, message: `Provider "${provider.name}" configuration saved. Test AI calls from the features that use them.`, latencyMs: 0 });
});

app.delete('/api/ai-providers/:id', (c) => {
  runSql('DELETE FROM ai_providers WHERE id = ?', [c.req.param('id')]);
  return c.json({ success: true });
});

/* ─── Settings ─── */
app.get('/api/settings', (c) => {
  const { category } = c.req.query();
  if (category) return c.json(queryAll('SELECT * FROM settings WHERE category = ?', [category]));
  return c.json(queryAll('SELECT * FROM settings'));
});

app.put('/api/settings', async (c) => {
  const b = await c.req.json();
  runSql('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?', [b.value, now(), b.key]);
  logAudit('settings_update', 'settings', b.key, { value: b.value });
  return c.json({ success: true });
});

/* ─── Interview Prep ─── */
app.get('/api/interview-preps', (c) => c.json(queryAll('SELECT * FROM interview_preps ORDER BY created_at DESC')));

app.post('/api/interview-preps', async (c) => {
  const b = await c.req.json();
  const id = randomUUID();
  runSql(`INSERT INTO interview_preps (id, application_id, profile_id, job_title, company, hr_questions, role_questions, experience_questions, switch_questions, salary_questions, relocation_questions, notice_period_questions, suggested_answers, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.applicationId||null, b.profileId||null, b.jobTitle, b.company, JSON.stringify(b.hrQuestions||[]), JSON.stringify(b.roleQuestions||[]), JSON.stringify(b.experienceQuestions||[]), JSON.stringify(b.switchQuestions||[]), JSON.stringify(b.salaryQuestions||[]), JSON.stringify(b.relocationQuestions||[]), JSON.stringify(b.noticePeriodQuestions||[]), JSON.stringify(b.suggestedAnswers||{}), b.notes||null, now(), now()]);
  return c.json({ id, success: true });
});

/* ─── Skill Gap Plans ─── */
app.get('/api/skill-gap-plans', (c) => c.json(queryAll('SELECT * FROM skill_gap_plans ORDER BY created_at DESC')));

app.post('/api/skill-gap-plans', async (c) => {
  const b = await c.req.json();
  const id = randomUUID();
  runSql(`INSERT INTO skill_gap_plans (id, profile_id, role_pack_id, target_role, transferable_skills, missing_skills, evidence_gaps, project_gaps, certification_gaps, plan_7_day, plan_30_day, plan_90_day, should_apply_now, recommendation, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.profileId||null, b.rolePackId||null, b.targetRole||null, JSON.stringify(b.transferableSkills||[]), JSON.stringify(b.missingSkills||[]), JSON.stringify(b.evidenceGaps||[]), JSON.stringify(b.projectGaps||[]), JSON.stringify(b.certificationGaps||[]), JSON.stringify(b.plan7Day||{}), JSON.stringify(b.plan30Day||{}), JSON.stringify(b.plan90Day||{}), b.shouldApplyNow?1:0, b.recommendation||null, now(), now()]);
  return c.json({ id, success: true });
});

/* ─── Job Sources ─── */
app.get('/api/job-sources', (c) => c.json(queryAll('SELECT * FROM job_sources ORDER BY sort_order ASC')));

app.post('/api/job-sources', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  runSql(`INSERT OR REPLACE INTO job_sources (id, name, type, base_url, enabled, priority, scan_schedule, last_scan_at, filters, dedup_rules, rate_limit, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.name, b.type||'portal', b.baseUrl||null, b.enabled!==false?1:0, b.priority||5, b.scanSchedule||null, b.lastScanAt||null, JSON.stringify(b.filters||{}), JSON.stringify(b.dedupRules||{}), b.rateLimit||null, b.sortOrder||0, b.createdAt||now(), now()]);
  return c.json({ id, success: true });
});

/* ─── Audit Log ─── */
app.get('/api/audit-log', (c) => {
  const { limit } = c.req.query();
  return c.json(queryAll('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?', [parseInt(limit||'100')]));
});

/* ─── Backup ─── */
app.post('/api/backup', async (c) => {
  const backupDir = './data/backups';
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  const backupPath = resolve(backupDir, filename);
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(backupPath, buffer);
  const size = buffer.length;
  runSql('INSERT INTO backups (id, filename, size, path, type, status, created_at) VALUES (?,?,?,?,?,?,?)',
    [randomUUID(), filename, size, backupPath, 'full', 'completed', now()]);
  logAudit('backup_created', 'backup', filename, { size });
  return c.json({ success: true, filename, size });
});

app.get('/api/backups', (c) => c.json(queryAll('SELECT * FROM backups ORDER BY created_at DESC')));

/* ─── Location Data (static) ─── */
const STATES = [
  { code:'DL', name:'Delhi', alternateNames:['New Delhi','NCR'], capital:'New Delhi', region:'ncr', isUT:true },
  { code:'HR', name:'Haryana', alternateNames:['HR'], capital:'Chandigarh', region:'ncr', isUT:false },
  { code:'UP', name:'Uttar Pradesh', alternateNames:['UP'], capital:'Lucknow', region:'north', isUT:false },
  { code:'UK', name:'Uttarakhand', alternateNames:[], capital:'Dehradun', region:'north', isUT:false },
  { code:'PB', name:'Punjab', alternateNames:[], capital:'Chandigarh', region:'north', isUT:false },
  { code:'HP', name:'Himachal Pradesh', alternateNames:[], capital:'Shimla', region:'north', isUT:false },
  { code:'JK', name:'Jammu & Kashmir', alternateNames:[], capital:'Srinagar', region:'north', isUT:true },
  { code:'LA', name:'Ladakh', alternateNames:[], capital:'Leh', region:'north', isUT:true },
  { code:'CH', name:'Chandigarh', alternateNames:[], capital:'Chandigarh', region:'north', isUT:true },
  { code:'KA', name:'Karnataka', alternateNames:[], capital:'Bengaluru', region:'south', isUT:false },
  { code:'TN', name:'Tamil Nadu', alternateNames:[], capital:'Chennai', region:'south', isUT:false },
  { code:'KL', name:'Kerala', alternateNames:[], capital:'Thiruvananthapuram', region:'south', isUT:false },
  { code:'AP', name:'Andhra Pradesh', alternateNames:[], capital:'Amaravati', region:'south', isUT:false },
  { code:'TS', name:'Telangana', alternateNames:[], capital:'Hyderabad', region:'south', isUT:false },
  { code:'PY', name:'Puducherry', alternateNames:['Pondicherry'], capital:'Puducherry', region:'south', isUT:true },
  { code:'MH', name:'Maharashtra', alternateNames:[], capital:'Mumbai', region:'west', isUT:false },
  { code:'GJ', name:'Gujarat', alternateNames:[], capital:'Gandhinagar', region:'west', isUT:false },
  { code:'RJ', name:'Rajasthan', alternateNames:[], capital:'Jaipur', region:'west', isUT:false },
  { code:'GA', name:'Goa', alternateNames:[], capital:'Panaji', region:'west', isUT:false },
  { code:'WB', name:'West Bengal', alternateNames:['Bengal'], capital:'Kolkata', region:'east', isUT:false },
  { code:'OR', name:'Odisha', alternateNames:['Orissa'], capital:'Bhubaneswar', region:'east', isUT:false },
  { code:'BR', name:'Bihar', alternateNames:[], capital:'Patna', region:'east', isUT:false },
  { code:'JH', name:'Jharkhand', alternateNames:[], capital:'Ranchi', region:'east', isUT:false },
  { code:'MP', name:'Madhya Pradesh', alternateNames:[], capital:'Bhopal', region:'central', isUT:false },
  { code:'CG', name:'Chhattisgarh', alternateNames:[], capital:'Raipur', region:'central', isUT:false },
  { code:'AS', name:'Assam', alternateNames:[], capital:'Dispur', region:'northeast', isUT:false },
  { code:'ML', name:'Meghalaya', alternateNames:[], capital:'Shillong', region:'northeast', isUT:false },
  { code:'MN', name:'Manipur', alternateNames:[], capital:'Imphal', region:'northeast', isUT:false },
  { code:'MZ', name:'Mizoram', alternateNames:[], capital:'Aizawl', region:'northeast', isUT:false },
  { code:'TR', name:'Tripura', alternateNames:[], capital:'Agartala', region:'northeast', isUT:false },
  { code:'NL', name:'Nagaland', alternateNames:[], capital:'Kohima', region:'northeast', isUT:false },
  { code:'AR', name:'Arunachal Pradesh', alternateNames:[], capital:'Itanagar', region:'northeast', isUT:false },
  { code:'SK', name:'Sikkim', alternateNames:[], capital:'Gangtok', region:'northeast', isUT:false },
  { code:'AN', name:'Andaman & Nicobar', alternateNames:[], capital:'Port Blair', region:'south', isUT:true },
  { code:'LD', name:'Lakshadweep', alternateNames:[], capital:'Kavaratti', region:'south', isUT:true },
  { code:'DD', name:'Dadra & Nagar Haveli and Daman & Diu', alternateNames:[], capital:'Daman', region:'west', isUT:true },
];

const CITIES = [
  { name:'Mumbai', stateCode:'MH', district:'Mumbai', tier:'metro', isMetro:true },
  { name:'Delhi', stateCode:'DL', district:'Delhi', tier:'metro', isMetro:true },
  { name:'Bengaluru', stateCode:'KA', district:'Bengaluru Urban', tier:'metro', isMetro:true },
  { name:'Hyderabad', stateCode:'TS', district:'Hyderabad', tier:'metro', isMetro:true },
  { name:'Chennai', stateCode:'TN', district:'Chennai', tier:'metro', isMetro:true },
  { name:'Kolkata', stateCode:'WB', district:'Kolkata', tier:'metro', isMetro:true },
  { name:'Pune', stateCode:'MH', district:'Pune', tier:'metro', isMetro:true },
  { name:'Ahmedabad', stateCode:'GJ', district:'Ahmedabad', tier:'metro', isMetro:true },
  { name:'Gurgaon', stateCode:'HR', district:'Gurugram', tier:'metro', isMetro:true },
  { name:'Noida', stateCode:'UP', district:'Gautam Buddh Nagar', tier:'metro', isMetro:true },
  { name:'Jaipur', stateCode:'RJ', district:'Jaipur', tier:'tier1', isMetro:false },
  { name:'Lucknow', stateCode:'UP', district:'Lucknow', tier:'tier1', isMetro:false },
  { name:'Chandigarh', stateCode:'CH', district:'Chandigarh', tier:'tier1', isMetro:false },
  { name:'Kochi', stateCode:'KL', district:'Ernakulam', tier:'tier1', isMetro:false },
  { name:'Coimbatore', stateCode:'TN', district:'Coimbatore', tier:'tier1', isMetro:false },
  { name:'Indore', stateCode:'MP', district:'Indore', tier:'tier1', isMetro:false },
  { name:'Nagpur', stateCode:'MH', district:'Nagpur', tier:'tier1', isMetro:false },
  { name:'Visakhapatnam', stateCode:'AP', district:'Visakhapatnam', tier:'tier1', isMetro:false },
  { name:'Surat', stateCode:'GJ', district:'Surat', tier:'tier1', isMetro:false },
  { name:'Vadodara', stateCode:'GJ', district:'Vadodara', tier:'tier1', isMetro:false },
  { name:'Thiruvananthapuram', stateCode:'KL', district:'Thiruvananthapuram', tier:'tier1', isMetro:false },
  { name:'Bhopal', stateCode:'MP', district:'Bhopal', tier:'tier1', isMetro:false },
  { name:'Patna', stateCode:'BR', district:'Patna', tier:'tier1', isMetro:false },
  { name:'Madurai', stateCode:'TN', district:'Madurai', tier:'tier1', isMetro:false },
  { name:'Guwahati', stateCode:'AS', district:'Kamrup', tier:'tier1', isMetro:false },
  { name:'Mysuru', stateCode:'KA', district:'Mysuru', tier:'tier1', isMetro:false },
];

const REGIONS = [
  { id:'south', name:'South India', states:['KA','TN','KL','AP','TS','PY','AN','LD'] },
  { id:'north', name:'North India', states:['UP','UK','PB','HP','JK','LA','CH'] },
  { id:'ncr', name:'Delhi NCR', states:['DL','HR'] },
  { id:'west', name:'West India', states:['MH','GJ','RJ','GA','DD'] },
  { id:'east', name:'East India', states:['WB','OR','BR','JH'] },
  { id:'central', name:'Central India', states:['MP','CG'] },
  { id:'northeast', name:'Northeast India', states:['AS','ML','MN','MZ','TR','NL','AR','SK'] },
];

app.get('/api/locations/states', (c) => c.json(STATES));
app.get('/api/locations/cities', (c) => {
  const { search, stateCode } = c.req.query();
  if (search) {
    const q = search.toLowerCase();
    return c.json(CITIES.filter(c => c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q)).slice(0, 20));
  }
  if (stateCode) return c.json(CITIES.filter(c => c.stateCode === stateCode));
  return c.json(CITIES);
});
app.get('/api/locations/regions', (c) => c.json(REGIONS));
app.get('/api/locations/work-modes', (c) => c.json({
  remote:'Remote', hybrid:'Hybrid', onsite:'On-site / WFO', wfh:'Work from Home',
  india_remote:'Remote (India)', contract:'Contract', internship:'Internship',
  freelance:'Freelance', walk_in:'Walk-in', field_role:'Field Role',
  part_time:'Part-time', full_time:'Full-time',
}));

/* ─── Analytics ─── */
app.get('/api/analytics', (c) => {
  return c.json({
    totalJobs: queryOne('SELECT COUNT(*) as count FROM jobs')?.count || 0,
    totalApplications: queryOne('SELECT COUNT(*) as count FROM applications')?.count || 0,
    statusBreakdown: queryAll('SELECT status, COUNT(*) as count FROM applications GROUP BY status'),
    averageScore: queryOne('SELECT AVG(overall_score) as avg FROM jobs WHERE overall_score IS NOT NULL')?.avg || 0,
    jobsThisWeek: queryOne("SELECT COUNT(*) as count FROM jobs WHERE created_at > datetime('now', '-7 days')")?.count || 0,
    topCompanies: queryAll('SELECT company, COUNT(*) as count FROM jobs GROUP BY company ORDER BY count DESC LIMIT 10'),
  });
});

/* ─── Statuses ─── */
app.get('/api/statuses', (c) => c.json([
  { id:'discovered', label:'Discovered', color:'#64748b' },
  { id:'saved', label:'Saved', color:'#6366f1' },
  { id:'shortlisted', label:'Shortlisted', color:'#8b5cf6' },
  { id:'applied', label:'Applied', color:'#3b82f6' },
  { id:'interview_scheduled', label:'Interview Scheduled', color:'#f97316' },
  { id:'offer_received', label:'Offer Received', color:'#22c55e' },
  { id:'accepted', label:'Accepted', color:'#10b981' },
  { id:'rejected', label:'Rejected', color:'#ef4444' },
]));

/* ─── Start ─── */
const port = parseInt(process.env.PORT || '3000');

initDb().then(() => {
  serve({ fetch: app.fetch, port });
  console.log(`🚀 Career-Ops India API running on http://localhost:${port}`);
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
