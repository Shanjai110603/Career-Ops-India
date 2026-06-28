import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { schema } from '@career-ops/db';
import { callAI } from '@career-ops/ai';
import { db, now, logAudit, getPromptTemplate, parseAIResponse, compileResumeToMarkdown, calculateJobScores } from '../helpers.js';

export const aiRouter = new Hono();

aiRouter.post('/api/ai/evaluate-job', async (c) => {
  const b = await c.req.json();
  const jobId = b.jobId;

  const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).limit(1).all()[0];
  if (!job) return c.json({ error: 'Job not found' }, 404);

  const activeProfile = db.select().from(schema.profiles).where(eq(schema.profiles.isActive, true)).limit(1).all()[0];
  if (!activeProfile) return c.json({ error: 'No active profile found. Create one first.' }, 400);

  const activeResume = db.select().from(schema.resumes).where(eq(schema.resumes.profileId, activeProfile.id)).limit(1).all()[0];
  const cvMd = activeResume ? compileResumeToMarkdown(activeResume) : '';

  const sharedContext = getPromptTemplate('_shared.md');
  const ofertaLogic = getPromptTemplate('oferta.md');

  const systemPrompt = `You are career-ops, an AI-powered job search assistant.
You evaluate job offers against the user's CV using a structured A-G scoring system.

Your evaluation methodology is defined below. Follow it exactly.

SYSTEM CONTEXT (_shared.md)
${sharedContext}

EVALUATION MODE (oferta.md)
${ofertaLogic}

CANDIDATE RESUME (cv.md equivalent)
${cvMd}

CANDIDATE PROFILE & TARGETS
Name: ${activeProfile.name}
Experience: ${activeProfile.experienceYears} years
Target Roles: ${activeProfile.targetRoles}
Skills: ${activeProfile.skills}
Salary Expectation (LPA): ${activeProfile.salaryExpectationLPA}

IMPORTANT OPERATING RULES FOR THIS SESSION
1. Generate Blocks A through G in full, in English.
2. At the very end, output a machine-readable summary block in this exact format:

---SCORE_SUMMARY---
COMPANY: ${job.company}
ROLE: ${job.title}
SCORE: <global score as decimal from 1.0 to 5.0, e.g. 4.2>
ARCHETYPE: <detected archetype>
LEGITIMACY: <High Confidence | Proceed with Caution | Suspicious>
---END_SUMMARY---
`;

  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];
  
  if (!provider) {
    const scoreData = calculateJobScores(job, activeProfile);
    return c.json({
      evaluationText: `## Rule-Based Evaluation (No AI Provider Configured)
Overall score: ${scoreData.overallScore}/100 (${scoreData.grade}).
Flags: ${scoreData.qualityFlags.join(', ')}`,
      company: job.company,
      role: job.title,
      score: (scoreData.overallScore / 20).toFixed(1),
      archetype: 'Engineering',
      legitimacy: scoreData.riskScore > 30 ? 'Proceed with Caution' : 'High Confidence'
    });
  }

  try {
    const aiConfig = { ...provider, type: provider.type as any } as any;
    const response = await callAI(aiConfig, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `JOB DESCRIPTION TO EVALUATE:\n\nTitle: ${job.title}\nCompany: ${job.company}\nDescription:\n${job.description || ''}` }
    ]);

    const summaryMatch = response.text.match(/---SCORE_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/);
    let company = job.company;
    let role = job.title;
    let score = '3.0';
    let archetype = 'Engineering';
    let legitimacy = 'High Confidence';

    if (summaryMatch) {
      const block = summaryMatch[1];
      const extract = (key: string) => {
        const prefix = `${key}:`;
        const lines = block.split('\n');
        for (const line of lines) {
          const trimmed = line.trimStart();
          if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length).trim();
        }
        return '';
      };
      company = extract('COMPANY') || company;
      role = extract('ROLE') || role;
      score = extract('SCORE') || score;
      archetype = extract('ARCHETYPE') || archetype;
      legitimacy = extract('LEGITIMACY') || legitimacy;
    }

    const numericScore = parseFloat(score);
    const overallScore = isNaN(numericScore) ? 60 : Math.round(numericScore * 20);

    db.update(schema.jobs).set({
      overallScore,
      grade: overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B+' : overallScore >= 60 ? 'B' : 'C',
      scoringDetails: JSON.stringify({ evaluationText: response.text, archetype, legitimacy }),
      updatedAt: now()
    }).where(eq(schema.jobs.id, job.id)).run();

    return c.json({
      evaluationText: response.text,
      company,
      role,
      score,
      archetype,
      legitimacy
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

aiRouter.post('/api/ai/career-switch', async (c) => {
  const b = await c.req.json();
  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];

  if (!provider) {
    const transferable = (b.transferableSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const missing = (b.missingSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    return c.json({
      switchScore: Math.min(100, 45 + transferable.length * 7),
      transitionReadiness: transferable.length > 0 ? Math.round((transferable.length / (transferable.length + missing.length || 1)) * 100) : 40,
      bridgeRolePotential: Math.min(100, 50 + transferable.length * 5),
      transferable,
      missing,
      recommendations: [
        `Learn missing competencies: ${missing.slice(0, 3).join(', ')}.`,
        'Highlight your transferable skills prominently at the top of your resume.',
        'Target bridge roles in adjacent domains to gain practical exposure.'
      ],
      plan7Day: ['Tailor resume/LinkedIn headline to emphasize transferable skills', 'Connect with 3 industry peers', 'Draft career change cover letter', 'Learn the basics of 1 missing skill'],
      plan30Day: ['Complete an introductory online course', 'Build a starter project using target skills', 'Apply to 5 transition positions', 'Read 2 industry case studies'],
      plan90Day: ['Build a complex portfolio piece', 'Do 2 mock interviews with target role questions', 'Apply to 15 roles', 'Contribute to open source projects']
    });
  }

  const prompt = `You are a professional career coach. Create a transition plan from "${b.currentRole}" to "${b.targetRole}".
Transferable Skills: ${b.transferableSkills}
Missing Skills to Learn: ${b.missingSkills}
Motivation: ${b.motivation || 'N/A'}
Timeline: ${b.timeline || '6'} months

Return a valid JSON object with the following fields:
- switchScore: number (0-100 score of switch compatibility)
- transitionReadiness: number (0-100 percentage based on skills matches)
- bridgeRolePotential: number (0-100 score indicating if candidate needs a bridge role first)
- transferable: string[] (parsed list of transferable skills)
- missing: string[] (parsed list of skills to acquire)
- recommendations: string[] (3 bullet points of career switch recommendations)
- plan7Day: string[] (4 items of action plan)
- plan30Day: string[] (4 items of action plan)
- plan90Day: string[] (4 items of action plan)

Ensure the output is ONLY valid JSON. Do not write any conversational intro or markdown blocks.`;

  try {
    const aiConfig = { ...provider, type: provider.type as any } as any;
    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    const parsed = parseAIResponse(response.text);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: 'AI generation failed: ' + err.message }, 500);
  }
});

aiRouter.post('/api/ai/interview-prep', async (c) => {
  const b = await c.req.json();
  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];
  const interviewLogic = getPromptTemplate('interview-prep.md');

  if (!provider) {
    return c.json({
      hrQuestions: [
        'Why do you want to work at ' + b.company + '?',
        'Walk me through a difficult engineering challenge you solved.',
        'What are your expected salary components?',
        'How do you manage deadlines and stress?'
      ],
      roleQuestions: [
        'Explain the core architecture of your last project.',
        'How do you write test cases to ensure reliability?',
        'How would you handle service failures in production?',
        'What design pattern matches a pub-sub requirement?'
      ],
      salaryQuestions: ['What is your expected CTC?', 'Are you open to negotiation on offered components?'],
      switchQuestions: ['Why are you transitioning roles?', 'How will your previous experience translate?'],
      noticePeriodQuestions: ['What is your notice period?', 'Can it be negotiated or bought out?']
    });
  }

  const prompt = `You are career-ops, an AI-powered interviewer. 
Your interviewing guidelines are defined here:
${interviewLogic}

Generate a targeted set of interview questions and tips for: "${b.jobTitle}" at "${b.company}".
Return a valid JSON object with the following fields:
- hrQuestions: string[] (4 behavioral questions)
- roleQuestions: string[] (5 role-specific or technical questions)
- salaryQuestions: string[] (2 salary discussion/negotiation questions)
- switchQuestions: string[] (3 questions addressing domain changes if any)
- noticePeriodQuestions: string[] (2 questions regarding notice period and availability)

Return ONLY the valid JSON block. No descriptions or markdown code blocks.`;

  try {
    const aiConfig = { ...provider, type: provider.type as any } as any;
    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    const parsed = parseAIResponse(response.text);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: 'AI generation failed: ' + err.message }, 500);
  }
});

