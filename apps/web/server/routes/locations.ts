import { Hono } from 'hono';
import { STATES, CITIES, REGION_GROUPS } from '@career-ops/locations';
import { calculateInHandSalary } from '@career-ops/core';

export const locationsRouter = new Hono();

locationsRouter.post('/api/salary/calculate', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const lpa = parseFloat(body?.lpa || '0');
  const isMetro = body?.isMetro !== false;
  if (!lpa || isNaN(lpa) || lpa <= 0) {
    return c.json({ error: 'Valid LPA value is required' }, 400);
  }
  const result = calculateInHandSalary(lpa, isMetro);
  return c.json(result);
});

locationsRouter.get('/api/locations/states', (c) => c.json(STATES));

locationsRouter.get('/api/locations/cities', (c) => {
  const { search, stateCode } = c.req.query();
  if (search) {
    const q = search.toLowerCase();
    const matches = CITIES.filter(city => city.name.toLowerCase().includes(q) || city.district.toLowerCase().includes(q));
    return c.json(matches.slice(0, 20));
  }
  if (stateCode) {
    return c.json(CITIES.filter(city => city.stateCode === stateCode));
  }
  return c.json(CITIES);
});

locationsRouter.get('/api/locations/regions', (c) => c.json(REGION_GROUPS));

locationsRouter.get('/api/locations/work-modes', (c) => c.json({
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site / WFO',
  wfh: 'Work from Home',
  india_remote: 'Remote (India)',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
  walk_in: 'Walk-in',
  field_role: 'Field Role',
  part_time: 'Part-time',
  full_time: 'Full-time',
}));
