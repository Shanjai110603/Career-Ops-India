/* =========================================================================
 * Career-Ops India — Database Schema (Drizzle ORM)
 * Complete schema for all entities — SQLite compatible
 * ========================================================================= */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/* ─── User Profiles ─── */
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  location: text('location'),
  stateCode: text('state_code'),
  experienceYears: real('experience_years').default(0),
  currentRole: text('current_role'),
  targetRoles: text('target_roles'), // JSON array
  skills: text('skills'), // JSON array
  education: text('education'), // JSON
  summary: text('summary'),
  linkedinUrl: text('linkedin_url'),
  portfolioUrl: text('portfolio_url'),
  githubUrl: text('github_url'),
  preferredWorkModes: text('preferred_work_modes'), // JSON array
  preferredLocations: text('preferred_locations'), // JSON array
  salaryExpectationLPA: real('salary_expectation_lpa'),
  noticePeriodDays: integer('notice_period_days'),
  isCareerSwitching: integer('is_career_switching', { mode: 'boolean' }).default(false),
  switchFromRole: text('switch_from_role'),
  switchToRole: text('switch_to_role'),
  switchMode: text('switch_mode'), // hard | adjacent | dual_track
  rolePackIds: text('role_pack_ids'), // JSON array
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── Role Packs ─── */
export const rolePacks = sqliteTable('role_packs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  family: text('family').notNull(),
  description: text('description'),
  keywords: text('keywords').notNull(), // JSON array
  excludeKeywords: text('exclude_keywords'), // JSON array
  synonyms: text('synonyms'), // JSON array
  alternativeTitles: text('alternative_titles'), // JSON array
  skills: text('skills'), // JSON array
  salaryRange: text('salary_range'), // JSON
  preferredWorkModes: text('preferred_work_modes'), // JSON array
  interviewTopics: text('interview_topics'), // JSON array
  resumeStrategy: text('resume_strategy'),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── Job Listings ─── */
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  description: text('description'),
  location: text('location'),
  stateCode: text('state_code'),
  city: text('city'),
  workMode: text('work_mode'),
  salaryText: text('salary_text'),
  salaryMinLPA: real('salary_min_lpa'),
  salaryMaxLPA: real('salary_max_lpa'),
  salaryDisclosed: integer('salary_disclosed', { mode: 'boolean' }).default(false),
  experienceMin: real('experience_min'),
  experienceMax: real('experience_max'),
  source: text('source'), // naukri, linkedin, manual, etc.
  sourceUrl: text('source_url'),
  postedDate: text('posted_date'),
  postedDaysAgo: integer('posted_days_ago'),
  companyUrl: text('company_url'),
  companyVerified: integer('company_verified', { mode: 'boolean' }).default(false),
  rolePackId: text('role_pack_id'),
  normalizedTitle: text('normalized_title'),
  fingerprint: text('fingerprint'),
  hasBond: integer('has_bond', { mode: 'boolean' }).default(false),
  bondYears: integer('bond_years'),
  isConsultancy: integer('is_consultancy', { mode: 'boolean' }).default(false),
  hasVagueDescription: integer('has_vague_description', { mode: 'boolean' }).default(false),
  qualityFlags: text('quality_flags'), // JSON array
  fitScore: real('fit_score'),
  riskScore: real('risk_score'),
  overallScore: real('overall_score'),
  grade: text('grade'),
  scoringDetails: text('scoring_details'), // JSON
  tags: text('tags'), // JSON array
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── Applications (Tracker) ─── */
export const applications = sqliteTable('applications', {
  id: text('id').primaryKey(),
  jobId: text('job_id').references(() => jobs.id),
  profileId: text('profile_id').references(() => profiles.id),
  status: text('status').notNull().default('discovered'),
  company: text('company').notNull(),
  jobTitle: text('job_title').notNull(),
  source: text('source'),
  location: text('location'),
  workMode: text('work_mode'),
  salaryText: text('salary_text'),
  rolePackId: text('role_pack_id'),
  fitScore: real('fit_score'),
  riskScore: real('risk_score'),
  switchScore: real('switch_score'),
  notes: text('notes'),
  recruiterContact: text('recruiter_contact'),
  nextAction: text('next_action'),
  followUpDate: text('follow_up_date'),
  appliedDate: text('applied_date'),
  resumeVersionId: text('resume_version_id'),
  tags: text('tags'), // JSON array
  attachments: text('attachments'), // JSON array
  timeline: text('timeline'), // JSON array of {date, event, notes}
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── Resumes ─── */
export const resumes = sqliteTable('resumes', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').references(() => profiles.id),
  name: text('name').notNull(),
  type: text('type').notNull().default('master'), // master | role_specific | career_switch
  rolePackId: text('role_pack_id'),
  targetJobId: text('target_job_id'),
  sections: text('sections').notNull(), // JSON — structured resume sections
  template: text('template').default('modern'),
  format: text('format').default('one_page'), // one_page | two_page
  pdfPath: text('pdf_path'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  version: integer('version').default(1),
  parentId: text('parent_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── AI Provider Configs ─── */
export const aiProviders = sqliteTable('ai_providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // openai | gemini | anthropic | openrouter | groq | ollama | lmstudio | custom
  baseUrl: text('base_url'),
  apiKey: text('api_key'), // encrypted
  defaultModel: text('default_model'),
  fallbackModel: text('fallback_model'),
  temperature: real('temperature').default(0.7),
  maxTokens: integer('max_tokens'),
  timeout: integer('timeout').default(30000),
  retries: integer('retries').default(2),
  streaming: integer('streaming', { mode: 'boolean' }).default(false),
  vision: integer('vision', { mode: 'boolean' }).default(false),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── AI Task Model Assignments ─── */
export const aiTaskAssignments = sqliteTable('ai_task_assignments', {
  id: text('id').primaryKey(),
  taskType: text('task_type').notNull(), // job_evaluation | resume_tailoring | cover_letter | interview_prep | skill_gap | career_switch | job_summary | ocr_parsing | embeddings | report_generation
  providerId: text('provider_id').references(() => aiProviders.id),
  model: text('model'),
  temperature: real('temperature'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── Interview Prep ─── */
export const interviewPreps = sqliteTable('interview_preps', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').references(() => applications.id),
  profileId: text('profile_id').references(() => profiles.id),
  jobTitle: text('job_title').notNull(),
  company: text('company').notNull(),
  hrQuestions: text('hr_questions'), // JSON array
  roleQuestions: text('role_questions'), // JSON array
  experienceQuestions: text('experience_questions'), // JSON array
  switchQuestions: text('switch_questions'), // JSON array
  salaryQuestions: text('salary_questions'), // JSON array
  relocationQuestions: text('relocation_questions'), // JSON array
  noticePeriodQuestions: text('notice_period_questions'), // JSON array
  suggestedAnswers: text('suggested_answers'), // JSON map
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── Skill Gap Plans ─── */
export const skillGapPlans = sqliteTable('skill_gap_plans', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').references(() => profiles.id),
  rolePackId: text('role_pack_id'),
  targetRole: text('target_role'),
  transferableSkills: text('transferable_skills'), // JSON array
  missingSkills: text('missing_skills'), // JSON array
  evidenceGaps: text('evidence_gaps'), // JSON array
  projectGaps: text('project_gaps'), // JSON array
  certificationGaps: text('certification_gaps'), // JSON array
  plan7Day: text('plan_7_day'), // JSON
  plan30Day: text('plan_30_day'), // JSON
  plan90Day: text('plan_90_day'), // JSON
  shouldApplyNow: integer('should_apply_now', { mode: 'boolean' }),
  recommendation: text('recommendation'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── Settings (Key-Value) ─── */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  category: text('category').notNull().default('general'),
  label: text('label'),
  description: text('description'),
  type: text('type').default('string'), // string | number | boolean | json
  updatedAt: text('updated_at').notNull(),
});

/* ─── Audit Log ─── */
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  details: text('details'), // JSON
  userId: text('user_id'),
  ipAddress: text('ip_address'),
  timestamp: text('timestamp').notNull(),
});

/* ─── Job Sources / Portals ─── */
export const jobSources = sqliteTable('job_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // portal | api | manual
  baseUrl: text('base_url'),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  priority: integer('priority').default(5),
  scanSchedule: text('scan_schedule'), // cron expression
  lastScanAt: text('last_scan_at'),
  filters: text('filters'), // JSON
  dedupRules: text('dedup_rules'), // JSON
  rateLimit: integer('rate_limit'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ─── Backups ─── */
export const backups = sqliteTable('backups', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  size: integer('size'),
  path: text('path').notNull(),
  type: text('type').default('full'), // full | incremental
  status: text('status').default('completed'), // pending | in_progress | completed | failed
  createdAt: text('created_at').notNull(),
});
