import { Info, Trash2 } from 'lucide-react';

interface DemoBannerProps {
  userReportCount: number;
  onClearReports: () => void;
}

export function DemoBanner({ userReportCount, onClearReports }: DemoBannerProps) {
  return (
    <div className="bg-navy-50 border border-navy-100 rounded-xl px-4 py-3 flex items-start gap-3 no-print">
      <Info className="w-5 h-5 text-navy-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-navy-600">
        <span className="font-semibold text-navy-700">Illustrative demo data.</span>{' '}
        Sample records for the Lahore pilot are shown alongside your submitted reports.
        This is not live monitoring and outages have not been verified by authorities.
      </div>
      {userReportCount > 0 && (
        <button
          onClick={onClearReports}
          className="shrink-0 flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear my reports
        </button>
      )}
    </div>
  );
}
