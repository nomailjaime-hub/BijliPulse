import { useState } from 'react';
import { Radio, Users, Clock, AlertCircle, Info, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import type { OutageReport, NeighborhoodSignal } from '../types';
import { SignalCard } from '../components/SignalCard';
import { ReportCard } from '../components/ReportCard';
import { tierLabel, tierColor, formatDateTime, formatDuration, impactLabel, typeLabel } from '../lib/format';

interface SignalsPageProps {
  signals: NeighborhoodSignal[];
  allReports: OutageReport[];
  onNavigate: (page: 'report') => void;
}

export function SignalsPage({ signals, allReports, onNavigate }: SignalsPageProps) {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);

  const activeSignals = signals.filter(
    (s) => s.confidenceTier !== 'expired' && s.confidenceTier !== 'insufficient'
  );
  const expiredSignals = signals.filter(
    (s) => s.confidenceTier === 'expired' || s.confidenceTier === 'insufficient'
  );

  // Individual reports not yet corroborated (single-reporter events only)
  const individualReports = allReports
    .filter((r) => {
      const signal = signals.find((s) => s.neighborhood === r.neighborhood && s.city === r.city);
      if (!signal) return true;
      const event = signal.events.find((e) => e.reports.some((rep) => rep.id === r.id));
      return event ? event.independentReporterCount < 2 : true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
          <Radio className="w-3.5 h-3.5" />
          Community Signals
        </div>
        <h1 className="font-display font-bold text-3xl text-navy-900 tracking-tight">
          Neighborhood Outage Signals
        </h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Reports are grouped by neighborhood and overlapping time windows.
          A confidence score describes evidence strength — not official verification.
        </p>
      </div>

      {/* Scoring algorithm explainer */}
      <div className="mb-8">
        <button
          onClick={() => setShowAlgorithm(!showAlgorithm)}
          className="w-full flex items-center justify-between bg-navy-50 border border-navy-100 rounded-xl px-5 py-4 text-left hover:bg-navy-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-navy-500" />
            <span className="text-sm font-semibold text-navy-700">
              How confidence scoring works
            </span>
          </div>
          {showAlgorithm ? <ChevronUp className="w-4 h-4 text-navy-400" /> : <ChevronDown className="w-4 h-4 text-navy-400" />}
        </button>
        {showAlgorithm && (
          <div className="bg-white border border-navy-100 border-t-0 rounded-b-xl p-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-sm text-navy-800">Corroboration</span>
                  <span className="text-xs text-gray-400 ml-auto">max 50 pts</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>1 independent reporter: 10 pts</li>
                  <li>2 independent reporters: 30 pts</li>
                  <li>3+ independent reporters: 50 pts</li>
                </ul>
              </div>
              <div className="bg-navy-50/50 rounded-lg p-4 border border-navy-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-navy-600" />
                  <span className="font-semibold text-sm text-navy-800">Recency</span>
                  <span className="text-xs text-gray-400 ml-auto">max 30 pts</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>Within 24h: 30 pts</li>
                  <li>Within 2 days: 22 pts</li>
                  <li>Within 3 days: 16 pts</li>
                  <li>Within 5 days: 10 pts</li>
                  <li>Within 7 days: 5 pts</li>
                </ul>
              </div>
              <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-sm text-navy-800">Detail</span>
                  <span className="text-xs text-gray-400 ml-auto">max 20 pts</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>Has restoration time: +8</li>
                  <li>Has impact specified: +6</li>
                  <li>Has notes: +6</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['high', 'moderate', 'low', 'expired'] as const).map((t) => {
                const c = tierColor(t);
                return (
                  <div key={t} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg} ${c.text} border ${c.border} text-xs font-semibold`}>
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    {tierLabel(t)}
                  </div>
                );
              })}
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs text-orange-800 leading-relaxed">
                  <span className="font-semibold">Important limitation:</span>{' '}
                  "Independent reporters" are identified by distinct anonymous identifiers in the system.
                  We cannot truly verify that different identifiers represent different people.
                  This scoring describes evidence strength within the platform — it is not official verification
                  by authorities or utility companies.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Corroborated signals */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-xl text-navy-900 mb-1">
          Corroborated Community Signals
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Outage events where 2 or more independent reporters documented overlapping interruptions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSignals
            .filter((s) => s.events.some((e) => e.independentReporterCount >= 2))
            .map((signal) => {
              const key = `${signal.city}-${signal.neighborhood}`;
              const isExpanded = expandedSignal === key;
              return (
                <div key={key}>
                  <SignalCard
                    signal={signal}
                    onClick={() => setExpandedSignal(isExpanded ? null : key)}
                  />
                  {isExpanded && (
                    <div className="mt-3 space-y-3 animate-fadeIn">
                      {signal.events.map((evt) => (
                        <div key={evt.id} className="bg-white rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              evt.type === 'unplanned' ? 'bg-orange-50 text-orange-600' : 'bg-navy-50 text-navy-600'
                            }`}>
                              {typeLabel(evt.type)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(evt.startDateTime)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Duration: <span className="font-semibold text-navy-800">{formatDuration(evt.reportedDurationHours)}</span>
                            {' · '}
                            {evt.independentReporterCount} independent reporter{evt.independentReporterCount !== 1 ? 's' : ''}
                          </div>
                          {evt.impacts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {evt.impacts.map((imp) => (
                                <span key={imp} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                  {impactLabel(imp)}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="space-y-2 mt-2">
                            {evt.reports.map((r) => (
                              <ReportCard key={r.id} report={r} compact />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          {activeSignals.filter((s) => s.events.some((e) => e.independentReporterCount >= 2)).length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No corroborated signals yet.</p>
                <p className="text-gray-300 text-sm mt-1">
                  When multiple independent reporters document overlapping outages, they appear here.
                </p>
              </div>
            )}
        </div>
      </section>

      {/* Individual reports */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-xl text-navy-900 mb-1">
          Individual Reports
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Single-reporter outage reports that have not yet been corroborated by others
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {individualReports.slice(0, 9).map((r) => (
            <ReportCard key={r.id} report={r} compact />
          ))}
          {individualReports.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <Radio className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No individual reports.</p>
            </div>
          )}
        </div>
      </section>

      {/* Expired signals */}
      {expiredSignals.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display font-bold text-xl text-gray-400 mb-1">
            Expired or Outdated Signals
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Neighborhoods with no reports in the last 7 days — signals have decayed
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {expiredSignals.map((signal) => (
              <SignalCard
                key={`${signal.city}-${signal.neighborhood}`}
                signal={signal}
              />
            ))}
          </div>
        </section>
      )}

      {/* Insufficient data guidance */}
      {signals.length < 3 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 text-sm mb-1">Not enough data for reliable signals</h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              Community signals become more reliable as more people report outages.
              Consider encouraging neighbors to submit reports for the same events.
              Remember: repeated entries from the same person are not independent confirmations.
            </p>
            <button
              onClick={() => onNavigate('report')}
              className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2 transition-colors"
            >
              Report an outage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
