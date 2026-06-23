/* =========================================================================
 * Career-Ops India — Database Client Factory
 * Creates and manages SQLite database connection
 * ========================================================================= */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

export interface DbConfig {
  provider: 'sqlite' | 'postgres';
  sqlitePath?: string;
  postgresUrl?: string;
}

/** Get or create the database instance. */
export function getDb(config?: DbConfig): ReturnType<typeof drizzle> {
  if (dbInstance) return dbInstance;

  const provider = config?.provider ?? 'sqlite';

  if (provider === 'sqlite') {
    const dbPath = config?.sqlitePath ?? './data/career-ops.db';
    const dir = dirname(dbPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    sqliteInstance = new Database(dbPath);
    sqliteInstance.pragma('journal_mode = WAL');
    sqliteInstance.pragma('foreign_keys = ON');

    dbInstance = drizzle(sqliteInstance, { schema });
    initializeDatabase(sqliteInstance);
    return dbInstance;
  }

  throw new Error(`Database provider "${provider}" not yet configured. Use SQLite for local mode.`);
}

/** Initialize database tables if they don't exist. */
function initializeDatabase(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      location TEXT,
      state_code TEXT,
      experience_years REAL DEFAULT 0,
      current_role TEXT,
      target_roles TEXT,
      skills TEXT,
      education TEXT,
      summary TEXT,
      linkedin_url TEXT,
      portfolio_url TEXT,
      github_url TEXT,
      preferred_work_modes TEXT,
      preferred_locations TEXT,
      salary_expectation_lpa REAL,
      notice_period_days INTEGER,
      is_career_switching INTEGER DEFAULT 0,
      switch_from_role TEXT,
      switch_to_role TEXT,
      switch_mode TEXT,
      role_pack_ids TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      family TEXT NOT NULL,
      description TEXT,
      keywords TEXT NOT NULL,
      exclude_keywords TEXT,
      synonyms TEXT,
      alternative_titles TEXT,
      skills TEXT,
      salary_range TEXT,
      preferred_work_modes TEXT,
      interview_topics TEXT,
      resume_strategy TEXT,
      enabled INTEGER DEFAULT 1,
      is_custom INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT,
      location TEXT,
      state_code TEXT,
      city TEXT,
      work_mode TEXT,
      salary_text TEXT,
      salary_min_lpa REAL,
      salary_max_lpa REAL,
      salary_disclosed INTEGER DEFAULT 0,
      experience_min REAL,
      experience_max REAL,
      source TEXT,
      source_url TEXT,
      posted_date TEXT,
      posted_days_ago INTEGER,
      company_url TEXT,
      company_verified INTEGER DEFAULT 0,
      role_pack_id TEXT,
      normalized_title TEXT,
      fingerprint TEXT,
      has_bond INTEGER DEFAULT 0,
      bond_years INTEGER,
      is_consultancy INTEGER DEFAULT 0,
      has_vague_description INTEGER DEFAULT 0,
      quality_flags TEXT,
      fit_score REAL,
      risk_score REAL,
      overall_score REAL,
      grade TEXT,
      scoring_details TEXT,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT REFERENCES jobs(id),
      profile_id TEXT REFERENCES profiles(id),
      status TEXT NOT NULL DEFAULT 'discovered',
      company TEXT NOT NULL,
      job_title TEXT NOT NULL,
      source TEXT,
      location TEXT,
      work_mode TEXT,
      salary_text TEXT,
      role_pack_id TEXT,
      fit_score REAL,
      risk_score REAL,
      switch_score REAL,
      notes TEXT,
      recruiter_contact TEXT,
      next_action TEXT,
      follow_up_date TEXT,
      applied_date TEXT,
      resume_version_id TEXT,
      tags TEXT,
      attachments TEXT,
      timeline TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      profile_id TEXT REFERENCES profiles(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'master',
      role_pack_id TEXT,
      target_job_id TEXT,
      sections TEXT NOT NULL,
      template TEXT DEFAULT 'modern',
      format TEXT DEFAULT 'one_page',
      pdf_path TEXT,
      is_active INTEGER DEFAULT 1,
      version INTEGER DEFAULT 1,
      parent_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      base_url TEXT,
      api_key TEXT,
      default_model TEXT,
      fallback_model TEXT,
      temperature REAL DEFAULT 0.7,
      max_tokens INTEGER,
      timeout INTEGER DEFAULT 30000,
      retries INTEGER DEFAULT 2,
      streaming INTEGER DEFAULT 0,
      vision INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_task_assignments (
      id TEXT PRIMARY KEY,
      task_type TEXT NOT NULL,
      provider_id TEXT REFERENCES ai_providers(id),
      model TEXT,
      temperature REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interview_preps (
      id TEXT PRIMARY KEY,
      application_id TEXT REFERENCES applications(id),
      profile_id TEXT REFERENCES profiles(id),
      job_title TEXT NOT NULL,
      company TEXT NOT NULL,
      hr_questions TEXT,
      role_questions TEXT,
      experience_questions TEXT,
      switch_questions TEXT,
      salary_questions TEXT,
      relocation_questions TEXT,
      notice_period_questions TEXT,
      suggested_answers TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skill_gap_plans (
      id TEXT PRIMARY KEY,
      profile_id TEXT REFERENCES profiles(id),
      role_pack_id TEXT,
      target_role TEXT,
      transferable_skills TEXT,
      missing_skills TEXT,
      evidence_gaps TEXT,
      project_gaps TEXT,
      certification_gaps TEXT,
      plan_7_day TEXT,
      plan_30_day TEXT,
      plan_90_day TEXT,
      should_apply_now INTEGER,
      recommendation TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      label TEXT,
      description TEXT,
      type TEXT DEFAULT 'string',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      user_id TEXT,
      ip_address TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      base_url TEXT,
      enabled INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 5,
      scan_schedule TEXT,
      last_scan_at TEXT,
      filters TEXT,
      dedup_rules TEXT,
      rate_limit INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      size INTEGER,
      path TEXT NOT NULL,
      type TEXT DEFAULT 'full',
      status TEXT DEFAULT 'completed',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
    CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
    CREATE INDEX IF NOT EXISTS idx_jobs_work_mode ON jobs(work_mode);
    CREATE INDEX IF NOT EXISTS idx_jobs_fingerprint ON jobs(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_profile ON applications(profile_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
  `);

  // Seed default settings
  const now = new Date().toISOString();
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

  const insertSetting = sqlite.prepare(
    'INSERT OR IGNORE INTO settings (key, value, category, label, description, type, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  for (const [key, value, category, label, description, type] of defaults) {
    insertSetting.run(key, value, category, label, description, type, now);
  }
}

/** Close database connection. */
export function closeDb() {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
  }
}

export { schema };