aiRouter.post('/api/ai/skill-gap', async (c) => {
  const b = await c.req.json();
  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];

  if (!provider) {
    const current = (b.currentSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const required = (b.requiredSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const transferable = current.filter((s: string) => required.some((r: string) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase())));
    const missing = required.filter((r: string) => !current.some((s: string) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase())));

    return c.json({
      transferableSkills: transferable,
      missingSkills: missing,
      shouldApplyNow: missing.length <= 2,
      recommendation: missing.length === 0 ? 'No gap found.' : missing.length <= 2 ? 'Minor gap — apply now.' : 'Significant gap — learn first.',
      plan7Day: missing.slice(0, 2).map((s: string) => `Learn basics of ${s}`),
      plan30Day: missing.slice(0, 3).map((s: string) => `Build simple projects using ${s}`),
      plan90Day: missing.map((s: string) => `Acquire course certifications in ${s}`)
    });
  }

  const prompt = `Analyze the skill gap for the target role: "${b.targetRole}".
Current Skills: ${b.currentSkills}
Required Skills: ${b.requiredSkills}

Return a valid JSON object containing:
- transferableSkills: string[] (overlapping skills)
- missingSkills: string[] (skills to develop)
- shouldApplyNow: boolean (true if gaps are manageable)
- recommendation: string (curriculum advice)
- plan7Day: string[] (3 learning roadmap goals for the first week)
- plan30Day: string[] (3 goals for the first month)
- plan90Day: string[] (3 goals for the first 3 months)

Return ONLY valid JSON. No conversational introductions.`;

  try {
    const aiConfig = { ...provider, type: provider.type as any } as any;
    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    const parsed = parseAIResponse(response.text);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: 'AI generation failed: ' + err.message }, 500);
  }
});

