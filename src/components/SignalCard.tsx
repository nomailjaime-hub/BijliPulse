import { Radio, Users, Clock, AlertCircle } from 'lucide-react';
import type { NeighborhoodSignal } from '../types';
import { tierLabel, tierColor, timeAgo, formatDuration } from '../lib/format';

interface SignalCardProps {
  signal: NeighborhoodSignal;
  onClick?: () => void;
}

export function SignalCard({ signal, onClick }: SignalCardProps) {
  const colors = tierColor(signal.confidenceTier);
  const isExpired = signal.confidenceTier === 'expired';
  const isInsufficient = signal.confidenceTier === 'insufficient';

  return (
    <button
      onClick={onClick}
      className={`text-left w-full ${colors.bg} ${colors.border} border rounded-2xl p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-display font-semibold text-navy-900 text-base leading-tight">
            {signal.neighborhood}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{signal.city}</div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border} text-xs font-semibold shrink-0`}>
          <span className={`w-2 h-2 rounded-full ${colors.dot} ${!isExpired && !isInsufficient ? 'animate-pulse' : ''}`} />
          {tierLabel(signal.confidenceTier)}
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500 font-medium">Confidence Score</span>
          <span className="text-navy-800 font-bold tabular-nums">{signal.confidenceScore}/100</span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.dot} transition-all duration-700`}
            style={{ width: `${signal.confidenceScore}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium">{signal.reportCount} report{signal.reportCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium">{signal.independentReporterCount} reporter{signal.independentReporterCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium">{timeAgo(signal.lastReportedAt)}</span>
        </div>
      </div>

      {(isExpired || isInsufficient) && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200/60 text-xs text-gray-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {isExpired
              ? 'No reports in the last 7 days. Signal has expired.'
              : 'Not enough reports to establish a community signal.'}
          </span>
        </div>
      )}

      {signal.events.length > 0 && !isInsufficient && (
        <div className="mt-3 pt-3 border-t border-gray-200/60">
          <div className="text-xs text-gray-500 font-medium mb-1.5">Recent events</div>
          <div className="space-y-1">
            {signal.events.slice(0, 2).map((evt) => (
              <div key={evt.id} className="text-xs text-gray-600 flex items-center justify-between">
                <span>{formatDuration(evt.reportedDurationHours)}</span>
                <span className="text-gray-400">
                  {evt.independentReporterCount} reporter{evt.independentReporterCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
