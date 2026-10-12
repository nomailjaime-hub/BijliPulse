import { useState, useMemo } from 'react';
import { FolderArchive, Copy, Download, FileText, AlertCircle, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import type { OutageReport, NeighborhoodSignal } from '../types';
import { groupIntoEvents } from '../lib/dataStore';
import { formatDateTime, formatDuration, impactLabel, typeLabel, tierLabel, toCSV, downloadFile } from '../lib/format';

interface EvidencePackProps {
  allReports: OutageReport[];
  signals: NeighborhoodSignal[];
}

export function EvidencePack({ allReports, signals }: EvidencePackProps) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Build list of unique neighborhoods
  const neighborhoods = useMemo(() => {
    const set = new Map<string, string>();
    for (const r of allReports) {
      const key = `${r.city}__${r.neighborhood}`;
      if (!set.has(key)) set.set(key, `${r.neighborhood} (${r.city})`);
    }
    return Array.from(set.entries()).map(([key, label]) => ({ key, label }));
  }, [allReports]);

  const filteredReports = useMemo(() => {
    if (!selectedNeighborhood) return [];
    const [city, neighborhood] = selectedNeighborhood.split('__');
    const startMs = startDate ? new Date(startDate + 'T00:00').getTime() : 0;
    const endMs = endDate ? new Date(endDate + 'T23:59').getTime() : Date.now();

    return allReports.filter((r) => {
      if (r.city !== city || r.neighborhood !== neighborhood) return false;
      const reportStart = new Date(r.startDateTime).getTime();
      return reportStart >= startMs && reportStart <= endMs;
    });
  }, [allReports, selectedNeighborhood, startDate, endDate]);

  const filteredEvents = useMemo(() => groupIntoEvents(filteredReports), [filteredReports]);

  const neighborhoodSignal = useMemo(() => {
    if (!selectedNeighborhood) return null;
    const [, neighborhood] = selectedNeighborhood.split('__');
    return signals.find((s) => s.neighborhood === neighborhood) || null;
  }, [signals, selectedNeighborhood]);

  const totalReportedHours = useMemo(() => {
    return filteredEvents.reduce((sum, e) => sum + e.reportedDurationHours, 0);
  }, [filteredEvents]);

  const corroboratedEvents = filteredEvents.filter((e) => e.independentReporterCount >= 2);
  const allImpacts = [...new Set(filteredReports.map((r) => r.impact).filter((i): i is NonNullable<typeof i> => i !== null))];
  const demoReportCount = filteredReports.filter((r) => r.isDemo).length;
  const userReportCount = filteredReports.filter((r) => !r.isDemo).length;

  function buildSummaryText(): string {
    if (!selectedNeighborhood || filteredReports.length === 0) return '';
    const [, neighborhood] = selectedNeighborhood.split('__');
    const city = selectedNeighborhood.split('__')[0];

    const lines: string[] = [];
    lines.push('=== BIJLIPULSE EVIDENCE PACK ===');
    lines.push('');
    lines.push(`Neighborhood: ${neighborhood}, ${city}`);
    lines.push(`Reporting Period: ${startDate} to ${endDate}`);
    lines.push('');
    lines.push('--- Summary ---');
    lines.push(`Total Reports: ${filteredReports.length}`);
    lines.push(`  - User-submitted: ${userReportCount}`);
    lines.push(`  - Illustrative demo data: ${demoReportCount}`);
    lines.push(`Outage Events: ${filteredEvents.length}`);
    lines.push(`Corroborated Events (2+ independent reporters): ${corroboratedEvents.length}`);
    lines.push(`Total Reported Duration: ${formatDuration(totalReportedHours)}`);
    lines.push('');
    lines.push('--- Confidence Assessment ---');
    if (neighborhoodSignal) {
      lines.push(`Confidence Score: ${neighborhoodSignal.confidenceScore}/100 (${tierLabel(neighborhoodSignal.confidenceTier)})`);
      lines.push(`Independent Reporters: ${neighborhoodSignal.independentReporterCount}`);
    } else {
      lines.push('Confidence Score: N/A (insufficient data)');
    }
    lines.push('');
    lines.push('NOTE: Confidence score describes evidence strength within the');
    lines.push('BijliPulse platform, NOT official verification by authorities.');
    lines.push('Independent reporters are identified by distinct anonymous');
    lines.push('identifiers. We cannot verify they are truly different people.');
    lines.push('');
    lines.push('--- Outage Events ---');
    filteredEvents.forEach((evt, i) => {
      lines.push(`  Event ${i + 1}:`);
      lines.push(`    Type: ${typeLabel(evt.type)}`);
      lines.push(`    Start: ${formatDateTime(evt.startDateTime)}`);
      lines.push(`    End: ${evt.endDateTime ? formatDateTime(evt.endDateTime) : 'Ongoing'}`);
      lines.push(`    Duration: ${formatDuration(evt.reportedDurationHours)}`);
      lines.push(`    Reporters: ${evt.reporterCount} total, ${evt.independentReporterCount} independent`);
      lines.push(`    Providers: ${evt.providers.join(', ')}`);
      if (evt.impacts.length > 0) {
        lines.push(`    Impacts: ${evt.impacts.map(impactLabel).join(', ')}`);
      }
    });
    lines.push('');
    lines.push('--- Community Impact ---');
    if (allImpacts.length > 0) {
      allImpacts.forEach((imp) => {
        const count = filteredReports.filter((r) => r.impact === imp).length;
        lines.push(`  ${impactLabel(imp)}: ${count} report(s)`);
      });
    } else {
      lines.push('  No specific impacts reported.');
    }
    lines.push('');
    lines.push('--- Data Limitations ---');
    lines.push('1. This summary includes illustrative demo data that is NOT real');
    lines.push('   monitoring data. Demo records are clearly marked.');
    lines.push('2. Confidence scores describe community-reported evidence, not');
    lines.push('   verified facts. Outages have not been confirmed by authorities.');
    lines.push('3. Independent reporter counts rely on anonymous identifiers and');
    lines.push('   cannot truly verify that different IDs represent different people.');
    lines.push('4. This report does NOT automatically file a complaint with NEPRA');
    lines.push('   or any electricity provider. It is a community-generated summary.');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('Source: BijliPulse — Community Electricity Outage Reporting');

    return lines.join('\n');
  }

  function buildCSV(): string {
    const rows: string[][] = [];
    rows.push(['Field', 'Value']);
    rows.push(['Neighborhood', selectedNeighborhood ? selectedNeighborhood.split('__')[1] : '']);
    rows.push(['City', selectedNeighborhood ? selectedNeighborhood.split('__')[0] : '']);
    rows.push(['Reporting Period Start', startDate]);
    rows.push(['Reporting Period End', endDate]);
    rows.push(['Total Reports', String(filteredReports.length)]);
    rows.push(['User-Submitted Reports', String(userReportCount)]);
    rows.push(['Demo Data Reports', String(demoReportCount)]);
    rows.push(['Outage Events', String(filteredEvents.length)]);
    rows.push(['Corroborated Events', String(corroboratedEvents.length)]);
    rows.push(['Total Reported Hours', String(Math.round(totalReportedHours * 10) / 10)]);
    rows.push(['Confidence Score', neighborhoodSignal ? String(neighborhoodSignal.confidenceScore) : 'N/A']);
    rows.push(['Confidence Tier', neighborhoodSignal ? tierLabel(neighborhoodSignal.confidenceTier) : 'N/A']);
    rows.push([]);
    rows.push(['Event #', 'Type', 'Start', 'End', 'Duration (hrs)', 'Total Reports', 'Independent Reporters', 'Providers', 'Impacts']);
    filteredEvents.forEach((evt, i) => {
      rows.push([
        String(i + 1),
        typeLabel(evt.type),
        formatDateTime(evt.startDateTime),
        evt.endDateTime ? formatDateTime(evt.endDateTime) : 'Ongoing',
        String(evt.reportedDurationHours),
        String(evt.reporterCount),
        String(evt.independentReporterCount),
        evt.providers.join('; '),
        evt.impacts.map(impactLabel).join('; '),
      ]);
    });

    return toCSV(rows);
  }

  async function handleCopy() {
    const text = buildSummaryText();
    setCopied(false);
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 5000);
    }
  }

  function handleDownloadCSV() {
    const csv = buildCSV();
    const neighborhoodName = selectedNeighborhood ? selectedNeighborhood.split('__')[1].replace(/\s+/g, '_') : 'evidence';
    downloadFile(`bijlipulse_evidence_${neighborhoodName}_${startDate}_to_${endDate}.csv`, csv, 'text/csv');
  }

  function handleDownloadHTML() {
    const neighborhoodName = selectedNeighborhood ? selectedNeighborhood.split('__')[1] : '';
    const cityName = selectedNeighborhood ? selectedNeighborhood.split('__')[0] : '';
    const html = buildPrintableHTML(neighborhoodName, cityName);
    downloadFile(`bijlipulse_evidence_${neighborhoodName.replace(/\s+/g, '_')}.html`, html, 'text/html');
  }

  function buildPrintableHTML(neighborhood: string, city: string): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>BijliPulse Evidence Pack — ${neighborhood}, ${city}</title>
