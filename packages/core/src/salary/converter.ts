/* =========================================================================
 * Career-Ops India — Salary Converter
 * Handles INR salary formats: LPA, monthly, CTC, in-hand estimates
 * All calculations are deterministic — no AI involved
 * ========================================================================= */

export interface SalaryBreakdown {
  annualCTC: number;
  monthlyGross: number;
  monthlyInHand: number;
  lpa: number;
  dailyRate: number;
  hourlyRate: number;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: 'INR';
  format: 'lpa' | 'monthly' | 'ctc' | 'hourly' | 'daily';
}

const STANDARD_DEDUCTIONS_RATIO = 0.25;

/** Convert LPA (Lakhs Per Annum) to full breakdown. */
export function lpaToBreakdown(lpa: number): SalaryBreakdown {
  const annualCTC = lpa * 100000;
  const monthlyGross = annualCTC / 12;
  const monthlyInHand = monthlyGross * (1 - STANDARD_DEDUCTIONS_RATIO);
  return {
    annualCTC,
    monthlyGross: Math.round(monthlyGross),
    monthlyInHand: Math.round(monthlyInHand),
    lpa,
    dailyRate: Math.round(annualCTC / 260),
    hourlyRate: Math.round(annualCTC / 2080),
  };
}

/** Convert monthly salary to full breakdown. */
export function monthlyToBreakdown(monthly: number): SalaryBreakdown {
  const annualCTC = monthly * 12;
  const lpa = annualCTC / 100000;
  const monthlyInHand = monthly * (1 - STANDARD_DEDUCTIONS_RATIO);
  return {
    annualCTC,
    monthlyGross: monthly,
    monthlyInHand: Math.round(monthlyInHand),
    lpa: Math.round(lpa * 100) / 100,
    dailyRate: Math.round(annualCTC / 260),
    hourlyRate: Math.round(annualCTC / 2080),
  };
}

/** Convert annual CTC to full breakdown. */
export function ctcToBreakdown(ctc: number): SalaryBreakdown {
  const lpa = ctc / 100000;
  const monthlyGross = ctc / 12;
  const monthlyInHand = monthlyGross * (1 - STANDARD_DEDUCTIONS_RATIO);
  return {
    annualCTC: ctc,
    monthlyGross: Math.round(monthlyGross),
    monthlyInHand: Math.round(monthlyInHand),
    lpa: Math.round(lpa * 100) / 100,
    dailyRate: Math.round(ctc / 260),
    hourlyRate: Math.round(ctc / 2080),
  };
}

/** Format salary in Indian numbering system (lakhs, crores). */
export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Format salary range as LPA string. */
export function formatLPARange(min: number, max: number): string {
  if (min === max) return `${min} LPA`;
  return `${min}–${max} LPA`;
}

/** Parse salary text to extract a range. */
export function parseSalaryText(text: string): SalaryRange | null {
  const cleaned = text.replace(/,/g, '').trim().toLowerCase();

  const lpaMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(?:lpa|l\.?p\.?a|lakhs?\s*(?:per\s*annum)?)/i);
  if (lpaMatch) {
    return { min: parseFloat(lpaMatch[1]), max: parseFloat(lpaMatch[2]), currency: 'INR', format: 'lpa' };
  }

  const singleLpa = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:lpa|l\.?p\.?a|lakhs?\s*(?:per\s*annum)?)/i);
  if (singleLpa) {
    const val = parseFloat(singleLpa[1]);
    return { min: val, max: val, currency: 'INR', format: 'lpa' };
  }

  const monthlyMatch = cleaned.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(?:k)?\s*(?:-|to|–)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:k)?\s*(?:per\s*month|monthly|pm|\/\s*month)/i);
  if (monthlyMatch) {
    let min = parseFloat(monthlyMatch[1]);
    let max = parseFloat(monthlyMatch[2]);
    if (cleaned.includes('k')) { min *= 1000; max *= 1000; }
    return { min, max, currency: 'INR', format: 'monthly' };
  }

  return null;
}

/** Market salary ranges for common roles (in LPA) — used for lowball detection. */
export const MARKET_RANGES: Record<string, { fresher: [number, number]; mid: [number, number]; senior: [number, number] }> = {
  software_engineer: { fresher: [3, 8], mid: [8, 20], senior: [20, 50] },
  data_analyst: { fresher: [3, 6], mid: [6, 15], senior: [15, 30] },
  product_manager: { fresher: [6, 12], mid: [12, 25], senior: [25, 50] },
  business_analyst: { fresher: [3, 7], mid: [7, 15], senior: [15, 30] },
  sales_executive: { fresher: [2, 5], mid: [5, 12], senior: [12, 25] },
  customer_support: { fresher: [1.8, 4], mid: [4, 8], senior: [8, 15] },
  hr_executive: { fresher: [2.5, 5], mid: [5, 12], senior: [12, 25] },
  finance_analyst: { fresher: [3, 7], mid: [7, 15], senior: [15, 35] },
  operations_manager: { fresher: [2.5, 5], mid: [5, 12], senior: [12, 25] },
  qa_engineer: { fresher: [3, 6], mid: [6, 15], senior: [15, 30] },
  devops_engineer: { fresher: [4, 8], mid: [8, 20], senior: [20, 45] },
  ui_ux_designer: { fresher: [3, 6], mid: [6, 15], senior: [15, 30] },
  content_writer: { fresher: [1.5, 4], mid: [4, 10], senior: [10, 20] },
  marketing_manager: { fresher: [3, 6], mid: [6, 15], senior: [15, 30] },
  admin_executive: { fresher: [1.8, 3.5], mid: [3.5, 7], senior: [7, 15] },
};

/** Detect lowball salary based on role and experience. */
export function isLowball(lpa: number, roleFamily: string, experienceYears: number): boolean {
  const range = MARKET_RANGES[roleFamily];
  if (!range) return false;

  let bracket: [number, number];
  if (experienceYears <= 1) bracket = range.fresher;
  else if (experienceYears <= 5) bracket = range.mid;
  else bracket = range.senior;

  return lpa < bracket[0] * 0.7;
}
