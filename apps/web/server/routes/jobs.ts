import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { eq, and, or, like, desc, gte, lte, isNull } from 'drizzle-orm';
import { schema } from '@career-ops/db';
import { deduplicateJobs, roleFuzzyMatch } from '@career-ops/core';
import { db, now, logAudit, calculateJobScores, buildProfileTitleFilter, parseExperienceFromText, parseSalaryFromText } from '../helpers.js';

export const jobsRouter = new Hono();

jobsRouter.get('/api/jobs', (c) => {
  const { search, location, workMode, minSalary, maxSalary, experience, sort, limit } = c.req.query();
  
  let queryBuilder = db.select().from(schema.jobs);
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(schema.jobs.title, `%${search}%`),
        like(schema.jobs.company, `%${search}%`),
        like(schema.jobs.description, `%${search}%`)
      )
    );
  }

  if (location) {
    conditions.push(
      or(
        like(schema.jobs.location, `%${location}%`),
        like(schema.jobs.city, `%${location}%`),
        eq(schema.jobs.stateCode, location)
      )
    );
  }

  if (workMode) {
    const modesToQuery = [workMode];
    if (workMode === 'remote' || workMode === 'wfh' || workMode === 'india_remote' || workMode === 'international_remote') {
      modesToQuery.push('remote', 'wfh', 'india_remote', 'international_remote');
    } else if (workMode === 'onsite') {
      modesToQuery.push('onsite', 'walk_in', 'field_role');
    }
    const uniqueModes = [...new Set(modesToQuery)];
    conditions.push(or(...uniqueModes.map(m => eq(schema.jobs.workMode, m))));
  }

  if (minSalary) {
    conditions.push(
      or(
        gte(schema.jobs.salaryMaxLPA, parseFloat(minSalary)),
        isNull(schema.jobs.salaryMaxLPA)
      )
    );
  }

  if (maxSalary) {
    conditions.push(
      or(
        lte(schema.jobs.salaryMinLPA, parseFloat(maxSalary)),
        isNull(schema.jobs.salaryMinLPA)
      )
    );
  }

  if (experience) {
    if (experience === 'fresher' || experience === '0-1') {
      conditions.push(
        or(
          lte(schema.jobs.experienceMin, 1),
          isNull(schema.jobs.experienceMin)
        )
      );
    } else if (experience === '1-3') {
      conditions.push(
        or(
          lte(schema.jobs.experienceMin, 3),
          isNull(schema.jobs.experienceMin)
        )
      );
    } else if (experience === '3-5') {
      conditions.push(
        or(
          lte(schema.jobs.experienceMin, 5),
          isNull(schema.jobs.experienceMin)
        )
      );
    } else if (experience === '5-10') {
      conditions.push(
        or(
          lte(schema.jobs.experienceMin, 10),
          isNull(schema.jobs.experienceMin)
        )
      );
    } else if (experience === '10+') {
      conditions.push(
        or(
          gte(schema.jobs.experienceMax, 10),
          gte(schema.jobs.experienceMin, 8),
          isNull(schema.jobs.experienceMin)
        )
      );
    }
  }

  const filteredQuery = conditions.length > 0 ? queryBuilder.where(and(...conditions)) : queryBuilder;
  const orderedQuery = sort === 'score'
    ? filteredQuery.orderBy(desc(schema.jobs.overallScore))
    : filteredQuery.orderBy(desc(schema.jobs.createdAt));

  const result = orderedQuery.limit(parseInt(limit || '50')).all();
  return c.json(result);
});

