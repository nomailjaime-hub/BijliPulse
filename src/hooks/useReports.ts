import { useCallback, useEffect, useState } from 'react';
import type { OutageReport } from '../types';
import {
  loadUserReports,
  saveUserReports,
  clearUserReports,
  getAllReports,
  generateId,
  generateReporterId,
} from '../lib/dataStore';

export interface NewReportInput {
  city: string;
  neighborhood: string;
  provider: string;
  type: 'planned' | 'unplanned';
  startDateTime: string;
  restorationDateTime: string | null;
  impact: 'study' | 'work' | 'business' | 'essential' | null;
  notes: string;
}

export function useReports() {
  const [userReports, setUserReports] = useState<OutageReport[]>([]);
  const [allReports, setAllReports] = useState<OutageReport[]>([]);

  useEffect(() => {
    const stored = loadUserReports();
    setUserReports(stored);
    setAllReports(getAllReports());
  }, []);

  const addReport = useCallback((input: NewReportInput): OutageReport => {
    const report: OutageReport = {
      id: generateId(),
      ...input,
      reporterId: generateReporterId(),
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...userReports, report];
    setUserReports(updated);
    saveUserReports(updated);
    setAllReports([...getAllReports().filter((r) => r.isDemo), ...updated]);
    return report;
  }, [userReports]);

  const clearUserReportsState = useCallback(() => {
    clearUserReports();
    setUserReports([]);
    setAllReports(getAllReports());
  }, []);

  return {
    userReports,
    allReports,
    addReport,
    clearUserReports: clearUserReportsState,
  };
}
