/* =========================================================================
 * Career-Ops India — Scoring Engine
 * Deterministic, multi-dimensional scoring — no AI required
 * Adapted from santifer/career-ops A–F scoring (10 weighted dimensions)
 * ========================================================================= */

export interface ScoringInput {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  salaryLPA?: number;
  requiredExperienceYears?: number;
  userExperienceYears: number;
  userSkills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  userLocation: string;
  jobLocation: string;
  jobWorkMode: string;
  userPreferredWorkModes: string[];
  rolePackKeywords?: string[];
  rolePackExcludeKeywords?: string[];
  isCareerSwitch?: boolean;
  userCurrentRole?: string;
  userTargetRole?: string;
  jobPostedDaysAgo?: number;
  hasBond?: boolean;
  bondYears?: number;
  hasVagueDescription?: boolean;
  isConsultancy?: boolean;
  salaryDisclosed?: boolean;
  companyVerified?: boolean;
}

export interface ScoringResult {
  overall: number;
  grade: string;
  dimensions: {
    roleFit: number;
    experienceMatch: number;
    salaryFairness: number;
    locationViability: number;
    switchFriendliness: number;
    companyQuality: number;
    workModeMatch: number;
    growthOpportunity: number;
    riskScore: number;
    freshness: number;
  };
  flags: string[];
  summary: string;
}

const WEIGHTS = {
  roleFit: 0.25,
  experienceMatch: 0.15,
  salaryFairness: 0.15,
  locationViability: 0.10,
  switchFriendliness: 0.10,
  companyQuality: 0.10,
  workModeMatch: 0.05,
  growthOpportunity: 0.05,
  riskScore: -0.05,
  freshness: 0.05,
};

/** Calculate role fit score (0–100). */
function scoreRoleFit(input: ScoringInput): number {
  const { jobTitle, jobDescription, rolePackKeywords, rolePackExcludeKeywords, userSkills, requiredSkills } = input;
  let score = 50;
  const titleLower = jobTitle.toLowerCase();
  const descLower = jobDescription.toLowerCase();

  if (rolePackKeywords?.length) {
    const matched = rolePackKeywords.filter(k => titleLower.includes(k.toLowerCase()) || descLower.includes(k.toLowerCase()));
    score += Math.min(30, (matched.length / rolePackKeywords.length) * 30);
  }

  if (rolePackExcludeKeywords?.length) {
    const excluded = rolePackExcludeKeywords.filter(k => titleLower.includes(k.toLowerCase()) || descLower.includes(k.toLowerCase()));
    score -= excluded.length * 15;
  }

  if (requiredSkills.length > 0) {
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const matched = requiredSkills.filter(s => userSkillsLower.includes(s.toLowerCase()));
    score += (matched.length / requiredSkills.length) * 20;
  }

  return Math.max(0, Math.min(100, score));
}

/** Calculate experience match score (0–100). */
function scoreExperienceMatch(input: ScoringInput): number {
  const { requiredExperienceYears, userExperienceYears } = input;
  if (requiredExperienceYears === undefined) return 70;

  const diff = userExperienceYears - requiredExperienceYears;
  if (diff >= 0 && diff <= 2) return 100;
  if (diff > 2 && diff <= 5) return 80;
  if (diff > 5) return 60;
  if (diff >= -1) return 70;
  if (diff >= -3) return 40;
  return 20;
}

/** Calculate salary fairness score (0–100). */
function scoreSalaryFairness(input: ScoringInput): number {
  if (!input.salaryLPA || !input.salaryDisclosed) return 50;
  return Math.min(100, input.salaryLPA * 10);
}

/** Calculate location viability score (0–100). */
function scoreLocationViability(input: ScoringInput): number {
  const { userLocation, jobLocation, jobWorkMode } = input;
  if (['remote', 'wfh', 'work_from_anywhere'].includes(jobWorkMode)) return 95;
  if (!userLocation || !jobLocation) return 70;
  const userLocLower = userLocation.toLowerCase().trim();
  const jobLocLower = jobLocation.toLowerCase().trim();
  if (userLocLower === jobLocLower || jobLocLower.includes(userLocLower) || userLocLower.includes(jobLocLower)) return 100;
  return 50;
}

/** Calculate switch friendliness score (0–100). */
function scoreSwitchFriendliness(input: ScoringInput): number {
  if (!input.isCareerSwitch) return 80;
  const descLower = input.jobDescription.toLowerCase();
  let score = 30;

  const switchFriendlySignals = ['career change', 'transition', 'diverse background', 'open to all', 'willing to train', 'freshers welcome', 'no prior experience', 'entry level'];
  for (const signal of switchFriendlySignals) {
    if (descLower.includes(signal)) score += 10;
  }

  if (input.requiredExperienceYears !== undefined && input.requiredExperienceYears <= 2) score += 15;

  return Math.min(100, score);
}

/** Calculate company quality score (0–100). */
function scoreCompanyQuality(input: ScoringInput): number {
  let score = 60;
  if (input.hasVagueDescription) score -= 20;
  if (input.isConsultancy) score -= 15;
  if (input.companyVerified) score += 20;
  if (!input.companyName || input.companyName === 'Confidential') score -= 25;
  return Math.max(0, Math.min(100, score));
}

/** Calculate work mode match score (0–100). */
function scoreWorkModeMatch(input: ScoringInput): number {
  if (input.userPreferredWorkModes.length === 0) return 70;
  if (input.userPreferredWorkModes.includes(input.jobWorkMode)) return 100;
  return 30;
}

