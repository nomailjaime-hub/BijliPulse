import type { OutageReport, NeighborhoodSignal, OutageEvent, ActivityDataPoint, ConfidenceTier } from '../types';
import { DEMO_REPORTS } from '../data/demoData';

const STORAGE_KEY = 'bijlipulse_reports_v1';

export function generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateReporterId(): string {
  return `usr_r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadUserReports(): OutageReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OutageReport[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveUserReports(reports: OutageReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // storage might be full or unavailable — fail silently
  }
}

export function clearUserReports(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getAllReports(): OutageReport[] {
  const userReports = loadUserReports();
  // Demo reports first, then user reports — user reports take recency precedence
  // in sorting downstream
  return [...DEMO_REPORTS, ...userReports];
}

/**
 * Two reports overlap in time if their outage windows intersect.
 * A report with null restoration is treated as ongoing (extends to now).
 */
function reportsOverlap(a: OutageReport, b: OutageReport): boolean {
  const aStart = new Date(a.startDateTime).getTime();
  const aEnd = a.restorationDateTime ? new Date(a.restorationDateTime).getTime() : Date.now();
  const bStart = new Date(b.startDateTime).getTime();
  const bEnd = b.restorationDateTime ? new Date(b.restorationDateTime).getTime() : Date.now();
  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Group reports into outage events within a neighborhood.
 * Reports in the same neighborhood whose time windows overlap are
 * grouped into a single outage event.
 */
export function groupIntoEvents(reports: OutageReport[]): OutageEvent[] {
  const events: OutageEvent[] = [];
  const used = new Set<string>();

  // Sort by start time ascending for deterministic grouping
  const sorted = [...reports].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  for (const seed of sorted) {
    if (used.has(seed.id)) continue;
    const group: OutageReport[] = [seed];
    used.add(seed.id);

    for (const candidate of sorted) {
      if (used.has(candidate.id)) continue;
      if (candidate.neighborhood !== seed.neighborhood) continue;
      if (candidate.city !== seed.city) continue;
      // Check if candidate overlaps any report already in the group
      const overlaps = group.some((g) => reportsOverlap(g, candidate));
      if (overlaps) {
        group.push(candidate);
        used.add(candidate.id);
      }
    }

    const startDateTime = group
      .map((r) => new Date(r.startDateTime).getTime())
      .reduce((min, t) => (t < min ? t : min), Infinity);
    const endTimes = group
      .filter((r) => r.restorationDateTime !== null)
      .map((r) => new Date(r.restorationDateTime as string).getTime());
    const endDateTime = endTimes.length > 0 ? Math.max(...endTimes) : null;

    const reporterIds = new Set(group.map((r) => r.reporterId));
    const providers = [...new Set(group.map((r) => r.provider))];
    const impacts = [...new Set(group.map((r) => r.impact).filter((i): i is NonNullable<typeof i> => i !== null))];

    const reportedDurationHours = endDateTime
      ? Math.round(((endDateTime - startDateTime) / (1000 * 60 * 60)) * 10) / 10
      : Math.round(((Date.now() - startDateTime) / (1000 * 60 * 60)) * 10) / 10;

    events.push({
      id: `evt_${group.map((r) => r.id).join('_').slice(0, 40)}`,
      neighborhood: seed.neighborhood,
      city: seed.city,
      reports: group.sort(
        (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      ),
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
      reporterCount: group.length,
      independentReporterCount: reporterIds.size,
      reportedDurationHours,
      type: group[0].type,
      providers,
      impacts,
    });
  }

  return events.sort(
    (a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
  );
}

/**
 * === CONFIDENCE SCORING ALGORITHM ===
 *
 * This is a DETERMINISTIC, documented algorithm. It describes EVIDENCE STRENGTH
 * — not official verification. A high score means multiple independent community
 * members reported overlapping outages recently. It does NOT mean the outage has
 * been verified by authorities.
 *
 * Score components (max 100):
 *   1. Corroboration (max 50 points)
 *      - 1 independent reporter: 10 points
 *      - 2 independent reporters: 30 points
 *      - 3+ independent reporters: 50 points
 *      "Independent" means distinct reporterId values. We cannot verify that
 *      reporters are truly different people — see data limitations in the UI.
 *
 *   2. Recency (max 30 points)
 *      - Reported within last 24 hours: 30 points
 *      - Within 2 days: 22 points
 *      - Within 3 days: 16 points
 *      - Within 5 days: 10 points
 *      - Within 7 days: 5 points
 *      - Older than 7 days: 0 points (and tier becomes "expired")
 *
 *   3. Detail completeness (max 20 points)
 *      - Has restoration time: +8
 *      - Has impact specified: +6
 *      - Has notes: +6
 *
 * Tiers:
 *   - high:       score >= 60
 *   - moderate:   score >= 35
 *   - low:        score >= 10
 *   - expired:    last report older than 7 days
 *   - insufficient: fewer than 1 report (should not normally occur)
 */
export function computeConfidenceScore(events: OutageEvent[]): { score: number; tier: ConfidenceTier } {
  if (events.length === 0) {
    return { score: 0, tier: 'insufficient' };
  }

  // Use the most recent event for recency
  const mostRecentStart = Math.max(
    ...events.map((e) => new Date(e.startDateTime).getTime())
  );
  const hoursSinceReport = (Date.now() - mostRecentStart) / (1000 * 60 * 60);

  // Sum corroboration across all events
  const maxIndependent = Math.max(...events.map((e) => e.independentReporterCount));

  // 1. Corroboration
  let corroboration = 10;
  if (maxIndependent >= 3) corroboration = 50;
  else if (maxIndependent >= 2) corroboration = 30;
  else corroboration = 10;

  // 2. Recency
  let recency = 0;
  if (hoursSinceReport <= 24) recency = 30;
  else if (hoursSinceReport <= 48) recency = 22;
  else if (hoursSinceReport <= 72) recency = 16;
  else if (hoursSinceReport <= 120) recency = 10;
  else if (hoursSinceReport <= 168) recency = 5;
  else recency = 0;

  // 3. Detail completeness (from the best event)
  const bestEvent = events.reduce<OutageEvent>((best, e) =>
    e.independentReporterCount > best.independentReporterCount ? e : best, events[0]
  );
  let detail = 0;
  if (bestEvent.endDateTime !== null) detail += 8;
  if (bestEvent.impacts.length > 0) detail += 6;
  if (bestEvent.reports.some((r) => r.notes.trim().length > 0)) detail += 6;

  const score = Math.min(100, corroboration + recency + detail);

  let tier: ConfidenceTier;
  if (hoursSinceReport > 168) {
    tier = 'expired';
  } else if (score >= 60) {
    tier = 'high';
  } else if (score >= 35) {
    tier = 'moderate';
  } else if (score >= 10) {
    tier = 'low';
  } else {
    tier = 'insufficient';
  }

  return { score, tier };
}

export function buildNeighborhoodSignals(reports: OutageReport[]): NeighborhoodSignal[] {
  // Filter to last 14 days for signal relevance
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentReports = reports.filter(
    (r) => new Date(r.startDateTime).getTime() >= fourteenDaysAgo
  );

  const byNeighborhood = new Map<string, OutageReport[]>();
  for (const r of recentReports) {
    const key = `${r.city}__${r.neighborhood}`;
    if (!byNeighborhood.has(key)) byNeighborhood.set(key, []);
    byNeighborhood.get(key)!.push(r);
  }

  const signals: NeighborhoodSignal[] = [];
  for (const [key, neighReports] of byNeighborhood) {
    const [city, neighborhood] = key.split('__');
    const events = groupIntoEvents(neighReports);
    const { score, tier } = computeConfidenceScore(events);
    const reporterIds = new Set(neighReports.map((r) => r.reporterId));

    const lastReportedAt = neighReports
      .map((r) => new Date(r.createdAt).getTime())
      .reduce((max, t) => (t > max ? t : max), 0);

    signals.push({
      neighborhood,
      city,
      reportCount: neighReports.length,
      independentReporterCount: reporterIds.size,
      events,
      confidenceScore: score,
      confidenceTier: tier,
      lastReportedAt: new Date(lastReportedAt).toISOString(),
    });
  }

  return signals.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function getActivityChartData(reports: OutageReport[]): ActivityDataPoint[] {
  const days: ActivityDataPoint[] = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      label: dayLabels[d.getDay()],
      count: 0,
    });
  }

  const dayMap = new Map(days.map((d) => [d.date, d]));
  for (const r of reports) {
    const dateStr = new Date(r.startDateTime).toISOString().slice(0, 10);
    const day = dayMap.get(dateStr);
    if (day) day.count++;
  }

  return days;
}

export function getReportedHours(reports: OutageReport[]): number {
  let total = 0;
  for (const r of reports) {
    const start = new Date(r.startDateTime).getTime();
    const end = r.restorationDateTime ? new Date(r.restorationDateTime).getTime() : Date.now();
    total += (end - start) / (1000 * 60 * 60);
  }
  return Math.round(total * 10) / 10;
}

export function getCorroboratedEventCount(reports: OutageReport[]): number {
  const events = groupIntoEvents(reports);
  return events.filter((e) => e.independentReporterCount >= 2).length;
}

export function getNeighborhoodsRepresented(reports: OutageReport[]): number {
  const set = new Set(reports.map((r) => r.neighborhood));
  return set.size;
}