aiRouter.get('/api/interview-preps', (c) => {
  const result = db.select().from(schema.interviewPreps).orderBy(desc(schema.interviewPreps.createdAt)).all();
  return c.json(result);
});

aiRouter.post('/api/interview-preps', async (c) => {
  const b = await c.req.json();
  const id = randomUUID();
  db.insert(schema.interviewPreps).values({
    id,
    applicationId: b.applicationId || null,
    profileId: b.profileId || null,
    jobTitle: b.jobTitle,
    company: b.company,
    hrQuestions: JSON.stringify(b.hrQuestions || []),
    roleQuestions: JSON.stringify(b.roleQuestions || []),
    salaryQuestions: JSON.stringify(b.salaryQuestions || []),
    switchQuestions: JSON.stringify(b.switchQuestions || []),
    noticePeriodQuestions: JSON.stringify(b.noticePeriodQuestions || []),
    suggestedAnswers: JSON.stringify(b.suggestedAnswers || {}),
    notes: b.notes || null,
    createdAt: now(),
    updatedAt: now()
  }).run();

  logAudit('interview_prep_created', 'interview_preps', id);
  return c.json({ id, success: true });
});

aiRouter.get('/api/skill-gap-plans', (c) => {
  const result = db.select().from(schema.skillGapPlans).orderBy(desc(schema.skillGapPlans.createdAt)).all();
  return c.json(result);
});

aiRouter.post('/api/skill-gap-plans', async (c) => {
  const b = await c.req.json();
  const id = randomUUID();
  db.insert(schema.skillGapPlans).values({
    id,
    profileId: b.profileId || null,
    rolePackId: b.rolePackId || null,
    targetRole: b.targetRole || null,
    transferableSkills: JSON.stringify(b.transferableSkills || []),
    missingSkills: JSON.stringify(b.missingSkills || []),
    evidenceGaps: JSON.stringify(b.evidenceGaps || []),
    projectGaps: JSON.stringify(b.projectGaps || []),
    certificationGaps: JSON.stringify(b.certificationGaps || []),
    plan7Day: JSON.stringify(b.plan7Day || []),
    plan30Day: JSON.stringify(b.plan30Day || []),
    plan90Day: JSON.stringify(b.plan90Day || []),
    shouldApplyNow: !!b.shouldApplyNow,
    recommendation: b.recommendation || null,
    createdAt: now(),
    updatedAt: now()
  }).run();

  logAudit('skill_gap_created', 'skill_gap_plans', id);
  return c.json({ id, success: true });
});
