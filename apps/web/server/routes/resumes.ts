import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { schema } from '@career-ops/db';
import { callAI } from '@career-ops/ai';
import { db, now, logAudit, getPromptTemplate, parseAIResponse } from '../helpers.js';

export const resumesRouter = new Hono();

resumesRouter.get('/api/resumes', (c) => {
  const result = db.select().from(schema.resumes).where(eq(schema.resumes.isActive, true)).orderBy(desc(schema.resumes.updatedAt)).all();
  return c.json(result);
});

resumesRouter.post('/api/resumes', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  const values = {
    id,
    profileId: b.profileId || null,
    name: b.name,
    type: b.type || 'master',
    rolePackId: b.rolePackId || null,
    targetJobId: b.targetJobId || null,
    sections: JSON.stringify(b.sections || {}),
    template: b.template || 'modern',
    format: b.format || 'one_page',
    pdfPath: b.pdfPath || null,
    isActive: true,
    version: b.version !== undefined ? parseInt(b.version) : 1,
    parentId: b.parentId || null,
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.resumes).where(eq(schema.resumes.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.resumes).set(values).where(eq(schema.resumes.id, id)).run();
  } else {
    db.insert(schema.resumes).values(values).run();
  }

  logAudit(exists ? 'resume_updated' : 'resume_created', 'resumes', id);
  return c.json({ id, success: true });
});

resumesRouter.post('/api/resumes/:id/tailor', async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const jobDescription = b.jobDescription || '';
  const company = b.company || 'Target Company';
  const jobTitle = b.jobTitle || 'Target Role';
  const jobId = b.jobId || null;

  const baseResume = db.select().from(schema.resumes).where(eq(schema.resumes.id, id)).limit(1).all()[0];
  if (!baseResume) return c.json({ error: 'Resume not found' }, 404);

  const sections = typeof baseResume.sections === 'string' ? JSON.parse(baseResume.sections) : baseResume.sections || {};
  const provider = db.select().from(schema.aiProviders).where(eq(schema.aiProviders.enabled, true)).limit(1).all()[0];

  let tailoredSections = { ...sections };

  if (provider) {
    const sharedContext = getPromptTemplate('_shared.md');
    const pdfLogic = getPromptTemplate('pdf.md');

    const systemPrompt = `You are career-ops, an AI-powered resume tailoring assistant.
Your task is to tailor a candidate's resume for a specific job description.
Follow the guidelines in pdf.md and _shared.md exactly.

SYSTEM CONTEXT (_shared.md):
${sharedContext}

TAILORING GUIDELINES (pdf.md):
${pdfLogic}

You MUST output a valid JSON object matching the exact structure of the resume sections.
DO NOT invent any achievements, skills, or history that the candidate does not have. You may reword existing experience bullets to better align with the job description terms, highlight relevant keywords, and filter/order bullets and projects by relevance.

The JSON schema of the output is:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string"
  },
  "summary": "string (tailored summary containing job-relevant keywords and an exit narrative bridge if career switching)",
  "skills": ["string", "string"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string (bulleted achievements, reworded or reordered for relevance, separated by newlines or markdown bullets)"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "tech": "string",
      "description": "string"
    }
  ]
}

Ensure the output is ONLY a valid JSON object. Do not include any introduction, formatting, or conversational text.`;

    const userMessage = `BASE RESUME SECTIONS:
${JSON.stringify(sections, null, 2)}

TARGET JOB DETAILS:
Company: ${company}
Job Title: ${jobTitle}
Job Description:
${jobDescription}`;

    try {
      const aiConfig = { ...provider, type: provider.type as any } as any;
      const response = await callAI(aiConfig, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);
      tailoredSections = parseAIResponse(response.text);
    } catch (err: any) {
      console.error('Failed to tailor resume via AI:', err);
      return c.json({ error: 'AI resume tailoring failed: ' + err.message }, 500);
    }
  } else {
    tailoredSections.summary = `[Tailored for ${jobTitle} at ${company}] ` + (sections.summary || '');
  }

  const newId = randomUUID();
  const nextVersion = (baseResume.version || 1) + 1;
  const values = {
    id: newId,
    profileId: baseResume.profileId,
    name: `${baseResume.name} - Tailored for ${company} (${jobTitle})`,
    type: 'role_specific',
    rolePackId: baseResume.rolePackId,
    targetJobId: jobId,
    sections: JSON.stringify(tailoredSections),
    template: baseResume.template || 'modern',
    format: baseResume.format || 'one_page',
    pdfPath: null,
    isActive: true,
    version: nextVersion,
    parentId: baseResume.id,
    createdAt: now(),
    updatedAt: now()
  };

  db.insert(schema.resumes).values(values).run();
  logAudit('resume_tailored', 'resumes', newId, { parentId: baseResume.id, company, jobTitle });

  return c.json({ success: true, id: newId, resume: values });
});
