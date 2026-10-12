import { MapPin, Calendar, Clock, Zap, User, FileText, Tag } from 'lucide-react';
import type { OutageReport } from '../types';
import { formatDateTime, formatDuration, timeAgo, impactLabel, typeLabel } from '../lib/format';

interface ReportCardProps {
  report: OutageReport;
  compact?: boolean;
}

export function ReportCard({ report, compact = false }: ReportCardProps) {
  const isOngoing = report.restorationDateTime === null;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${compact ? 'p-4' : 'p-5'} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            report.type === 'unplanned' ? 'bg-orange-50 text-orange-600' : 'bg-navy-50 text-navy-600'
          }`}>
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-semibold text-navy-900 text-sm truncate">
              {report.neighborhood}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              {report.city} · {report.provider}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {report.isDemo && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              Demo
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            report.type === 'unplanned'
              ? 'bg-orange-50 text-orange-600'
              : 'bg-navy-50 text-navy-600'
          }`}>
            {typeLabel(report.type)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{formatDateTime(report.startDateTime)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {isOngoing ? (
            <span className="text-orange-600 font-medium">Ongoing</span>
          ) : (
            <span>
              {formatDuration(
                (new Date(report.restorationDateTime!).getTime() -
                  new Date(report.startDateTime).getTime()) /
                  (1000 * 60 * 60)
              )}
            </span>
          )}
        </div>
        {report.impact && (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <span>{impactLabel(report.impact)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">
            Reporter {report.reporterId.slice(-4)}
          </span>
        </div>
      </div>

      {report.notes && (
        <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-600">
          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <span className="italic">{report.notes}</span>
        </div>
      )}

      {!compact && (
        <div className="mt-3 text-[11px] text-gray-300 text-right">
          Submitted {timeAgo(report.createdAt)}
        </div>
      )}
    </div>
  );
}
