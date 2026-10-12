import { useState, useMemo, useCallback } from 'react';
import { Navbar, type PageId } from './components/Navbar';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Dashboard } from './pages/Dashboard';
import { ReportForm } from './pages/ReportForm';
import { SignalsPage } from './pages/SignalsPage';
import { EvidencePack } from './pages/EvidencePack';
import { useReports } from './hooks/useReports';
import { buildNeighborhoodSignals, getActivityChartData } from './lib/dataStore';

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { allReports, userReports, addReport, clearUserReports } = useReports();

  const signals = useMemo(() => buildNeighborhoodSignals(allReports), [allReports]);
  const activityData = useMemo(() => getActivityChartData(allReports), [allReports]);

  const handleNavigate = useCallback((page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleClearReports = useCallback(() => {
    clearUserReports();
    setShowClearConfirm(false);
  }, [clearUserReports]);

  const handleClearRequest = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main>
        {currentPage === 'dashboard' && (
          <Dashboard
            allReports={allReports}
            signals={signals}
            activityData={activityData}
            onNavigate={handleNavigate}
            userReportCount={userReports.length}
            onClearReports={handleClearRequest}
          />
        )}
        {currentPage === 'report' && (
          <ReportForm
            onSubmit={addReport}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'signals' && (
          <SignalsPage
            signals={signals}
            allReports={allReports}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'evidence' && (
          <EvidencePack
            allReports={allReports}
            signals={signals}
          />
        )}
      </main>

      <footer className="bg-navy-900 text-navy-300 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="font-display font-bold text-navy-900 text-sm">B</span>
              </div>
              <span className="font-display font-semibold text-white text-sm">
                Bijli<span className="text-amber-400">Pulse</span>
              </span>
            </div>
            <p className="text-xs text-center sm:text-right max-w-xl">
              Community-built civic technology for documenting electricity interruptions.
              All data is illustrative and community-reported — not verified by authorities.
              This tool does not file complaints with NEPRA or utility providers.
            </p>
          </div>
        </div>
      </footer>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear My Submitted Reports"
        message="This will permanently remove all reports you have submitted from this browser. The illustrative demo data will remain. This action cannot be undone."
        confirmLabel="Clear My Reports"
        onConfirm={handleClearReports}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

export default App;
