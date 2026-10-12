import type { OutageReport } from '../types';

// Deterministic reporter IDs for demo data — these represent separate,
// independent community members. They are pseudonymous identifiers,
// not real names or accounts.
const DEMO_REPORTERS = ['demo_r1', 'demo_r2', 'demo_r3', 'demo_r4', 'demo_r5', 'demo_r6'];

function isoDaysAgo(days: number, hour = 19): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// All demo data is clearly flagged with isDemo: true.
// It is illustrative sample data for the Lahore pilot — NOT live monitoring.
export const DEMO_REPORTS: OutageReport[] = [
  // Gulberg III — corroborated unplanned outage 2 days ago, 3 independent reporters
  {
    id: 'demo_001',
    city: 'Lahore',
    neighborhood: 'Gulberg III',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(2, 18),
    restorationDateTime: isoDaysAgo(2, 21),
    impact: 'study',
    notes: 'Power went out during evening study hours. Entire block affected.',
    reporterId: DEMO_REPORTERS[0],
    isDemo: true,
    createdAt: isoDaysAgo(2, 18),
  },
  {
    id: 'demo_002',
    city: 'Lahore',
    neighborhood: 'Gulberg III',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(2, 18),
    restorationDateTime: isoDaysAgo(2, 21),
    impact: 'work',
    notes: 'Working from home, lost an important video call.',
    reporterId: DEMO_REPORTERS[1],
    isDemo: true,
    createdAt: isoDaysAgo(2, 18),
  },
  {
    id: 'demo_003',
    city: 'Lahore',
    neighborhood: 'Gulberg III',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(2, 18),
    restorationDateTime: isoDaysAgo(2, 21),
    impact: 'business',
    notes: 'Small restaurant had to close for the evening.',
    reporterId: DEMO_REPORTERS[2],
    isDemo: true,
    createdAt: isoDaysAgo(2, 18),
  },

  // Johar Town Block H — corroborated unplanned outage 4 days ago, 2 independent reporters
  {
    id: 'demo_004',
    city: 'Lahore',
    neighborhood: 'Johar Town Block H',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(4, 6),
    restorationDateTime: isoDaysAgo(4, 10),
    impact: 'essential',
    notes: 'Water pump could not run. Difficult morning routine.',
    reporterId: DEMO_REPORTERS[3],
    isDemo: true,
    createdAt: isoDaysAgo(4, 6),
  },
  {
    id: 'demo_005',
    city: 'Lahore',
    neighborhood: 'Johar Town Block H',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(4, 6),
    restorationDateTime: isoDaysAgo(4, 10),
    impact: 'work',
    notes: 'No power for morning work shift.',
    reporterId: DEMO_REPORTERS[4],
    isDemo: true,
    createdAt: isoDaysAgo(4, 6),
  },

  // DHA Phase 5 — single report, planned outage 1 day ago
  {
    id: 'demo_006',
    city: 'Lahore',
    neighborhood: 'DHA Phase 5',
    provider: 'LESCO',
    type: 'planned',
    startDateTime: isoDaysAgo(1, 9),
    restorationDateTime: isoDaysAgo(1, 14),
    impact: 'study',
    notes: 'Scheduled maintenance notification received night before.',
    reporterId: DEMO_REPORTERS[5],
    isDemo: true,
    createdAt: isoDaysAgo(1, 9),
  },

  // Model Town Block E — corroborated outage 6 days ago, 2 independent reporters
  {
    id: 'demo_007',
    city: 'Lahore',
    neighborhood: 'Model Town Block E',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(6, 20),
    restorationDateTime: isoDaysAgo(6, 23),
    impact: 'business',
    notes: 'Electronics shop had to close early.',
    reporterId: DEMO_REPORTERS[0],
    isDemo: true,
    createdAt: isoDaysAgo(6, 20),
  },
  {
    id: 'demo_008',
    city: 'Lahore',
    neighborhood: 'Model Town Block E',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(6, 20),
    restorationDateTime: isoDaysAgo(6, 23),
    impact: null,
    notes: '',
    reporterId: DEMO_REPORTERS[2],
    isDemo: true,
    createdAt: isoDaysAgo(6, 20),
  },

  // Allama Iqbal Town — single report, ongoing
  {
    id: 'demo_009',
    city: 'Lahore',
    neighborhood: 'Allama Iqbal Town',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(0, 7),
    restorationDateTime: null,
    impact: 'essential',
    notes: 'Still without power as of this morning.',
    reporterId: DEMO_REPORTERS[1],
    isDemo: true,
    createdAt: isoDaysAgo(0, 7),
  },

  // Garden Town — single report 3 days ago
  {
    id: 'demo_010',
    city: 'Lahore',
    neighborhood: 'Garden Town',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(3, 15),
    restorationDateTime: isoDaysAgo(3, 17),
    impact: 'study',
    notes: 'Short outage during afternoon study session.',
    reporterId: DEMO_REPORTERS[3],
    isDemo: true,
    createdAt: isoDaysAgo(3, 15),
  },

  // Gulberg III — another outage 5 days ago, corroborated by 2 reporters
  {
    id: 'demo_011',
    city: 'Lahore',
    neighborhood: 'Gulberg III',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(5, 14),
    restorationDateTime: isoDaysAgo(5, 16),
    impact: 'work',
    notes: 'Afternoon outage, generator kicked in after an hour.',
    reporterId: DEMO_REPORTERS[4],
    isDemo: true,
    createdAt: isoDaysAgo(5, 14),
  },
  {
    id: 'demo_012',
    city: 'Lahore',
    neighborhood: 'Gulberg III',
    provider: 'LESCO',
    type: 'unplanned',
    startDateTime: isoDaysAgo(5, 14),
    restorationDateTime: isoDaysAgo(5, 16),
    impact: null,
    notes: '',
    reporterId: DEMO_REPORTERS[5],
    isDemo: true,
    createdAt: isoDaysAgo(5, 14),
  },
];
