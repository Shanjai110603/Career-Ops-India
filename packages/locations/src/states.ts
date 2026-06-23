/* =========================================================================
 * Career-Ops India — India Location Data: States & Union Territories
 * All 28 states and 8 union territories with metadata
 * ========================================================================= */

export interface State {
  code: string;
  name: string;
  alternateNames: string[];
  capital: string;
  region: Region;
  isUT: boolean;
}

export type Region = 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast' | 'ncr';

export const STATES: State[] = [
  // === NORTH ===
  { code: 'DL', name: 'Delhi', alternateNames: ['New Delhi', 'NCR', 'Delhi NCR'], capital: 'New Delhi', region: 'ncr', isUT: true },
  { code: 'HR', name: 'Haryana', alternateNames: ['HR'], capital: 'Chandigarh', region: 'ncr', isUT: false },
  { code: 'UP', name: 'Uttar Pradesh', alternateNames: ['UP'], capital: 'Lucknow', region: 'north', isUT: false },
  { code: 'UK', name: 'Uttarakhand', alternateNames: ['Uttaranchal'], capital: 'Dehradun', region: 'north', isUT: false },
  { code: 'PB', name: 'Punjab', alternateNames: ['PB'], capital: 'Chandigarh', region: 'north', isUT: false },
  { code: 'HP', name: 'Himachal Pradesh', alternateNames: ['HP'], capital: 'Shimla', region: 'north', isUT: false },
  { code: 'JK', name: 'Jammu & Kashmir', alternateNames: ['J&K', 'Jammu and Kashmir'], capital: 'Srinagar', region: 'north', isUT: true },
  { code: 'LA', name: 'Ladakh', alternateNames: [], capital: 'Leh', region: 'north', isUT: true },
  { code: 'CH', name: 'Chandigarh', alternateNames: [], capital: 'Chandigarh', region: 'north', isUT: true },
  // === SOUTH ===
  { code: 'KA', name: 'Karnataka', alternateNames: ['KA'], capital: 'Bengaluru', region: 'south', isUT: false },
  { code: 'TN', name: 'Tamil Nadu', alternateNames: ['TN'], capital: 'Chennai', region: 'south', isUT: false },
  { code: 'KL', name: 'Kerala', alternateNames: ['KL'], capital: 'Thiruvananthapuram', region: 'south', isUT: false },
  { code: 'AP', name: 'Andhra Pradesh', alternateNames: ['AP'], capital: 'Amaravati', region: 'south', isUT: false },
  { code: 'TS', name: 'Telangana', alternateNames: ['TG'], capital: 'Hyderabad', region: 'south', isUT: false },
  { code: 'PY', name: 'Puducherry', alternateNames: ['Pondicherry'], capital: 'Puducherry', region: 'south', isUT: true },
  { code: 'AN', name: 'Andaman & Nicobar Islands', alternateNames: ['Andaman', 'A&N'], capital: 'Port Blair', region: 'south', isUT: true },
  { code: 'LD', name: 'Lakshadweep', alternateNames: [], capital: 'Kavaratti', region: 'south', isUT: true },
  // === WEST ===
  { code: 'MH', name: 'Maharashtra', alternateNames: ['MH'], capital: 'Mumbai', region: 'west', isUT: false },
  { code: 'GJ', name: 'Gujarat', alternateNames: ['GJ'], capital: 'Gandhinagar', region: 'west', isUT: false },
  { code: 'RJ', name: 'Rajasthan', alternateNames: ['RJ'], capital: 'Jaipur', region: 'west', isUT: false },
  { code: 'GA', name: 'Goa', alternateNames: [], capital: 'Panaji', region: 'west', isUT: false },
  { code: 'DD', name: 'Dadra & Nagar Haveli and Daman & Diu', alternateNames: ['DNH', 'Dadra', 'Daman', 'Diu'], capital: 'Daman', region: 'west', isUT: true },
  // === EAST ===
  { code: 'WB', name: 'West Bengal', alternateNames: ['WB', 'Bengal'], capital: 'Kolkata', region: 'east', isUT: false },
  { code: 'OR', name: 'Odisha', alternateNames: ['Orissa'], capital: 'Bhubaneswar', region: 'east', isUT: false },
  { code: 'BR', name: 'Bihar', alternateNames: ['BR'], capital: 'Patna', region: 'east', isUT: false },
  { code: 'JH', name: 'Jharkhand', alternateNames: ['JH'], capital: 'Ranchi', region: 'east', isUT: false },
  // === CENTRAL ===
  { code: 'MP', name: 'Madhya Pradesh', alternateNames: ['MP'], capital: 'Bhopal', region: 'central', isUT: false },
  { code: 'CG', name: 'Chhattisgarh', alternateNames: ['CG'], capital: 'Raipur', region: 'central', isUT: false },
  // === NORTHEAST ===
  { code: 'AS', name: 'Assam', alternateNames: ['AS'], capital: 'Dispur', region: 'northeast', isUT: false },
  { code: 'ML', name: 'Meghalaya', alternateNames: [], capital: 'Shillong', region: 'northeast', isUT: false },
  { code: 'MN', name: 'Manipur', alternateNames: [], capital: 'Imphal', region: 'northeast', isUT: false },
  { code: 'MZ', name: 'Mizoram', alternateNames: [], capital: 'Aizawl', region: 'northeast', isUT: false },
  { code: 'TR', name: 'Tripura', alternateNames: [], capital: 'Agartala', region: 'northeast', isUT: false },
  { code: 'NL', name: 'Nagaland', alternateNames: [], capital: 'Kohima', region: 'northeast', isUT: false },
  { code: 'AR', name: 'Arunachal Pradesh', alternateNames: ['AP (NE)'], capital: 'Itanagar', region: 'northeast', isUT: false },
  { code: 'SK', name: 'Sikkim', alternateNames: [], capital: 'Gangtok', region: 'northeast', isUT: false },
];

export const STATES_MAP = new Map(STATES.map(s => [s.code, s]));

export function findStateByName(name: string): State | undefined {
  const lower = name.toLowerCase().trim();
  return STATES.find(s =>
    s.name.toLowerCase() === lower ||
    s.code.toLowerCase() === lower ||
    s.alternateNames.some(a => a.toLowerCase() === lower)
  );
}

export function getStatesByRegion(region: Region): State[] {
  return STATES.filter(s => s.region === region);
}
