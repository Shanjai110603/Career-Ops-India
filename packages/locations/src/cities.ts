/* =========================================================================
 * Career-Ops India — Major Indian Cities with Tier Classification
 * ========================================================================= */

export type CityTier = 'metro' | 'tier1' | 'tier2' | 'tier3';

export interface City {
  name: string;
  alternateNames: string[];
  stateCode: string;
  district: string;
  tier: CityTier;
  isMetro: boolean;
  metroArea?: string;
  pinPrefix?: string[];
  population?: string;
}

export const CITIES: City[] = [
  // === METRO CITIES ===
  { name: 'Mumbai', alternateNames: ['Bombay'], stateCode: 'MH', district: 'Mumbai', tier: 'metro', isMetro: true, metroArea: 'Mumbai Metropolitan Region', pinPrefix: ['400'] },
  { name: 'Navi Mumbai', alternateNames: ['New Bombay'], stateCode: 'MH', district: 'Thane', tier: 'metro', isMetro: true, metroArea: 'Mumbai Metropolitan Region', pinPrefix: ['400'] },
  { name: 'Thane', alternateNames: [], stateCode: 'MH', district: 'Thane', tier: 'tier1', isMetro: true, metroArea: 'Mumbai Metropolitan Region', pinPrefix: ['400'] },
  { name: 'Delhi', alternateNames: ['New Delhi', 'Delhi NCR'], stateCode: 'DL', district: 'Delhi', tier: 'metro', isMetro: true, metroArea: 'Delhi NCR', pinPrefix: ['110'] },
  { name: 'Gurgaon', alternateNames: ['Gurugram'], stateCode: 'HR', district: 'Gurugram', tier: 'metro', isMetro: true, metroArea: 'Delhi NCR', pinPrefix: ['122'] },
  { name: 'Noida', alternateNames: ['Greater Noida'], stateCode: 'UP', district: 'Gautam Buddh Nagar', tier: 'metro', isMetro: true, metroArea: 'Delhi NCR', pinPrefix: ['201'] },
  { name: 'Faridabad', alternateNames: [], stateCode: 'HR', district: 'Faridabad', tier: 'tier1', isMetro: true, metroArea: 'Delhi NCR', pinPrefix: ['121'] },
  { name: 'Ghaziabad', alternateNames: [], stateCode: 'UP', district: 'Ghaziabad', tier: 'tier1', isMetro: true, metroArea: 'Delhi NCR', pinPrefix: ['201'] },
  { name: 'Bengaluru', alternateNames: ['Bangalore', 'BLR'], stateCode: 'KA', district: 'Bengaluru Urban', tier: 'metro', isMetro: true, metroArea: 'Bengaluru Metro', pinPrefix: ['560'] },
  { name: 'Hyderabad', alternateNames: ['HYD', 'Cyberabad'], stateCode: 'TS', district: 'Hyderabad', tier: 'metro', isMetro: true, metroArea: 'Hyderabad Metro', pinPrefix: ['500'] },
  { name: 'Chennai', alternateNames: ['Madras', 'MAA'], stateCode: 'TN', district: 'Chennai', tier: 'metro', isMetro: true, metroArea: 'Chennai Metro', pinPrefix: ['600'] },
  { name: 'Kolkata', alternateNames: ['Calcutta', 'CCU'], stateCode: 'WB', district: 'Kolkata', tier: 'metro', isMetro: true, metroArea: 'Kolkata Metro', pinPrefix: ['700'] },
  { name: 'Pune', alternateNames: ['Poona'], stateCode: 'MH', district: 'Pune', tier: 'metro', isMetro: true, metroArea: 'Pune Metro', pinPrefix: ['411'] },
  { name: 'Ahmedabad', alternateNames: ['Amdavad'], stateCode: 'GJ', district: 'Ahmedabad', tier: 'metro', isMetro: true, metroArea: 'Ahmedabad Metro', pinPrefix: ['380'] },

  // === TIER 1 CITIES ===
  { name: 'Jaipur', alternateNames: ['Pink City'], stateCode: 'RJ', district: 'Jaipur', tier: 'tier1', isMetro: false, pinPrefix: ['302'] },
  { name: 'Lucknow', alternateNames: [], stateCode: 'UP', district: 'Lucknow', tier: 'tier1', isMetro: false, pinPrefix: ['226'] },
  { name: 'Chandigarh', alternateNames: ['CHD'], stateCode: 'CH', district: 'Chandigarh', tier: 'tier1', isMetro: false, pinPrefix: ['160'] },
  { name: 'Kochi', alternateNames: ['Cochin', 'Ernakulam'], stateCode: 'KL', district: 'Ernakulam', tier: 'tier1', isMetro: false, pinPrefix: ['682'] },
  { name: 'Thiruvananthapuram', alternateNames: ['Trivandrum', 'TRV'], stateCode: 'KL', district: 'Thiruvananthapuram', tier: 'tier1', isMetro: false, pinPrefix: ['695'] },
  { name: 'Coimbatore', alternateNames: ['Kovai'], stateCode: 'TN', district: 'Coimbatore', tier: 'tier1', isMetro: false, pinPrefix: ['641'] },
  { name: 'Indore', alternateNames: [], stateCode: 'MP', district: 'Indore', tier: 'tier1', isMetro: false, pinPrefix: ['452'] },
  { name: 'Bhopal', alternateNames: [], stateCode: 'MP', district: 'Bhopal', tier: 'tier1', isMetro: false, pinPrefix: ['462'] },
  { name: 'Nagpur', alternateNames: [], stateCode: 'MH', district: 'Nagpur', tier: 'tier1', isMetro: false, pinPrefix: ['440'] },
  { name: 'Visakhapatnam', alternateNames: ['Vizag'], stateCode: 'AP', district: 'Visakhapatnam', tier: 'tier1', isMetro: false, pinPrefix: ['530'] },
  { name: 'Vadodara', alternateNames: ['Baroda'], stateCode: 'GJ', district: 'Vadodara', tier: 'tier1', isMetro: false, pinPrefix: ['390'] },
  { name: 'Surat', alternateNames: [], stateCode: 'GJ', district: 'Surat', tier: 'tier1', isMetro: false, pinPrefix: ['395'] },
  { name: 'Patna', alternateNames: [], stateCode: 'BR', district: 'Patna', tier: 'tier1', isMetro: false, pinPrefix: ['800'] },
  { name: 'Bhubaneswar', alternateNames: [], stateCode: 'OR', district: 'Khordha', tier: 'tier1', isMetro: false, pinPrefix: ['751'] },
  { name: 'Mangaluru', alternateNames: ['Mangalore'], stateCode: 'KA', district: 'Dakshina Kannada', tier: 'tier1', isMetro: false, pinPrefix: ['575'] },
  { name: 'Mysuru', alternateNames: ['Mysore'], stateCode: 'KA', district: 'Mysuru', tier: 'tier1', isMetro: false, pinPrefix: ['570'] },
  { name: 'Madurai', alternateNames: [], stateCode: 'TN', district: 'Madurai', tier: 'tier1', isMetro: false, pinPrefix: ['625'] },
  { name: 'Ranchi', alternateNames: [], stateCode: 'JH', district: 'Ranchi', tier: 'tier1', isMetro: false, pinPrefix: ['834'] },
  { name: 'Dehradun', alternateNames: [], stateCode: 'UK', district: 'Dehradun', tier: 'tier1', isMetro: false, pinPrefix: ['248'] },
  { name: 'Raipur', alternateNames: [], stateCode: 'CG', district: 'Raipur', tier: 'tier1', isMetro: false, pinPrefix: ['492'] },
  { name: 'Vijayawada', alternateNames: ['Bezawada'], stateCode: 'AP', district: 'Krishna', tier: 'tier1', isMetro: false, pinPrefix: ['520'] },
  { name: 'Guwahati', alternateNames: ['Gauhati'], stateCode: 'AS', district: 'Kamrup Metropolitan', tier: 'tier1', isMetro: false, pinPrefix: ['781'] },
  { name: 'Panaji', alternateNames: ['Panjim', 'Goa'], stateCode: 'GA', district: 'North Goa', tier: 'tier1', isMetro: false, pinPrefix: ['403'] },

  // === TIER 2 CITIES ===
  { name: 'Agra', alternateNames: [], stateCode: 'UP', district: 'Agra', tier: 'tier2', isMetro: false, pinPrefix: ['282'] },
  { name: 'Varanasi', alternateNames: ['Benaras', 'Kashi'], stateCode: 'UP', district: 'Varanasi', tier: 'tier2', isMetro: false, pinPrefix: ['221'] },
  { name: 'Kanpur', alternateNames: ['Cawnpore'], stateCode: 'UP', district: 'Kanpur Nagar', tier: 'tier2', isMetro: false, pinPrefix: ['208'] },
  { name: 'Jodhpur', alternateNames: ['Blue City'], stateCode: 'RJ', district: 'Jodhpur', tier: 'tier2', isMetro: false, pinPrefix: ['342'] },
  { name: 'Udaipur', alternateNames: ['Lake City'], stateCode: 'RJ', district: 'Udaipur', tier: 'tier2', isMetro: false, pinPrefix: ['313'] },
  { name: 'Nashik', alternateNames: ['Nasik'], stateCode: 'MH', district: 'Nashik', tier: 'tier2', isMetro: false, pinPrefix: ['422'] },
  { name: 'Aurangabad', alternateNames: ['Sambhajinagar'], stateCode: 'MH', district: 'Aurangabad', tier: 'tier2', isMetro: false, pinPrefix: ['431'] },
  { name: 'Rajkot', alternateNames: [], stateCode: 'GJ', district: 'Rajkot', tier: 'tier2', isMetro: false, pinPrefix: ['360'] },
  { name: 'Hubli', alternateNames: ['Hubli-Dharwad', 'Hubballi'], stateCode: 'KA', district: 'Dharwad', tier: 'tier2', isMetro: false, pinPrefix: ['580'] },
  { name: 'Tiruchirappalli', alternateNames: ['Trichy'], stateCode: 'TN', district: 'Tiruchirappalli', tier: 'tier2', isMetro: false, pinPrefix: ['620'] },
  { name: 'Salem', alternateNames: [], stateCode: 'TN', district: 'Salem', tier: 'tier2', isMetro: false, pinPrefix: ['636'] },
  { name: 'Thrissur', alternateNames: ['Trichur'], stateCode: 'KL', district: 'Thrissur', tier: 'tier2', isMetro: false, pinPrefix: ['680'] },
  { name: 'Kozhikode', alternateNames: ['Calicut'], stateCode: 'KL', district: 'Kozhikode', tier: 'tier2', isMetro: false, pinPrefix: ['673'] },
  { name: 'Kolhapur', alternateNames: [], stateCode: 'MH', district: 'Kolhapur', tier: 'tier2', isMetro: false, pinPrefix: ['416'] },
  { name: 'Jabalpur', alternateNames: [], stateCode: 'MP', district: 'Jabalpur', tier: 'tier2', isMetro: false, pinPrefix: ['482'] },
  { name: 'Gwalior', alternateNames: [], stateCode: 'MP', district: 'Gwalior', tier: 'tier2', isMetro: false, pinPrefix: ['474'] },
  { name: 'Amritsar', alternateNames: [], stateCode: 'PB', district: 'Amritsar', tier: 'tier2', isMetro: false, pinPrefix: ['143'] },
  { name: 'Ludhiana', alternateNames: [], stateCode: 'PB', district: 'Ludhiana', tier: 'tier2', isMetro: false, pinPrefix: ['141'] },
  { name: 'Meerut', alternateNames: [], stateCode: 'UP', district: 'Meerut', tier: 'tier2', isMetro: false, pinPrefix: ['250'] },
  { name: 'Allahabad', alternateNames: ['Prayagraj'], stateCode: 'UP', district: 'Prayagraj', tier: 'tier2', isMetro: false, pinPrefix: ['211'] },
  { name: 'Tirupati', alternateNames: [], stateCode: 'AP', district: 'Tirupati', tier: 'tier2', isMetro: false, pinPrefix: ['517'] },
  { name: 'Warangal', alternateNames: [], stateCode: 'TS', district: 'Warangal', tier: 'tier2', isMetro: false, pinPrefix: ['506'] },
  { name: 'Cuttack', alternateNames: [], stateCode: 'OR', district: 'Cuttack', tier: 'tier2', isMetro: false, pinPrefix: ['753'] },
  { name: 'Jamshedpur', alternateNames: ['Tatanagar'], stateCode: 'JH', district: 'East Singhbhum', tier: 'tier2', isMetro: false, pinPrefix: ['831'] },
  { name: 'Shimla', alternateNames: ['Simla'], stateCode: 'HP', district: 'Shimla', tier: 'tier2', isMetro: false, pinPrefix: ['171'] },
];

export const CITIES_MAP = new Map(CITIES.map(c => [c.name.toLowerCase(), c]));

export function findCity(name: string): City | undefined {
  const lower = name.toLowerCase().trim();
  return CITIES.find(c =>
    c.name.toLowerCase() === lower ||
    c.alternateNames.some(a => a.toLowerCase() === lower)
  );
}

export function getCitiesByState(stateCode: string): City[] {
  return CITIES.filter(c => c.stateCode === stateCode);
}

export function getCitiesByTier(tier: CityTier): City[] {
  return CITIES.filter(c => c.tier === tier);
}

export function getMetroCities(): City[] {
  return CITIES.filter(c => c.isMetro);
}

export function getCitiesByMetroArea(metroArea: string): City[] {
  return CITIES.filter(c => c.metroArea === metroArea);
}

export function searchCities(query: string): City[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  return CITIES.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.alternateNames.some(a => a.toLowerCase().includes(lower)) ||
    c.district.toLowerCase().includes(lower)
  ).slice(0, 20);
}
