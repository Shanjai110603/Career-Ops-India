/* =========================================================================
 * Career-Ops India — Locations Package Entry Point
 * ========================================================================= */

export { STATES, STATES_MAP, findStateByName, getStatesByRegion } from './states.js';
export type { State, Region } from './states.js';

export { CITIES, CITIES_MAP, findCity, getCitiesByState, getCitiesByTier, getMetroCities, getCitiesByMetroArea, searchCities } from './cities.js';
export type { City, CityTier } from './cities.js';

export { REGION_GROUPS, METRO_AREAS, WORK_MODE_LABELS, EXPERIENCE_LABELS, areCitiesNearby, getRegionForState, matchesLocationFilter } from './regions.js';
export type { RegionGroup, WorkMode, ExperienceLevel, LocationFilter } from './regions.js';
