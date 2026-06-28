import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { eq, and, desc } from 'drizzle-orm';
import { schema } from '@career-ops/db';
import { db, now, logAudit } from '../helpers.js';

export const applicationsRouter = new Hono();

applicationsRouter.get('/api/applications', (c) => {
  const { status, profileId } = c.req.query();
  let queryBuilder = db.select().from(schema.applications);
  const conditions = [];

  if (status) conditions.push(eq(schema.applications.status, status));
  if (profileId) conditions.push(eq(schema.applications.profileId, profileId));

  const result = conditions.length > 0
    ? queryBuilder.where(and(...conditions)).orderBy(desc(schema.applications.updatedAt)).all()
    : queryBuilder.orderBy(desc(schema.applications.updatedAt)).all();

  return c.json(result);
});

applicationsRouter.post('/api/applications', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();
  const values = {
    id,
    jobId: b.jobId || null,
    profileId: b.profileId || null,
    status: b.status || 'discovered',
    company: b.company,
    jobTitle: b.jobTitle,
    source: b.source || null,
    location: b.location || null,
    workMode: b.workMode || null,
    salaryText: b.salaryText || null,
    rolePackId: b.rolePackId || null,
    fitScore: b.fitScore !== undefined ? parseFloat(b.fitScore) : null,
    riskScore: b.riskScore !== undefined ? parseFloat(b.riskScore) : null,
    switchScore: b.switchScore !== undefined ? parseFloat(b.switchScore) : null,
    notes: b.notes || null,
    recruiterContact: b.recruiterContact || null,
    nextAction: b.nextAction || null,
    followUpDate: b.followUpDate || null,
    appliedDate: b.appliedDate || null,
    resumeVersionId: b.resumeVersionId || null,
    tags: JSON.stringify(b.tags || []),
    attachments: JSON.stringify(b.attachments || []),
    timeline: JSON.stringify(b.timeline || [{ date: now(), event: 'Created', notes: '' }]),
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.applications).where(eq(schema.applications.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.applications).set(values).where(eq(schema.applications.id, id)).run();
  } else {
    db.insert(schema.applications).values(values).run();
  }

  logAudit(exists ? 'application_updated' : 'application_created', 'applications', id);
  return c.json({ id, success: true });
});

applicationsRouter.put('/api/applications/:id', async (c) => {
  const b = await c.req.json();
  const id = c.req.param('id');
  const cleanUpdates: any = {};
  
  for (const [key, value] of Object.entries(b)) {
    if (['id', 'createdAt'].includes(key)) continue;
    cleanUpdates[key] = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
  }
  cleanUpdates.updatedAt = now();

  db.update(schema.applications).set(cleanUpdates).where(eq(schema.applications.id, id)).run();
  logAudit('application_updated', 'applications', id);
  return c.json({ id, success: true });
});

applicationsRouter.get('/api/statuses', (c) => c.json([
  { id: 'discovered', label: 'Discovered', color: '#64748b' },
  { id: 'saved', label: 'Saved', color: '#6366f1' },
  { id: 'shortlisted', label: 'Shortlisted', color: '#8b5cf6' },
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'interview_scheduled', label: 'Interview Scheduled', color: '#f97316' },
  { id: 'offer_received', label: 'Offer Received', color: '#22c55e' },
  { id: 'accepted', label: 'Accepted', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' },
]));
