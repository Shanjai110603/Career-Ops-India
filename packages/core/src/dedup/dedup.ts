/* =========================================================================
 * Career-Ops India — Job Deduplication Engine
 * Deterministic fingerprint-based dedup for job listings
 * ========================================================================= */

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
  let score = 0;

  if (a.company.toLowerCase().trim() === b.company.toLowerCase().trim()) score += 0.4;

  const titleSim = stringSimilarity(a.title.toLowerCase(), b.title.toLowerCase());
  score += titleSim * 0.3;

  if (a.location.toLowerCase().trim() === b.location.toLowerCase().trim()) score += 0.15;

  if (a.description && b.description) {
    const descSim = stringSimilarity(
      a.description.toLowerCase().slice(0, 200),
      b.description.toLowerCase().slice(0, 200)
    );
    score += descSim * 0.15;
  }

  return Math.min(1, score);
}

/** Simple string similarity using bigram overlap (Dice coefficient). */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();

  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.substring(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.substring(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/** Deduplicate a list of jobs. */
export function deduplicateJobs<T extends { title: string; company: string; location: string }>(
  jobs: T[],
  threshold: number = 0.75
): { unique: T[]; duplicates: { job: T; duplicateOf: T }[] } {
  const unique: T[] = [];
  const duplicates: { job: T; duplicateOf: T }[] = [];

  for (const job of jobs) {
    let isDuplicate = false;
    for (const existing of unique) {
      if (jobSimilarity(job, existing) >= threshold) {
        duplicates.push({ job, duplicateOf: existing });
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) unique.push(job);
  }

  return { unique, duplicates };
}