<style>
  body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1f2335; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 24px; border-bottom: 2px solid #ffb01f; padding-bottom: 4px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; }
  th { background: #f7f8fb; font-weight: 600; }
  .warning { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; font-size: 13px; margin: 16px 0; }
  .stat { display: inline-block; margin-right: 24px; }
  .stat-value { font-size: 22px; font-weight: bold; }
  .stat-label { font-size: 12px; color: #6b7280; }
</style>
</head>
<body>
<h1>BijliPulse Evidence Pack</h1>
<div class="meta">
  <strong>Neighborhood:</strong> ${neighborhood}, ${city}<br>
  <strong>Reporting Period:</strong> ${startDate} to ${endDate}<br>
  <strong>Generated:</strong> ${new Date().toLocaleString()}
</div>

<div class="warning">
  <strong>Data Limitations:</strong> This summary includes illustrative demo data.
  Confidence scores describe community-reported evidence, not verified facts.
  Outages have not been confirmed by authorities. This report does NOT automatically
  file a complaint with NEPRA or any electricity provider.
</div>

<h2>Summary Statistics</h2>
<div class="stat"><div class="stat-value">${filteredReports.length}</div><div class="stat-label">Total Reports</div></div>
<div class="stat"><div class="stat-value">${filteredEvents.length}</div><div class="stat-label">Outage Events</div></div>
<div class="stat"><div class="stat-value">${corroboratedEvents.length}</div><div class="stat-label">Corroborated Events</div></div>
<div class="stat"><div class="stat-value">${formatDuration(totalReportedHours)}</div><div class="stat-label">Reported Duration</div></div>

<h2>Outage Events</h2>
<table>
<tr><th>#</th><th>Type</th><th>Start</th><th>End</th><th>Duration</th><th>Reporters</th><th>Independent</th><th>Impacts</th></tr>
${filteredEvents.map((evt, i) => `<tr>
<td>${i + 1}</td>
<td>${typeLabel(evt.type)}</td>
<td>${formatDateTime(evt.startDateTime)}</td>
<td>${evt.endDateTime ? formatDateTime(evt.endDateTime) : 'Ongoing'}</td>
<td>${formatDuration(evt.reportedDurationHours)}</td>
<td>${evt.reporterCount}</td>
<td>${evt.independentReporterCount}</td>
<td>${evt.impacts.map(impactLabel).join(', ') || '—'}</td>
</tr>`).join('\n')}
</table>

<h2>Confidence Assessment</h2>
<p>
  <strong>Score:</strong> ${neighborhoodSignal ? neighborhoodSignal.confidenceScore + '/100' : 'N/A'}<br>
  <strong>Tier:</strong> ${neighborhoodSignal ? tierLabel(neighborhoodSignal.confidenceTier) : 'Insufficient data'}<br>
  <strong>Independent Reporters:</strong> ${neighborhoodSignal ? neighborhoodSignal.independentReporterCount : 0}
</p>
<p style="font-size:13px;color:#6b7280;">
  Confidence score describes evidence strength within the BijliPulse platform.
  "Independent" reporters are identified by distinct anonymous identifiers —
  we cannot verify they are truly different people.
</p>

<h2>Community Impact</h2>
${allImpacts.length > 0
  ? `<ul>${allImpacts.map((imp) => `<li>${impactLabel(imp)}: ${filteredReports.filter((r) => r.impact === imp).length} report(s)</li>`).join('')}</ul>`
  : '<p>No specific impacts reported.</p>'}

</body>
</html>`;
  }

  const canGenerate = selectedNeighborhood && startDate && endDate;

  function handleGenerate() {
    setGenerated(true);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
          <FolderArchive className="w-3.5 h-3.5" />
          Evidence Pack
        </div>
        <h1 className="font-display font-bold text-3xl text-navy-900 tracking-tight">
          Generate an Evidence Summary
        </h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Select a neighborhood and time range to produce a structured, downloadable
          evidence summary for community advocacy. This is not an official complaint filing.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
              Neighborhood
            </label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => { setSelectedNeighborhood(e.target.value); setGenerated(false); }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            >
              <option value="">Select neighborhood…</option>
              {neighborhoods.map((n) => (
                <option key={n.key} value={n.key}>{n.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1 text-gray-400" />
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setGenerated(false); }}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1 text-gray-400" />
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setGenerated(false); }}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-800 hover:bg-navy-900 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate Summary
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!canGenerate && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center no-print">
          <FolderArchive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Select a neighborhood and date range above</p>
          <p className="text-gray-300 text-sm mt-1">Your evidence summary will appear here.</p>
        </div>
      )}

      {/* No results */}
      {canGenerate && generated && filteredReports.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center no-print">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No reports found for this selection</p>
          <p className="text-gray-300 text-sm mt-1">Try a different neighborhood or wider date range.</p>
        </div>
      )}

      {/* Results */}
      {canGenerate && generated && filteredReports.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-3 no-print">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-amber-300 text-navy-800 font-semibold rounded-xl transition-colors text-sm"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : copyError ? 'Copy failed — select manually' : 'Copy Summary'}
            </button>
            {copyError && (
              <p className="text-xs text-red-500 w-full">Could not access the clipboard. You can manually select the summary text below and copy it.</p>
            )}
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-amber-300 text-navy-800 font-semibold rounded-xl transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-amber-300 text-navy-800 font-semibold rounded-xl transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download HTML Report
            </button>
          </div>

          {/* Report preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-navy-900 px-6 py-5">
              <h2 className="font-display font-bold text-white text-lg">Evidence Summary</h2>
              <p className="text-navy-300 text-sm mt-1">
                {selectedNeighborhood.split('__')[1]}, {selectedNeighborhood.split('__')[0]}
                {' · '}
                {startDate} to {endDate}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <div className="text-2xl font-display font-bold text-navy-900">{filteredReports.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Total Reports</div>
                </div>
                <div className="bg-navy-50 rounded-lg p-3 border border-navy-100">
                  <div className="text-2xl font-display font-bold text-navy-900">{filteredEvents.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Outage Events</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="text-2xl font-display font-bold text-navy-900">{corroboratedEvents.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Corroborated</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="text-2xl font-display font-bold text-navy-900">{formatDuration(totalReportedHours)}</div>
                  <div className="text-xs text-gray-500 font-medium">Reported Duration</div>
                </div>
              </div>

              {/* Events table */}
              <div>
                <h3 className="font-display font-semibold text-navy-900 text-sm mb-3">Outage Events</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Type</th>
                        <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Start</th>
                        <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Duration</th>
                        <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Reporters</th>
                        <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide">Impacts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((evt) => (
                        <tr key={evt.id} className="border-b border-gray-50">
                          <td className="py-2 pr-4">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              evt.type === 'unplanned' ? 'bg-orange-50 text-orange-600' : 'bg-navy-50 text-navy-600'
                            }`}>
                              {typeLabel(evt.type)}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-gray-600">{formatDateTime(evt.startDateTime)}</td>
                          <td className="py-2 pr-4 text-gray-600 font-medium">{formatDuration(evt.reportedDurationHours)}</td>
                          <td className="py-2 pr-4 text-gray-600">{evt.reporterCount} ({evt.independentReporterCount} independent)</td>
                          <td className="py-2 text-gray-600">
                            {evt.impacts.length > 0 ? evt.impacts.map(impactLabel).join(', ') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confidence */}
              <div>
                <h3 className="font-display font-semibold text-navy-900 text-sm mb-2">Confidence & Corroboration</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-3xl font-display font-bold text-navy-900">
                      {neighborhoodSignal ? neighborhoodSignal.confidenceScore : 'N/A'}
                      <span className="text-base text-gray-400">/100</span>
                    </div>
                    {neighborhoodSignal && (
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${tierLabel(neighborhoodSignal.confidenceTier).includes('High') ? 'bg-emerald-50 text-emerald-700' : tierLabel(neighborhoodSignal.confidenceTier).includes('Moderate') ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {tierLabel(neighborhoodSignal.confidenceTier)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Confidence score describes evidence strength within the BijliPulse platform —
                    not official verification. "Independent" reporters are identified by distinct
                    anonymous identifiers; we cannot verify they represent different people.
                  </p>
                </div>
              </div>

              {/* Impact */}
              <div>
                <h3 className="font-display font-semibold text-navy-900 text-sm mb-2">Reported Community Impact</h3>
                {allImpacts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allImpacts.map((imp) => (
                      <span key={imp} className="text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium border border-amber-100">
                        {impactLabel(imp)} ({filteredReports.filter((r) => r.impact === imp).length})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No specific impacts reported.</p>
                )}
              </div>

              {/* Data composition */}
              <div>
                <h3 className="font-display font-semibold text-navy-900 text-sm mb-2">Data Composition</h3>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-gray-600">
                    User-submitted: <strong className="text-navy-800">{userReportCount}</strong>
                  </span>
                  <span className="text-gray-600">
                    Demo data: <strong className="text-navy-800">{demoReportCount}</strong>
                  </span>
                </div>
              </div>

              {/* Limitations */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800 leading-relaxed">
                    <h4 className="font-semibold mb-2">Data Limitations & Important Notes</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>This summary includes illustrative demo data that is NOT real monitoring data.</li>
                      <li>Confidence scores describe community-reported evidence, not verified facts. Outages have not been confirmed by authorities.</li>
                      <li>Independent reporter counts rely on anonymous identifiers and cannot truly verify that different IDs represent different people.</li>
                      <li>This report does NOT automatically file a complaint with NEPRA or any electricity provider. It is a community-generated summary for your own advocacy use.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