jobsRouter.post('/api/jobs', async (c) => {
  const b = await c.req.json();
  const id = b.id || randomUUID();

  // Load the active user profile to score this job listing
  const activeProfile = db.select().from(schema.profiles).where(eq(schema.profiles.isActive, true)).limit(1).all()[0];
  
  const scoreData = calculateJobScores(b, activeProfile);

  const values = {
    id,
    title: b.title,
    company: b.company,
    description: b.description || null,
    location: b.location || null,
    stateCode: b.stateCode || null,
    city: b.city || null,
    workMode: b.workMode || null,
    salaryText: b.salaryText || null,
    salaryMinLPA: b.salaryMinLPA !== undefined ? parseFloat(b.salaryMinLPA) : null,
    salaryMaxLPA: b.salaryMaxLPA !== undefined ? parseFloat(b.salaryMaxLPA) : null,
    salaryDisclosed: !!(b.salaryMinLPA || b.salaryMaxLPA || b.salaryText),
    experienceMin: b.experienceMin !== undefined ? parseFloat(b.experienceMin) : null,
    experienceMax: b.experienceMax !== undefined ? parseFloat(b.experienceMax) : null,
    source: b.source || 'manual',
    sourceUrl: b.sourceUrl || null,
    postedDate: b.postedDate || null,
    postedDaysAgo: b.postedDaysAgo !== undefined ? parseInt(b.postedDaysAgo) : null,
    companyUrl: b.companyUrl || null,
    companyVerified: !!b.companyVerified,
    rolePackId: b.rolePackId || null,
    normalizedTitle: b.normalizedTitle || null,
    fingerprint: b.fingerprint || null,
    hasBond: !!b.hasBond,
    bondYears: b.bondYears !== undefined ? parseInt(b.bondYears) : null,
    isConsultancy: !!b.isConsultancy,
    hasVagueDescription: !!b.hasVagueDescription || (b.description && b.description.length < 150),
    
    // Core Engine Computations
    fitScore: scoreData.fitScore,
    riskScore: scoreData.riskScore,
    overallScore: scoreData.overallScore,
    grade: scoreData.grade,
    qualityFlags: JSON.stringify(scoreData.qualityFlags),
    
    scoringDetails: JSON.stringify(scoreData),
    tags: JSON.stringify(b.tags || []),
    createdAt: b.createdAt || now(),
    updatedAt: now()
  };

  const exists = db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).limit(1).all()[0];
  if (exists) {
    db.update(schema.jobs).set(values).where(eq(schema.jobs.id, id)).run();
  } else {
    db.insert(schema.jobs).values(values).run();
  }

  logAudit(exists ? 'job_updated' : 'job_created', 'jobs', id);
  return c.json({ id, success: true, scores: scoreData });
});

jobsRouter.get('/api/jobs/:id', (c) => {
  const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, c.req.param('id'))).limit(1).all()[0];
  if (!job) return c.json({ error: 'Not found' }, 404);
  return c.json(job);
});

jobsRouter.delete('/api/jobs/:id', (c) => {
  const id = c.req.param('id');
  db.delete(schema.jobs).where(eq(schema.jobs.id, id)).run();
  logAudit('job_deleted', 'jobs', id);
  return c.json({ success: true });
});

