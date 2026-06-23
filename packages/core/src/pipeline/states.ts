/* =========================================================================
 * Career-Ops India — Application Pipeline State Machine
 * Deterministic state transitions for application tracking
 * ========================================================================= */

export type ApplicationStatus =
  | 'discovered'
  | 'saved'
  | 'shortlisted'
  | 'resume_tailored'
  | 'applied'
  | 'assessment_pending'
  | 'interview_scheduled'
  | 'hr_round'
  | 'technical_round'
  | 'manager_round'
  | 'offer_received'
  | 'accepted'
  | 'rejected'
  | 'no_response'
  | 'follow_up_due'
  | 'archived';

export interface StatusInfo {
  id: ApplicationStatus;
  label: string;
  color: string;
  icon: string;
  order: number;
  isTerminal: boolean;
  category: 'pipeline' | 'interview' | 'outcome' | 'other';
}

export const APPLICATION_STATUSES: StatusInfo[] = [
  { id: 'discovered', label: 'Discovered', color: '#64748b', icon: '🔍', order: 1, isTerminal: false, category: 'pipeline' },
  { id: 'saved', label: 'Saved', color: '#6366f1', icon: '💾', order: 2, isTerminal: false, category: 'pipeline' },
  { id: 'shortlisted', label: 'Shortlisted', color: '#8b5cf6', icon: '⭐', order: 3, isTerminal: false, category: 'pipeline' },
  { id: 'resume_tailored', label: 'Resume Tailored', color: '#a855f7', icon: '📝', order: 4, isTerminal: false, category: 'pipeline' },
  { id: 'applied', label: 'Applied', color: '#3b82f6', icon: '📤', order: 5, isTerminal: false, category: 'pipeline' },
  { id: 'assessment_pending', label: 'Assessment Pending', color: '#f59e0b', icon: '📋', order: 6, isTerminal: false, category: 'interview' },
  { id: 'interview_scheduled', label: 'Interview Scheduled', color: '#f97316', icon: '📅', order: 7, isTerminal: false, category: 'interview' },
  { id: 'hr_round', label: 'HR Round', color: '#ec4899', icon: '💼', order: 8, isTerminal: false, category: 'interview' },
  { id: 'technical_round', label: 'Technical Round', color: '#14b8a6', icon: '💻', order: 9, isTerminal: false, category: 'interview' },
  { id: 'manager_round', label: 'Manager Round', color: '#06b6d4', icon: '👔', order: 10, isTerminal: false, category: 'interview' },
  { id: 'offer_received', label: 'Offer Received', color: '#22c55e', icon: '🎉', order: 11, isTerminal: false, category: 'outcome' },
  { id: 'accepted', label: 'Accepted', color: '#10b981', icon: '✅', order: 12, isTerminal: true, category: 'outcome' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444', icon: '❌', order: 13, isTerminal: true, category: 'outcome' },
  { id: 'no_response', label: 'No Response', color: '#9ca3af', icon: '😶', order: 14, isTerminal: false, category: 'other' },
  { id: 'follow_up_due', label: 'Follow-up Due', color: '#eab308', icon: '⏰', order: 15, isTerminal: false, category: 'other' },
  { id: 'archived', label: 'Archived', color: '#6b7280', icon: '📦', order: 16, isTerminal: true, category: 'other' },
];

/** Valid state transitions map. */
export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  discovered: ['saved', 'archived'],
  saved: ['shortlisted', 'archived'],
  shortlisted: ['resume_tailored', 'applied', 'archived'],
  resume_tailored: ['applied', 'archived'],
  applied: ['assessment_pending', 'interview_scheduled', 'hr_round', 'rejected', 'no_response', 'follow_up_due', 'archived'],
  assessment_pending: ['interview_scheduled', 'hr_round', 'rejected', 'follow_up_due', 'archived'],
  interview_scheduled: ['hr_round', 'technical_round', 'rejected', 'follow_up_due', 'archived'],
  hr_round: ['technical_round', 'manager_round', 'offer_received', 'rejected', 'follow_up_due', 'archived'],
  technical_round: ['manager_round', 'offer_received', 'rejected', 'follow_up_due', 'archived'],
  manager_round: ['offer_received', 'rejected', 'follow_up_due', 'archived'],
  offer_received: ['accepted', 'rejected', 'archived'],
  accepted: ['archived'],
  rejected: ['archived'],
  no_response: ['follow_up_due', 'archived'],
  follow_up_due: ['interview_scheduled', 'hr_round', 'rejected', 'no_response', 'archived'],
  archived: [],
};

/** Check whether a transition is valid. */
export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Get status info by ID. */
export function getStatusInfo(status: ApplicationStatus): StatusInfo | undefined {
  return APPLICATION_STATUSES.find(s => s.id === status);
}

/** Get statuses by category. */
export function getStatusesByCategory(category: StatusInfo['category']): StatusInfo[] {
  return APPLICATION_STATUSES.filter(s => s.category === category);
}