/** Calculate growth opportunity score (0–100). */
function scoreGrowthOpportunity(input: ScoringInput): number {
  const descLower = input.jobDescription.toLowerCase();
  let score = 50;
  const growthSignals = ['career growth', 'learning', 'mentorship', 'promotion', 'leadership', 'ownership', 'grow', 'develop', 'training program'];
  for (const signal of growthSignals) {
    if (descLower.includes(signal)) score += 7;
  }
  return Math.min(100, score);
}

/** Calculate risk score (0–100, higher = riskier). */
function scoreRisk(input: ScoringInput): number {
  let risk = 0;
  if (input.hasBond) risk += 25;
  if (input.bondYears && input.bondYears > 1) risk += 15;
  if (input.hasVagueDescription) risk += 20;
  if (input.isConsultancy) risk += 10;
  if (!input.salaryDisclosed) risk += 10;
  if (!input.companyVerified) risk += 10;
  if (!input.companyName || input.companyName === 'Confidential') risk += 15;
  return Math.min(100, risk);
}

/** Calculate freshness score (0–100). */
function scoreFreshness(input: ScoringInput): number {
  if (input.jobPostedDaysAgo === undefined) return 50;
  if (input.jobPostedDaysAgo <= 3) return 100;
  if (input.jobPostedDaysAgo <= 7) return 85;
  if (input.jobPostedDaysAgo <= 14) return 70;
  if (input.jobPostedDaysAgo <= 30) return 50;
  return 20;
}

/** Convert numeric score to letter grade. */
function toGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/** Generate flags based on scoring input. */
function generateFlags(input: ScoringInput): string[] {
  const flags: string[] = [];
  if (input.hasBond) flags.push('Bond/Service Agreement');
  if (input.hasVagueDescription) flags.push('Vague Job Description');
  if (input.isConsultancy) flags.push('Consultancy/Staffing');
  if (!input.salaryDisclosed) flags.push('Salary Not Disclosed');
  if (!input.companyVerified) flags.push('Unverified Company');
  if (input.requiredExperienceYears !== undefined && input.userExperienceYears < input.requiredExperienceYears - 2) {
    flags.push('Experience Gap');
  }
  return flags;
}

/** Main scoring function — calculates all dimensions and produces a result. */
export function scoreJob(input: ScoringInput): ScoringResult {
  const dimensions = {
    roleFit: scoreRoleFit(input),
    experienceMatch: scoreExperienceMatch(input),
    salaryFairness: scoreSalaryFairness(input),
    locationViability: scoreLocationViability(input),
    switchFriendliness: scoreSwitchFriendliness(input),
    companyQuality: scoreCompanyQuality(input),
    workModeMatch: scoreWorkModeMatch(input),
    growthOpportunity: scoreGrowthOpportunity(input),
    riskScore: scoreRisk(input),
    freshness: scoreFreshness(input),
  };

  const overall = Math.round(
    dimensions.roleFit * WEIGHTS.roleFit +
    dimensions.experienceMatch * WEIGHTS.experienceMatch +
    dimensions.salaryFairness * WEIGHTS.salaryFairness +
    dimensions.locationViability * WEIGHTS.locationViability +
    dimensions.switchFriendliness * WEIGHTS.switchFriendliness +
    dimensions.companyQuality * WEIGHTS.companyQuality +
    dimensions.workModeMatch * WEIGHTS.workModeMatch +
    dimensions.growthOpportunity * WEIGHTS.growthOpportunity +
    dimensions.riskScore * WEIGHTS.riskScore +
    dimensions.freshness * WEIGHTS.freshness
  );

  const grade = toGrade(overall);
  const flags = generateFlags(input);

  let summary = `Overall score: ${overall}/100 (${grade}).`;
  if (flags.length > 0) summary += ` Flags: ${flags.join(', ')}.`;

  return { overall, grade, dimensions, flags, summary };
}

/** Score a job specifically for career-switch suitability. */
export function scoreCareerSwitch(input: ScoringInput & {
  transferableSkills: string[];
  targetRoleKeywords: string[];
}): {
  switchScore: number;
  transitionReadiness: number;
  bridgeRolePotential: number;
  explanation: string;
} {
  const descLower = input.jobDescription.toLowerCase();
  const titleLower = input.jobTitle.toLowerCase();

  let switchScore = 30;
  let transitionReadiness = 40;

  const targetMatched = input.targetRoleKeywords.filter(k => titleLower.includes(k.toLowerCase()) || descLower.includes(k.toLowerCase()));
  switchScore += Math.min(30, (targetMatched.length / Math.max(1, input.targetRoleKeywords.length)) * 30);

  const transferMatched = input.transferableSkills.filter(s => descLower.includes(s.toLowerCase()));
  transitionReadiness += Math.min(40, (transferMatched.length / Math.max(1, input.transferableSkills.length)) * 40);

  if (input.requiredExperienceYears !== undefined && input.requiredExperienceYears <= 2) {
    switchScore += 15;
  }

  const openSignals = ['diverse background', 'career change welcome', 'open to all backgrounds', 'willing to train', 'learning mindset'];
  for (const signal of openSignals) {
    if (descLower.includes(signal)) switchScore += 5;
  }

  const bridgeRolePotential = Math.round((switchScore + transitionReadiness) / 2);

  switchScore = Math.min(100, switchScore);
  transitionReadiness = Math.min(100, transitionReadiness);

  const explanation = `Switch score: ${switchScore}/100. Transition readiness: ${transitionReadiness}/100. ` +
    `${transferMatched.length} of ${input.transferableSkills.length} transferable skills match. ` +
    `${targetMatched.length} of ${input.targetRoleKeywords.length} target keywords found.`;

  return { switchScore, transitionReadiness, bridgeRolePotential, explanation };
}
