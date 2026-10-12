import type { ActivityDataPoint } from '../types';

interface ActivityChartProps {
  data: ActivityDataPoint[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 160;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-navy-900 text-base">7-Day Outage Activity</h3>
          <p className="text-xs text-gray-400 mt-0.5">Reports per day, last 7 days</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm bg-amber-400" />
          Outage reports
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height: `${chartHeight + 40}px` }}>
        {data.map((point) => {
          const barHeight = point.count > 0 ? (point.count / maxCount) * chartHeight : 0;
          return (
            <div key={point.date} className="flex-1 flex flex-col items-center justify-end gap-2 group">
              <div className="text-xs font-semibold text-navy-800 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                {point.count}
              </div>
              <div
                className="w-full max-w-[44px] rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-300 transition-all duration-500 hover:from-amber-600 hover:to-amber-400 relative"
                style={{ height: `${Math.max(barHeight, 4)}px` }}
              >
                {point.count > 0 && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-navy-800 tabular-nums">
                    {point.count}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 font-medium">{point.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
