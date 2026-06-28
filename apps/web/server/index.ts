/* =========================================================================
 * Career-Ops India — Hono TypeScript API Server
 * Modularized Entrypoint — Mounts separate route files
 * ========================================================================= */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { syncMarkdownWithDatabase } from '@career-ops/db';
import { now } from './helpers.js';

// Import sub-routers
import { jobsRouter } from './routes/jobs.js';
import { applicationsRouter } from './routes/applications.js';
import { resumesRouter } from './routes/resumes.js';
import { aiRouter } from './routes/ai.js';
import { locationsRouter } from './routes/locations.js';
import { adminRouter } from './routes/admin.js';

const app = new Hono();
app.use('*', cors());

/* ─── Health check ─── */
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: now(), version: '1.0.0' }));

// Mount routes
app.route('/', jobsRouter);
app.route('/', applicationsRouter);
app.route('/', resumesRouter);
app.route('/', aiRouter);
app.route('/', locationsRouter);
app.route('/', adminRouter);

/* ─── Start server ─── */
const port = parseInt(process.env.PORT || '3000');
serve({ fetch: app.fetch, port });
console.log(`🚀 Career-Ops India API running on http://localhost:${port}`);

// Run initial synchronization on startup
syncMarkdownWithDatabase()
  .then(() => console.log('✅ Initial startup markdown sync completed.'))
  .catch(err => console.error('❌ Startup markdown sync failed:', err));
