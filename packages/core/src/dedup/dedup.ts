/* =========================================================================
 * Career-Ops India — Job Deduplication Engine
 * Deterministic tokenizer-based Jaccard matching for job titles and roles
 * ========================================================================= */

// Tokens that almost every role shares must not count as strong matching
// signals. Seniority, work mode, contract shape, locations, and other generic words.
export const ROLE_STOPWORDS = new Set([
  // seniority / level
  'junior', 'mid', 'middle', 'senior', 'staff', 'principal', 'lead', 'head',
  'chief', 'associate', 'intern', 'entry', 'level',
  // contract / mode
  'remote', 'hybrid', 'onsite', 'contract', 'contractor', 'freelance',
  'fulltime', 'parttime', 'permanent', 'temporary', 'intern', 'internship',
  // generic job words
  'role', 'position', 'opportunity', 'team', 'based',
  // very common locations
  'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai',
  'london', 'berlin', 'paris', 'madrid', 'barcelona', 'amsterdam', 'dublin',
  'york', 'francisco', 'seattle', 'boston', 'austin', 'chicago', 'toronto',
  'tokyo', 'singapore', 'sydney', 'melbourne', 'lisbon', 'warsaw',
  // regions / countries
  'europe', 'emea', 'apac', 'latam', 'americas', 'india', 'spain', 'germany',
  'france', 'italy', 'canada', 'brazil', 'mexico', 'japan',
  // prepositions leaking through the length filter
  'with', 'from', 'into', 'over', 'this', 'that',
]);

// Short specialty acronyms that are discriminating despite their length.
export const SHORT_SPECIALTY = new Set([
  'api', 'sre', 'sdk', 'cli', 'gpu', 'cpu',
  'ios', 'qa', 'ux', 'ui', 'ar', 'vr',
  'ocr', 'crm', 'erp',
]);

// Generic role-level descriptors. Two titles whose only overlap is in this set
// are not the same opening; they are merely written at the same role altitude.
export const BASELINE_TOKENS = new Set([
  'software', 'engineer', 'developer', 'manager', 'architect',
  'analyst', 'designer', 'consultant', 'specialist',
  'platform', 'systems', 'services',
  'backend', 'frontend', 'full', 'stack', 'fullstack',
]);

/** Convert a role title into content tokens used for fuzzy matching. */
export function roleTokens(role: string): string[] {
  const text = typeof role === 'string' ? role : String(role ?? '');
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => (w.length > 3 || SHORT_SPECIALTY.has(w)) && !ROLE_STOPWORDS.has(w));
}

/** Decide whether two role titles are likely the same opening. */
export function roleFuzzyMatch(a: string, b: string): boolean {
  const wordsA = [...new Set(roleTokens(a))];
  const wordsB = [...new Set(roleTokens(b))];
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const setB = new Set(wordsB);
  const overlap = wordsA.filter(w => setB.has(w));
  if (overlap.length < 2) return false;

  // Require at least one non-baseline token in the overlap. Roles that share
  // only generic descriptors like [software, engineer] are not the same opening.
  const discriminating = overlap.filter(w => !BASELINE_TOKENS.has(w));
  if (discriminating.length === 0) return false;

  // Jaccard ratio of overlap / union
  const union = new Set([...wordsA, ...wordsB]).size;
  return overlap.length / union >= 0.6;
}

/** Generate a fingerprint for deduplication. */
export function generateJobFingerprint(job: {
  title: string;
  company: string;
  location: string;
}): string {
  const normalized = [
    job.title.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ''),
    job.company.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ''),
    job.location.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ''),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/** Detect similarity between two job listings (0–1 scale). */
export function jobSimilarity(
  a: { title: string; company: string; location: string; description?: string },
  b: { title: string; company: string; location: string; description?: string }
): number {
  if (a.company.toLowerCase().trim() !== b.company.toLowerCase().trim()) return 0;
  
  if (roleFuzzyMatch(a.title, b.title)) {
    return 1.0;
  }
  
  return 0;
}

/** Deduplicate a list of jobs. */
export function deduplicateJobs<T extends { title: string; company: string; location: string }>(
  jobs: T[]
): { unique: T[]; duplicates: { job: T; duplicateOf: T }[] } {
  const unique: T[] = [];
  const duplicates: { job: T; duplicateOf: T }[] = [];

  for (const job of jobs) {
    let isDuplicate = false;
    for (const existing of unique) {
      if (jobSimilarity(job, existing) >= 0.6) {
        duplicates.push({ job, duplicateOf: existing });
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) unique.push(job);
  }

  return { unique, duplicates };
}
