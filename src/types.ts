export type OutageType = 'planned' | 'unplanned';
export type ImpactType = 'study' | 'work' | 'business' | 'essential';

export interface OutageReport {
  id: string;
  city: string;
  neighborhood: string;
  provider: string;
  type: OutageType;
  startDateTime: string; // ISO 8601
  restorationDateTime: string | null; // ISO 8601 or null if ongoing
  impact: ImpactType | null;
  notes: string;
  reporterId: string; // anonymous identifier, NOT a real name
  isDemo: boolean;
  createdAt: string; // ISO 8601
}

export type ConfidenceTier = 'high' | 'moderate' | 'low' | 'expired' | 'insufficient';

export interface NeighborhoodSignal {
  neighborhood: string;
  city: string;
  reportCount: number;
  independentReporterCount: number;
  events: OutageEvent[];
  confidenceScore: number; // 0-100
  confidenceTier: ConfidenceTier;
  lastReportedAt: string;
}

export interface OutageEvent {
  id: string;
  neighborhood: string;
  city: string;
  reports: OutageReport[];
  startDateTime: string;
  endDateTime: string | null;
  reporterCount: number;
  independentReporterCount: number;
  reportedDurationHours: number;
  type: OutageType;
  providers: string[];
  impacts: ImpactType[];
}

export interface ActivityDataPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Mon"
  count: number;
}
