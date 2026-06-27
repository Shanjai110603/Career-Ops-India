/* =========================================================================
 * Career-Ops India — Core Package Entry Point
 * ========================================================================= */

// Scoring
export { scoreJob, scoreCareerSwitch } from './scoring/engine.js';
export type { ScoringInput, ScoringResult } from './scoring/engine.js';

// Salary
export { lpaToBreakdown, monthlyToBreakdown, ctcToBreakdown, formatINR, formatLPARange, parseSalaryText, isLowball, MARKET_RANGES, calculateInHandSalary } from './salary/converter.js';
export type { SalaryBreakdown, SalaryRange, DetailedSalaryBreakdown } from './salary/converter.js';

// Role Packs
export { DEFAULT_ROLE_PACKS, INDIA_TITLE_MAP, normalizeTitle } from './roles/role-packs.js';
export type { RolePack } from './roles/role-packs.js';

// Pipeline
export { APPLICATION_STATUSES, VALID_TRANSITIONS, isValidTransition, getStatusInfo, getStatusesByCategory } from './pipeline/states.js';
export type { ApplicationStatus, StatusInfo } from './pipeline/states.js';

// Dedup
export { generateJobFingerprint, jobSimilarity, deduplicateJobs, roleFuzzyMatch } from './dedup/dedup.js';

// Quality
export { analyzeJobQuality, calculateRiskScore } from './quality/jd-flags.js';
export type { QualityFlag } from './quality/jd-flags.js';
