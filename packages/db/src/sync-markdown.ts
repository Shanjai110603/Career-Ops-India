import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { getDb } from './index.js';
import { jobs, applications } from './schema.js';
import { eq, and } from 'drizzle-orm';

const PROJECT_ROOT = process.cwd();
const PIPELINE_PATH = join(PROJECT_ROOT, 'data', 'pipeline.md');
const APPLICATIONS_PATH = join(PROJECT_ROOT, 'data', 'applications.md');

/** Bidirectional sync bridge */
export async function syncMarkdownWithDatabase() {
  console.log('🔄 Starting markdown-database bidirectional synchronization...');
  const db = getDb();

  // Ensure directories exist
  const dataDir = join(PROJECT_ROOT, 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // ─── 1. Pipeline Sync (pipeline.md -> jobs/applications) ───
  let pipelineJobs: Array<{ url: string; company: string; title: string; checked: boolean }> = [];
  if (existsSync(PIPELINE_PATH)) {
    const content = readFileSync(PIPELINE_PATH, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        const checked = match[1].toLowerCase() === 'x';
        const parts = match[2].split('|').map(s => s.trim());
        if (parts.length >= 3) {
          const url = parts[0];
          const company = parts[1];
          const title = parts[2];
          if (url.startsWith('http')) {
            pipelineJobs.push({ url, company, title, checked });
          }
        }
      }
    }
  }

  // Import new pipeline jobs into database
  for (const pJob of pipelineJobs) {
    if (!pJob.checked) {
      const existing = db.select().from(jobs).where(eq(jobs.sourceUrl, pJob.url)).all();
      if (existing.length === 0) {
        const jobId = 'job_' + Math.random().toString(36).substring(2, 9);
        db.insert(jobs).values({
          id: jobId,
          title: pJob.title,
          company: pJob.company,
          sourceUrl: pJob.url,
          source: 'manual_sync',
          fitScore: 0,
          riskScore: 0,
          overallScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).run();

        const appId = 'app_' + Math.random().toString(36).substring(2, 9);
        db.insert(applications).values({
          id: appId,
          jobId: jobId,
          company: pJob.company,
          jobTitle: pJob.title,
          status: 'discovered',
          source: 'manual_sync',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).run();
      }
    }
  }

  // ─── 2. Applications Sync (applications.md -> applications database table) ───
  let mdApps: Array<{ pos: number; date: string; company: string; role: string; score: string; status: string; notes: string }> = [];
  if (existsSync(APPLICATIONS_PATH)) {
    const content = readFileSync(APPLICATIONS_PATH, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('|') && !line.includes('Date') && !line.includes('---')) {
        const cols = line.split('|').map(s => s.trim()).filter(Boolean);
        if (cols.length >= 7) {
          const pos = parseInt(cols[0]) || 0;
          const date = cols[1];
          const company = cols[2];
          const role = cols[3];
          const score = cols[4];
          const status = cols[5].toLowerCase();
          const notes = cols[8] || '';
          mdApps.push({ pos, date, company, role, score, status, notes });
        }
      }
    }
  }

  // Import apps from markdown to database
  for (const app of mdApps) {
    const existing = db.select().from(applications)
      .where(and(eq(applications.company, app.company), eq(applications.jobTitle, app.role)))
      .all();

    const normalizedStatus = app.status.replace(/[^a-z_]/g, '');

    if (existing.length === 0) {
      const jobId = 'job_' + Math.random().toString(36).substring(2, 9);
      db.insert(jobs).values({
        id: jobId,
        title: app.role,
        company: app.company,
        fitScore: parseFloat(app.score) || 0,
        overallScore: parseFloat(app.score) || 0,
        createdAt: new Date(app.date).toISOString(),
        updatedAt: new Date().toISOString()
      }).run();

      const appId = 'app_' + Math.random().toString(36).substring(2, 9);
      db.insert(applications).values({
        id: appId,
        jobId: jobId,
        company: app.company,
        jobTitle: app.role,
        status: normalizedStatus || 'discovered',
        notes: app.notes,
        createdAt: new Date(app.date).toISOString(),
        updatedAt: new Date().toISOString()
      }).run();
    } else {
      const appRecord = existing[0];
      if (appRecord.status !== normalizedStatus) {
        db.update(applications)
          .set({ status: normalizedStatus, updatedAt: new Date().toISOString() })
          .where(eq(applications.id, appRecord.id))
          .run();
      }
    }
  }

  // ─── 3. Write back to Markdown files (Database -> Markdown) ───
  // A. Write pipeline.md
  const activeJobs = db.select().from(applications).where(eq(applications.status, 'discovered')).all();
  let pipelineContent = '# Pending Pipeline\n\n';
  activeJobs.forEach(app => {
    if (app.jobId) {
      const job = db.select().from(jobs).where(eq(jobs.id, app.jobId)).get();
      if (job && job.sourceUrl) {
        pipelineContent += `- [ ] ${job.sourceUrl} | ${app.company} | ${app.jobTitle}\n`;
      }
    }
  });
  const dir = dirname(PIPELINE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(PIPELINE_PATH, pipelineContent, 'utf-8');

  // B. Write applications.md
  const allApps = db.select().from(applications).all();
  let appsContent = '# Job Search Applications Tracker\n\n';
  appsContent += '| # | Date | Company | Role | Score | Status | PDF | Report | Notes |\n';
  appsContent += '|---|------|---------|------|-------|--------|-----|--------|-------|\n';
  
  allApps.forEach((app, index) => {
    const dateStr = app.createdAt ? app.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const scoreStr = app.fitScore ? Math.round(app.fitScore).toString() : '—';
    const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
    appsContent += `| ${index + 1} | ${dateStr} | ${app.company} | ${app.jobTitle} | ${scoreStr} | ${statusLabel} | ❌ | — | ${app.notes || ''} |\n`;
  });
  
  writeFileSync(APPLICATIONS_PATH, appsContent, 'utf-8');
  console.log('✅ Bidirectional synchronization completed successfully!');
}

// Standalone runner execution support
const isMain = process.argv[1] && resolve(process.argv[1]).includes('sync-markdown');
if (isMain) {
  syncMarkdownWithDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Sync script failed:', err);
      process.exit(1);
    });
}