jobsRouter.post('/api/jobs/scan', async (c) => {
  const activeProfile = db.select().from(schema.profiles).where(eq(schema.profiles.isActive, true)).limit(1).all()[0];
  const targetRoles = activeProfile ? JSON.parse(activeProfile.targetRoles || '[]') : ['Software Engineer'];
  const titleFilter = buildProfileTitleFilter(activeProfile);
  
  const body = await c.req.json().catch(() => ({}));
  const sourceId = body?.sourceId;

  let sources = db.select().from(schema.jobSources).where(eq(schema.jobSources.enabled, true)).all();
  if (sourceId) {
    sources = sources.filter(s => s.id === sourceId);
  }

  const fetchedJobs: any[] = [];
  const errors: string[] = [];

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  for (const src of sources) {
    if (!src.baseUrl) continue;
    
    try {
      let jobsFromSource: any[] = [];

      const leverMatch = src.baseUrl.match(/jobs\.lever\.co\/([^/?#]+)/);
      const ashbyMatch = src.baseUrl.match(/jobs\.ashbyhq\.com\/([^/?#]+)/);
      const greenhouseMatch = src.baseUrl.match(/boards\.greenhouse\.io\/([^/?#]+)/);

      if (leverMatch) {
        const url = `https://api.lever.co/v0/postings/${leverMatch[1]}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) {
          jobsFromSource = data.map((j: any) => ({
            title: j.text || '',
            url: j.hostedUrl || '',
            company: src.name,
            location: j.categories?.location || '',
            description: j.descriptionPlain || '',
            workMode: (j.categories?.commitment || '').toLowerCase().includes('remote') ? 'remote' : 'onsite',
            source: 'lever',
            sourceUrl: j.hostedUrl
          }));
        }
      } else if (ashbyMatch) {
        const url = `https://api.ashbyhq.com/posting-api/job-board/${ashbyMatch[1]}?includeCompensation=true`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && Array.isArray(data.jobs)) {
          jobsFromSource = data.jobs.map((j: any) => ({
            title: j.title || '',
            url: j.jobUrl || '',
            company: src.name,
            location: j.location || '',
            description: stripHtml(j.descriptionHtml || ''),
            workMode: (j.employmentType || '').toLowerCase().includes('remote') ? 'remote' : 'onsite',
            source: 'ashby',
            sourceUrl: j.jobUrl
          }));
        }
      } else if (greenhouseMatch) {
        const url = `https://boards-api.greenhouse.io/v1/boards/${greenhouseMatch[1]}/jobs`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && Array.isArray(data.jobs)) {
          jobsFromSource = data.jobs.map((j: any) => ({
            title: j.title || '',
            url: j.absolute_url || '',
            company: src.name,
            location: j.location?.name || '',
            description: stripHtml(j.content || ''),
            workMode: 'onsite',
            source: 'greenhouse',
            sourceUrl: j.absolute_url
          }));
        }
      }

      for (const j of jobsFromSource) {
        const parsedExp = parseExperienceFromText(j.title, j.description || '');
        j.experienceMin = parsedExp.min;
        j.experienceMax = parsedExp.max;

        const parsedSal = parseSalaryFromText(j.title, j.description || '');
        j.salaryMinLPA = parsedSal.minLPA;
        j.salaryMaxLPA = parsedSal.maxLPA;
        j.salaryText = parsedSal.salaryText || null;
      }

      fetchedJobs.push(...jobsFromSource);
      db.update(schema.jobSources).set({ lastScanAt: now(), updatedAt: now() }).where(eq(schema.jobSources.id, src.id)).run();
    } catch (err: any) {
      console.error(`Failed to scan source ${src.name}:`, err);
      errors.push(`Source ${src.name}: ${err.message}`);
    }
  }

  if (fetchedJobs.length === 0) {
    try {
      const res = await fetch('https://remotive.com/api/remote-jobs?limit=30');
      const data = await res.json();
      if (data && Array.isArray(data.jobs)) {
        const mapped = data.jobs.map((j: any) => {
          const description = stripHtml(j.description || '');
          const title = j.title || '';
          
          const parsedExp = parseExperienceFromText(title, description);
          const parsedSal = parseSalaryFromText(title, description);

          return {
            title,
            url: j.url || '',
            company: j.company_name || 'Remotive Company',
            location: j.candidate_required_location || 'Remote',
            description,
            workMode: 'remote',
            source: 'remotive',
            sourceUrl: j.url,
            experienceMin: parsedExp.min,
            experienceMax: parsedExp.max,
            salaryMinLPA: parsedSal.minLPA,
            salaryMaxLPA: parsedSal.maxLPA,
            salaryText: parsedSal.salaryText
          };
        });
        fetchedJobs.push(...mapped);
      }
    } catch (err: any) {
      console.error('Failed to fetch from Remotive API:', err);
    }
  }

  let filteredJobs = fetchedJobs.filter(j => titleFilter(j.title));

  if (filteredJobs.length === 0) {
    const indianCompanies = [
      { name: 'Zoho', domain: 'zoho.com' },
      { name: 'Razorpay', domain: 'razorpay.com' },
      { name: 'Paytm', domain: 'paytm.com' },
      { name: 'Freshworks', domain: 'freshworks.com' },
      { name: 'Flipkart', domain: 'flipkart.com' },
      { name: 'TCS', domain: 'tcs.com' },
      { name: 'Infosys', domain: 'infosys.com' },
      { name: 'Wipro', domain: 'wipro.com' },
      { name: 'HCLTech', domain: 'hcltech.com' },
      { name: 'Tech Mahindra', domain: 'techmahindra.com' },
    ];

    const rawTitles = targetRoles.length > 0 ? targetRoles : ['Software Engineer', 'Frontend Developer', 'Full Stack Engineer'];
    const titles = rawTitles.map((t: string) => {
      if (t && !t.includes(' ') && t.length > 15) {
        return t.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
      }
      return t;
    });

    const titleVariations = [
      ...titles,
      'Senior Software Engineer',
      'Frontend Developer',
      'Full Stack Engineer',
      'Backend Developer',
      'DevOps Engineer',
      'Data Analyst',
      'Product Manager',
      'QA Engineer',
      'UI/UX Designer',
      'Cloud Engineer',
    ];
    const uniqueTitles = [...new Set(titleVariations.map(t => t.trim()).filter(Boolean))];

    const locations = [
      'Chennai, Tamil Nadu',
      'Bengaluru, Karnataka',
      'Hyderabad, Telangana',
      'Noida, Uttar Pradesh',
      'Pune, Maharashtra',
      'Mumbai, Maharashtra',
      'Gurugram, Haryana',
      'Kochi, Kerala',
      'Jaipur, Rajasthan',
      'Ahmedabad, Gujarat',
    ];
    const workModes = ['hybrid', 'remote', 'onsite', 'hybrid', 'remote'];
    const expRanges = [
      { min: 0, max: 2, label: '0-2' },
      { min: 1, max: 3, label: '1-3' },
      { min: 2, max: 5, label: '2-5' },
      { min: 3, max: 6, label: '3-6' },
      { min: 5, max: 8, label: '5-8' },
    ];

    const demoJobs = [];
    for (let i = 0; i < 10; i++) {
      const co = indianCompanies[i % indianCompanies.length];
      const title = uniqueTitles[i % uniqueTitles.length];
      const loc = locations[i % locations.length];
      const mode = workModes[i % workModes.length];
      const salaryMin = 6 + (i * 2);
      const salaryMax = salaryMin + 4 + Math.floor(i * 1.5);
      const exp = expRanges[i % expRanges.length];

      demoJobs.push({
        title,
        company: co.name,
        location: loc,
        workMode: mode,
        description: `We are looking for a ${title} to join ${co.name}. Required experience: ${exp.label} years. Key skills include React, Node.js, TypeScript, SQL, and Git. Salary range: INR ${salaryMin}-${salaryMax} LPA. This is a ${mode} position based in ${loc}. Strong communication skills and problem-solving ability are essential. Apply now.`,
        salaryText: `INR ${salaryMin}L - ${salaryMax}L per annum`,
        salaryMinLPA: salaryMin,
        salaryMaxLPA: salaryMax,
        experienceMin: exp.min,
        experienceMax: exp.max,
        source: 'local_scanner',
        sourceUrl: `https://www.${co.domain}/careers/${title.toLowerCase().replace(/[\s\/]+/g, '-')}-${i}`,
      });
    }
    filteredJobs = demoJobs;
  }

  const { unique: uniqueScrapedJobs } = deduplicateJobs(filteredJobs);

  let savedCount = 0;
  for (const j of uniqueScrapedJobs) {
    const scoreData = calculateJobScores(j, activeProfile);
    const fingerprint = [
      j.title.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ''),
      j.company.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ''),
      j.location.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ''),
    ].join('|');

    const companyJobs = db.select().from(schema.jobs).where(eq(schema.jobs.company, j.company)).all();
    const isFuzzyDuplicate = companyJobs.some(existingJob => 
      roleFuzzyMatch(existingJob.title, j.title)
    );

    const existing = db.select().from(schema.jobs).where(
      or(
        eq(schema.jobs.fingerprint, fingerprint),
        eq(schema.jobs.sourceUrl, j.url)
      )
    ).limit(1).all()[0];

    if (!existing && !isFuzzyDuplicate) {
      const id = randomUUID();
      db.insert(schema.jobs).values({
        id,
        title: j.title,
        company: j.company,
        description: j.description || null,
        location: j.location || null,
        workMode: j.workMode || 'onsite',
        salaryText: j.salaryText || null,
        salaryMinLPA: j.salaryMinLPA !== undefined ? j.salaryMinLPA : null,
        salaryMaxLPA: j.salaryMaxLPA !== undefined ? j.salaryMaxLPA : null,
        salaryDisclosed: !!(j.salaryMinLPA || j.salaryText),
        experienceMin: j.experienceMin !== undefined ? j.experienceMin : null,
        experienceMax: j.experienceMax !== undefined ? j.experienceMax : null,
        source: j.source || 'scanner',
        sourceUrl: j.url,
        fingerprint,
        fitScore: scoreData.fitScore,
        riskScore: scoreData.riskScore,
        overallScore: scoreData.overallScore,
        grade: scoreData.grade,
        qualityFlags: JSON.stringify(scoreData.qualityFlags),
        scoringDetails: JSON.stringify(scoreData),
        createdAt: now(),
        updatedAt: now()
      }).run();
      savedCount++;
    }
  }

  logAudit('jobs_scanned', 'jobs', undefined, { savedCount, totalFetched: fetchedJobs.length, filteredCount: filteredJobs.length });
  return c.json({ success: true, savedCount, totalFetched: fetchedJobs.length, errors });
});
