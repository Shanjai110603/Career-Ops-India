import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { getDb, schema } from '@career-ops/db';
import { eq } from 'drizzle-orm';
import { scoreJob, normalizeTitle, analyzeJobQuality, calculateRiskScore, DEFAULT_ROLE_PACKS } from '@career-ops/core';

export const db = getDb();

export const now = () => new Date().toISOString();

export function logAudit(action: string, entityType?: string, entityId?: string, details?: any) {
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
export function getPromptTemplate(filename: string): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const path = resolve(__dirname, '../../..', 'modes', filename);
  if (existsSync(path)) {
    return readFileSync(path, 'utf-8');
  }
  return '';
}

/** Helper: Parse experience years from job title and description */
export function parseExperienceFromText(title: string, description: string): { min: number | null; max: number | null } {
  const combined = `${title}\n${description}`.toLowerCase();
  
  // Range check: "2-5 years", "2 to 5 years", "3-5 yrs", etc.
  const rangeRegex = /(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)/i;
  const rangeMatch = combined.match(rangeRegex);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max) && min < 50 && max < 50) {
      return { min, max };
    }
  }

  // Minimum / Plus check: "3+ years", "5+ yrs", "minimum 4 years", "at least 3 years"
  const plusRegex = /(\d+)\s*\+\s*(?:years?|yrs?)/i;
  const plusMatch = combined.match(plusRegex);
  if (plusMatch) {
    const min = parseInt(plusMatch[1]);
    if (!isNaN(min) && min < 50) {
      return { min, max: null };
    }
  }

  const reqRegex = /(?:minimum|at least|req(?:uire)?)\s*(\d+)\s*(?:years?|yrs?)/i;
  const reqMatch = combined.match(reqRegex);
  if (reqMatch) {
    const min = parseInt(reqMatch[1]);
    if (!isNaN(min) && min < 50) {
      return { min, max: null };
    }
  }

  // Fallback keyword check on title
  const titleLower = title.toLowerCase();
  if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal') || titleLower.includes('staff')) {
    return { min: 5, max: null };
  }
  if (titleLower.includes('intern') || titleLower.includes('fresher') || titleLower.includes('junior') || titleLower.includes('associate')) {
    return { min: 0, max: 2 };
  }

  return { min: null, max: null };
}

/** Helper: Parse salary range from job title and description for Indian formats */
export function parseSalaryFromText(title: string, description: string): { minLPA: number | null; maxLPA: number | null; salaryText: string | null } {
  const combined = `${title}\n${description}`.toLowerCase();

  // LPA range, e.g. "8-12 LPA", "10 to 15 lakhs", "6-8 l"
  const lpaRegex = /(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|l\b)/i;
  const lpaMatch = combined.match(lpaRegex);
  if (lpaMatch) {
    const minLPA = parseFloat(lpaMatch[1]);
    const maxLPA = parseFloat(lpaMatch[2]);
    if (!isNaN(minLPA) && !isNaN(maxLPA) && minLPA < 200 && maxLPA < 200) {
      return {
        minLPA,
        maxLPA,
        salaryText: `₹${minLPA}L - ₹${maxLPA}L per annum`
      };
    }
  }

  // Single LPA, e.g. "12 LPA", "15 Lakhs"
  const singleLpaRegex = /(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|l\b)/i;
  const singleLpaMatch = combined.match(singleLpaRegex);
  if (singleLpaMatch) {
    const lpa = parseFloat(singleLpaMatch[1]);
    if (!isNaN(lpa) && lpa < 200) {
      return {
        minLPA: lpa,
        maxLPA: lpa,
        salaryText: `₹${lpa}L per annum`
      };
    }
  }

  // Raw numeric range, e.g. "600,000 - 1,000,000" or "800000 to 1200000"
  const fullSalaryRegex = /(?:rs\.?|inr|₹)?\s*(\d{1,3}(?:,\d{2,3})*)\s*(?:-|to)\s*(?:rs\.?|inr|₹)?\s*(\d{1,3}(?:,\d{2,3})*)/i;
  const fullSalaryMatch = combined.match(fullSalaryRegex);
  if (fullSalaryMatch) {
    const cleanNum = (s: string) => parseInt(s.replace(/,/g, ''));
    const minVal = cleanNum(fullSalaryMatch[1]);
    const maxVal = cleanNum(fullSalaryMatch[2]);
    if (minVal >= 100000 && maxVal >= 100000 && minVal < 100000000 && maxVal < 100000000) {
      const minLPA = minVal / 100000;
      const maxLPA = maxVal / 100000;
      return {
        minLPA,
        maxLPA,
        salaryText: `₹${minLPA.toFixed(1)}L - ₹${maxLPA.toFixed(1)}L per annum`
      };
    }
  }

  return { minLPA: null, maxLPA: null, salaryText: null };
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

  const norm = normalizeTitle(job.title || '');
  let requiredSkills: string[] = [];
  let rolePackKeywords: string[] = [];
  let rolePackExcludeKeywords: string[] = [];
  
  if (norm) {
    const pack = DEFAULT_ROLE_PACKS.find(p => p.id === norm.rolePackId);
    if (pack) {
      requiredSkills = pack.skills;
      rolePackKeywords = pack.keywords;
      rolePackExcludeKeywords = pack.excludeKeywords;
    }
  }

  const qualityAnalysis = analyzeJobQuality({
    title: job.title || '',
    description: job.description || '',
    company: job.company || '',
    salaryDisclosed: !!(job.salaryMinLPA || job.salaryMaxLPA || job.salaryText)
  });

  const hasBond = !!job.hasBond || qualityAnalysis.some(f => f.category === 'bond');
  const isConsultancy = !!job.isConsultancy || qualityAnalysis.some(f => f.category === 'consultancy');
  const hasVagueDescription = !!job.hasVagueDescription || qualityAnalysis.some(f => f.category === 'vague') || (job.description && job.description.length < 150);

  const scoringInput = {
    jobTitle: job.title || '',
    jobDescription: job.description || '',
    companyName: job.company || '',
    salaryLPA: job.salaryMinLPA || job.salaryMaxLPA || undefined,
    requiredExperienceYears: job.experienceMin || undefined,
    userExperienceYears: profile.experienceYears || 0,
    userSkills,
    requiredSkills,
    preferredSkills: [],
    rolePackKeywords,
    rolePackExcludeKeywords,
    userLocation: profile.location || '',
    jobLocation: job.location || '',
    jobWorkMode,
    userPreferredWorkModes,
    isCareerSwitch: !!profile.isCareerSwitching,
    userCurrentRole: profile.currentRole || '',
    userTargetRole: profile.switchToRole || '',
    hasBond,
    bondYears: job.bondYears !== undefined ? parseInt(job.bondYears) : undefined,
    isConsultancy,
    hasVagueDescription,
    salaryDisclosed: !!(job.salaryMinLPA || job.salaryMaxLPA || job.salaryText),
    companyVerified: !!job.companyVerified
  };

  const result = scoreJob(scoringInput);
  
  const textFlags = qualityAnalysis.map(f => f.message);
  const combinedFlags = [...new Set([...result.flags, ...textFlags])];
  const combinedRisk = Math.min(100, Math.max(result.dimensions.riskScore, calculateRiskScore(qualityAnalysis)));

  return {
    fitScore: result.dimensions.roleFit,
    riskScore: combinedRisk,
    overallScore: result.overall,
    grade: result.grade,
    qualityFlags: combinedFlags
  };
}

