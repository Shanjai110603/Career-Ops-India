/* =========================================================================
 * Career-Ops India — Job Quality / Risk Detection
 * Flag suspicious, vague, exploitative, or scam-like job posts
 * ========================================================================= */

export interface QualityFlag {
  type: 'warning' | 'danger' | 'info';
  category: string;
  message: string;
  confidence: number;
}

/** Analyze a job posting for quality issues. */
export function analyzeJobQuality(job: {
  title: string;
  description: string;
  company: string;
  salaryDisclosed: boolean;
  salary?: string;
  experience?: string;
}): QualityFlag[] {
  const flags: QualityFlag[] = [];
  const desc = job.description.toLowerCase();
  const title = job.title.toLowerCase();

  // Vague description detection
  if (job.description.length < 100) {
    flags.push({ type: 'warning', category: 'vague', message: 'Very short job description — may lack detail', confidence: 0.8 });
  }

  // Scam indicators
  const scamSignals = ['no investment required', 'earn from home', 'guaranteed income', 'registration fee', 'joining fee', 'security deposit', 'processing fee'];
  for (const signal of scamSignals) {
    if (desc.includes(signal)) {
      flags.push({ type: 'danger', category: 'scam', message: `Potential scam indicator: "${signal}"`, confidence: 0.9 });
    }
  }

  // Consultancy spam
  const consultancySignals = ['walk in', 'walk-in', 'walkin', 'urgent hiring', 'immediate joining', 'spot offer'];
  let consultancyCount = 0;
  for (const signal of consultancySignals) {
    if (desc.includes(signal)) consultancyCount++;
  }
  if (consultancyCount >= 2) {
    flags.push({ type: 'warning', category: 'consultancy', message: 'Likely consultancy/staffing post', confidence: 0.7 });
  }

  // Unrealistic experience
  if (desc.match(/(\d+)\+?\s*(?:years?|yrs?)/)) {
    const match = desc.match(/(\d+)\+?\s*(?:years?|yrs?)/);
    if (match) {
      const years = parseInt(match[1]);
      if (years > 15 && (title.includes('junior') || title.includes('associate') || title.includes('entry'))) {
        flags.push({ type: 'warning', category: 'unrealistic', message: `${years}+ years required for a junior role`, confidence: 0.85 });
      }
    }
  }

  // Exploitative conditions
  const exploitSignals = ['6 day', '6-day', 'six day', 'no leave', 'unpaid', 'stipend only', 'night shift mandatory', 'rotational shift compulsory'];
  for (const signal of exploitSignals) {
    if (desc.includes(signal)) {
      flags.push({ type: 'warning', category: 'exploitative', message: `Potential concern: "${signal}"`, confidence: 0.6 });
    }
  }

  // Bond/service agreement
  const bondSignals = ['service agreement', 'bond', 'service bond', 'lock-in', 'minimum tenure mandatory'];
  for (const signal of bondSignals) {
    if (desc.includes(signal)) {
      flags.push({ type: 'warning', category: 'bond', message: `Contains service bond/agreement clause`, confidence: 0.85 });
    }
  }

  // Salary not disclosed
  if (!job.salaryDisclosed) {
    flags.push({ type: 'info', category: 'salary', message: 'Salary not disclosed', confidence: 1 });
  }

  // Confidential company
  if (!job.company || job.company.toLowerCase() === 'confidential' || job.company.toLowerCase() === 'company name confidential') {
    flags.push({ type: 'warning', category: 'identity', message: 'Company identity not disclosed', confidence: 0.9 });
  }

  // Duplicate detection signals
  if (desc.includes('multiple openings') || desc.includes('bulk hiring') || desc.includes('mass hiring')) {
    flags.push({ type: 'info', category: 'bulk', message: 'Bulk/mass hiring post — may be repeated', confidence: 0.6 });
  }

  return flags;
}

/** Calculate a risk score (0–100) from quality flags. */
export function calculateRiskScore(flags: QualityFlag[]): number {
  let risk = 0;
  for (const flag of flags) {
    if (flag.type === 'danger') risk += 30 * flag.confidence;
    else if (flag.type === 'warning') risk += 15 * flag.confidence;
    else risk += 5 * flag.confidence;
  }
  return Math.min(100, Math.round(risk));
}
