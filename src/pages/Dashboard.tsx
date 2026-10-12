import { Radio, Clock, MapPin, Users, Plus, ArrowRight, FileText } from 'lucide-react';
import type { OutageReport, NeighborhoodSignal, ActivityDataPoint } from '../types';
import { StatCard } from '../components/StatCard';
import { ActivityChart } from '../components/ActivityChart';
import { SignalCard } from '../components/SignalCard';
import { ReportCard } from '../components/ReportCard';
import { DemoBanner } from '../components/DemoBanner';
import { getReportedHours, getNeighborhoodsRepresented, getCorroboratedEventCount } from '../lib/dataStore';

interface DashboardProps {
  allReports: OutageReport[];
  signals: NeighborhoodSignal[];
  activityData: ActivityDataPoint[];
  onNavigate: (page: 'report' | 'signals' | 'evidence') => void;
  userReportCount: number;
  onClearReports: () => void;
}

export function Dashboard({ allReports, signals, activityData, onNavigate, userReportCount, onClearReports }: DashboardProps) {
  // Filter to last 7 days for dashboard stats
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentReports = allReports.filter(
    (r) => new Date(r.startDateTime).getTime() >= sevenDaysAgo
  );

  const reportCount = recentReports.length;
  const reportedHours = getReportedHours(recentReports);
  const neighborhoods = getNeighborhoodsRepresented(recentReports);
  const corroboratedEvents = getCorroboratedEventCount(recentReports);

  const sortedRecent = [...recentReports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Hero header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5" />
              Lahore Pilot
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-navy-900 tracking-tight">
              Community Outage Dashboard
            </h1>
            <p className="text-gray-500 mt-2 max-w-2xl">
              Track electricity interruptions across your neighborhood. Report outages,
              see corroborated community signals, and build evidence-backed complaints.
            </p>
          </div>
          <button
            onClick={() => onNavigate('report')}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-navy-900 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Report an Outage
          </button>
        </div>
      </div>

      <div className="mb-6">
        <DemoBanner userReportCount={userReportCount} onClearReports={onClearReports} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Reports (7 days)"
          value={reportCount}
          icon={FileText}
          accent="amber"
          sublabel="Total outage reports received"
        />
        <StatCard
          label="Reported hours"
          value={reportedHours}
          icon={Clock}
          accent="navy"
          sublabel="Cumulative interruption hours"
        />
        <StatCard
          label="Neighborhoods"
          value={neighborhoods}
          icon={MapPin}
          accent="emerald"
          sublabel="Distinct areas represented"
        />
        <StatCard
          label="Corroborated events"
          value={corroboratedEvents}
          icon={Users}
          accent="orange"
          sublabel="Events with 2+ independent reporters"
        />
      </div>

      {/* Chart + recent reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ActivityChart data={activityData} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-navy-900 text-base">Recent Reports</h3>
            <button
              onClick={() => onNavigate('signals')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {sortedRecent.slice(0, 5).map((report) => (
              <ReportCard key={report.id} report={report} compact />
            ))}
            {sortedRecent.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No reports in the last 7 days.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Neighborhood signals */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-navy-900">Neighborhood Signals</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Community-reported outage patterns grouped by area and time overlap
          </p>
        </div>
        <button
          onClick={() => onNavigate('signals')}
          className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors"
        >
          All signals <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.slice(0, 6).map((signal) => (
          <SignalCard key={`${signal.city}-${signal.neighborhood}`} signal={signal} onClick={() => onNavigate('signals')} />
        ))}
        {signals.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <Radio className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No community signals yet.</p>
            <p className="text-gray-300 text-sm mt-1">Submit a report to start building neighborhood signals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
