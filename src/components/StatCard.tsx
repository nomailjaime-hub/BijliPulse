import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'amber' | 'navy' | 'emerald' | 'orange';
  sublabel?: string;
}

const ACCENT_STYLES = {
  amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-500', iconColor: 'text-white' },
  navy: { bg: 'bg-navy-50', iconBg: 'bg-navy-700', iconColor: 'text-white' },
  emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', iconColor: 'text-white' },
  orange: { bg: 'bg-orange-50', iconBg: 'bg-orange-500', iconColor: 'text-white' },
};

export function StatCard({ label, value, icon: Icon, accent = 'navy', sublabel }: StatCardProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center shadow-sm`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
      </div>
      <div className="text-3xl font-display font-bold text-navy-900 tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-sm text-gray-500 font-medium mt-1">{label}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}
