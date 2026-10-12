import { Zap, LayoutDashboard, FileText, Radio, FolderArchive } from 'lucide-react';

export type PageId = 'dashboard' | 'report' | 'signals' | 'evidence';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'report', label: 'Report an Outage', icon: FileText },
  { id: 'signals', label: 'Community Signals', icon: Radio },
  { id: 'evidence', label: 'Evidence Pack', icon: FolderArchive },
];

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-md border-b border-navy-700/50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 group"
            aria-label="BijliPulse home"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap className="w-5 h-5 text-navy-900" fill="currentColor" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-amber-400 blur-md opacity-30 animate-pulseGlow -z-10" />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-lg text-white leading-none tracking-tight">
                Bijli<span className="text-amber-400">Pulse</span>
              </div>
              <div className="text-[10px] text-navy-300 font-medium tracking-wide uppercase mt-0.5">
                Community Outage Reporting
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-navy-700/80 text-white shadow-sm'
                      : 'text-navy-300 hover:text-white hover:bg-navy-800/60'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile nav trigger — using a simple horizontal scroll for mobile */}
          <nav className="md:hidden flex items-center gap-0.5 overflow-x-auto no-scrollbar max-w-[60%]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                    active
                      ? 'bg-amber-500 text-navy-900'
                      : 'text-navy-300 hover:text-white hover:bg-navy-800'
                  }`}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
