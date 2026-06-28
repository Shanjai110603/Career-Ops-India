/* =========================================================================
 * Career-Ops India — Region & Proximity Utilities
 * ========================================================================= */

import { type City, findCity } from './cities.js';

export interface RegionGroup {
  id: string;
  name: string;
  states: string[];
}

export const REGION_GROUPS: RegionGroup[] = [
  { id: 'south', name: 'South India', states: ['KA', 'TN', 'KL', 'AP', 'TS', 'PY', 'AN', 'LD'] },
  { id: 'north', name: 'North India', states: ['UP', 'UK', 'PB', 'HP', 'JK', 'LA', 'CH'] },
  { id: 'ncr', name: 'Delhi NCR', states: ['DL', 'HR'] },
  { id: 'west', name: 'West India', states: ['MH', 'GJ', 'RJ', 'GA', 'DD'] },
  { id: 'east', name: 'East India', states: ['WB', 'OR', 'BR', 'JH'] },
  { id: 'central', name: 'Central India', states: ['MP', 'CG'] },
  { id: 'northeast', name: 'Northeast India', states: ['AS', 'ML', 'MN', 'MZ', 'TR', 'NL', 'AR', 'SK'] },
];

export const METRO_AREAS = [
  'Mumbai Metropolitan Region',
  'Delhi NCR',
  'Bengaluru Metro',
  'Hyderabad Metro',
  'Chennai Metro',
  'Kolkata Metro',
  'Pune Metro',
  'Ahmedabad Metro',
] as const;

export type WorkMode =
  | 'remote'
  | 'hybrid'
  | 'onsite'
  | 'wfh'
  | 'work_from_anywhere'
  | 'india_remote'
  | 'international_remote'
  | 'contract'
  | 'internship'
  | 'apprenticeship'
  | 'part_time'
  | 'full_time'
  | 'freelance'
  | 'walk_in'
  | 'campus_hiring'
  | 'off_campus'
  | 'field_role'
  | 'branch_based'
  | 'travel_heavy'
  | 'night_shift'
  | 'rotational_shift';

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site / WFO',
  wfh: 'Work from Home',
  work_from_anywhere: 'Work from Anywhere',
  india_remote: 'Remote (India)',
  international_remote: 'Remote (International)',
  contract: 'Contract',
  internship: 'Internship',
  apprenticeship: 'Apprenticeship',
  part_time: 'Part-time',
  full_time: 'Full-time',
  freelance: 'Freelance',
  walk_in: 'Walk-in',
  campus_hiring: 'Campus Hiring',
  off_campus: 'Off-campus',
  field_role: 'Field Role',
  branch_based: 'Branch-based',
  travel_heavy: 'Travel-heavy',
  night_shift: 'Night Shift',
  rotational_shift: 'Rotational Shift',
};

export type ExperienceLevel =
  | 'fresher'
  | '0_1'
  | '1_3'
  | '3_5'
  | '5_10'
  | '10_plus'
  | 'entry_level'
  | 'internship'
  | 'traineeship';

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  fresher: 'Fresher',
  '0_1': '0–1 Year',
  '1_3': '1–3 Years',
  '3_5': '3–5 Years',
  '5_10': '5–10 Years',
  '10_plus': '10+ Years',
  entry_level: 'Entry Level',
  internship: 'Internship',
  traineeship: 'Traineeship',
};

export interface LocationFilter {
  country?: 'india' | 'international';
  states?: string[];
  districts?: string[];
  cities?: string[];
  regions?: string[];
  tiers?: ('metro' | 'tier1' | 'tier2' | 'tier3')[];
  metroAreas?: string[];
  workModes?: WorkMode[];
  relocationRequired?: boolean;
  nearCity?: string;
  radiusKm?: number;
}

/** Check whether two cities are "nearby" based on simple state/metro area proximity. */
export function areCitiesNearby(cityA: string, cityB: string): boolean {
  const a = findCity(cityA);
  const b = findCity(cityB);
  if (!a || !b) return false;
  if (a.stateCode === b.stateCode) return true;
  if (a.metroArea && a.metroArea === b.metroArea) return true;
  return false;
}

/** Get region name for a state code. */
export function getRegionForState(stateCode: string): string | undefined {
  const group = REGION_GROUPS.find(g => g.states.includes(stateCode));
  return group?.name;
}

/** Check whether a city matches a location filter. */
export function matchesLocationFilter(city: City, filter: LocationFilter): boolean {
  if (filter.states?.length && !filter.states.includes(city.stateCode)) return false;
  if (filter.cities?.length && !filter.cities.some(c => c.toLowerCase() === city.name.toLowerCase())) return false;
  if (filter.tiers?.length && !filter.tiers.includes(city.tier)) return false;
  if (filter.regions?.length) {
    const cityRegion = REGION_GROUPS.find(g => g.states.includes(city.stateCode));
    if (!cityRegion || !filter.regions.includes(cityRegion.id)) return false;
  }
  if (filter.metroAreas?.length) {
    if (!city.metroArea || !filter.metroAreas.includes(city.metroArea)) return false;
  }
  return true;
}