/** Recalculates match scores for all job listings in the database when profile changes */
export async function recalculateAllJobs() {
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
export function parseAIResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

export function compileKeyword(kw: string) {
  const cleanKw = kw.toLowerCase().trim();
  if (/^[a-z]{2,3}$/.test(cleanKw)) {
    const re = new RegExp(`\\b${cleanKw}\\b`);
    return (lower: string) => re.test(lower);
  }
  return (lower: string) => lower.includes(cleanKw);
}

export function buildProfileTitleFilter(profile: any) {
  if (!profile) return () => true;
  
  const targetRoles = JSON.parse(profile.targetRoles || '[]');
  const rolePackIds = JSON.parse(profile.rolePackIds || '[]');
  
  const positiveKeywords: string[] = [...targetRoles];
  const negativeKeywords: string[] = [];
  
  const builtInPacks = [
    { id: 'software-engineer', keywords: ['software', 'developer', 'engineer', 'programmer', 'full stack', 'backend', 'frontend', 'sde', 'swe'], excludeKeywords: ['intern only', 'volunteer', 'internship'] },
    { id: 'data-analyst', keywords: ['data analyst', 'business analyst', 'bi analyst', 'mis', 'analytics'], excludeKeywords: [] },
    { id: 'product-manager', keywords: ['product manager', 'product owner', 'program manager', 'apm'], excludeKeywords: [] },
    { id: 'sales-bde', keywords: ['sales', 'business development', 'bde', 'account manager', 'bdm'], excludeKeywords: [] },
    { id: 'customer-support', keywords: ['customer support', 'customer service', 'help desk', 'customer care'], excludeKeywords: [] },
    { id: 'hr-recruiter', keywords: ['hr', 'human resources', 'recruiter', 'talent acquisition'], excludeKeywords: [] },
    { id: 'operations', keywords: ['operations', 'admin', 'coordination', 'process'], excludeKeywords: [] },
    { id: 'finance-accounts', keywords: ['finance', 'accounts', 'accounting', 'audit', 'taxation', 'ca'], excludeKeywords: [] },
    { id: 'qa-testing', keywords: ['qa', 'testing', 'quality assurance', 'sdet', 'automation'], excludeKeywords: [] },
    { id: 'marketing', keywords: ['marketing', 'digital marketing', 'seo', 'social media', 'content'], excludeKeywords: [] },
    { id: 'devops-cloud', keywords: ['devops', 'cloud', 'sre', 'aws', 'azure', 'kubernetes'], excludeKeywords: [] },
    { id: 'design-ux', keywords: ['ui', 'ux', 'design', 'product design', 'figma'], excludeKeywords: [] }
  ];
  
  const customPacks = db.select().from(schema.rolePacks).all();
  const allPacks = [...builtInPacks, ...customPacks.map(p => ({
    id: p.id,
    keywords: JSON.parse(p.keywords || '[]'),
    excludeKeywords: JSON.parse(p.excludeKeywords || '[]')
  }))];
  
  for (const packId of rolePackIds) {
    const pack = allPacks.find(p => p.id === packId);
    if (pack) {
      positiveKeywords.push(...pack.keywords);
      if ('excludeKeywords' in pack && Array.isArray(pack.excludeKeywords)) {
        negativeKeywords.push(...pack.excludeKeywords);
      }
    }
  }
  
  const positive = positiveKeywords.map(compileKeyword);
  const negative = negativeKeywords.map(compileKeyword);
  
  return (title: string) => {
    const lower = (title || '').toLowerCase();
    const hasPositive = positive.length === 0 || positive.some(m => m(lower));
    const hasNegative = negative.some(m => m(lower));
    return hasPositive && !hasNegative;
  };
}
