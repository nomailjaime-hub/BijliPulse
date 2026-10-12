import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ArrowLeft, Send, Zap } from 'lucide-react';
import type { NewReportInput } from '../hooks/useReports';
import type { ImpactType, OutageType } from '../types';

interface ReportFormProps {
  onSubmit: (input: NewReportInput) => void;
  onNavigate: (page: 'dashboard') => void;
}

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Peshawar'];
const PROVIDERS = ['LESCO', 'K-Electric', 'IESCO', 'FESCO', 'MEPCO', 'GESCO', 'PESCO', 'HESCO'];
const NEIGHBORHOODS_BY_CITY: Record<string, string[]> = {
  Lahore: ['Gulberg III', 'Johar Town Block H', 'DHA Phase 5', 'Model Town Block E', 'Allama Iqbal Town', 'Garden Town', 'Wapda Town', 'Bahria Town'],
  Karachi: ['Clifton', 'Gulshan-e-Iqbal', 'DHA Karachi', 'North Nazimabad', 'PECHS', 'Korangi'],
  Islamabad: ['F-7', 'F-8', 'G-9', 'I-8', 'Bahria Town Islamabad', 'DHA Islamabad'],
  Rawalpindi: ['Saddar', 'Bahria Town Rawalpindi', 'Westridge', 'Chaklala'],
  Faisalabad: ['People`s Colony', 'Madina Town', 'Gulberg Faisalabad'],
  Multan: ['Bosan Road', 'Cantt', 'Buch Estates'],
  Gujranwala: ['Model Town', 'Civil Lines', 'Wapda Town'],
  Peshawar: ['Hayatabad', 'Cantt', 'University Town'],
};

const IMPACT_OPTIONS: { value: ImpactType; label: string; description: string }[] = [
  { value: 'study', label: 'Study', description: 'Disrupted studying or online classes' },
  { value: 'work', label: 'Work', description: 'Affected work or remote meetings' },
  { value: 'business', label: 'Business', description: 'Impacted business operations' },
  { value: 'essential', label: 'Essential Activity', description: 'Water pumps, medical devices, cooking' },
];

export function ReportForm({ onSubmit, onNavigate }: ReportFormProps) {
  const [city, setCity] = useState('Lahore');
  const [neighborhood, setNeighborhood] = useState('');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [provider, setProvider] = useState('LESCO');
  const [type, setType] = useState<OutageType>('unplanned');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [hasRestoration, setHasRestoration] = useState(false);
  const [restorationDate, setRestorationDate] = useState('');
  const [restorationTime, setRestorationTime] = useState('');
  const [impact, setImpact] = useState<ImpactType | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Default to current time
  useEffect(() => {
    if (!startDate) {
      const now = new Date();
      const d = now.toISOString().slice(0, 10);
      const t = now.toTimeString().slice(0, 5);
      setStartDate(d);
      setStartTime(t);
    }
  }, [startDate]);

  const availableNeighborhoods = NEIGHBORHOODS_BY_CITY[city] || [];

  // When city changes, reset neighborhood
  useEffect(() => {
    setNeighborhood('');
    setCustomNeighborhood('');
  }, [city]);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    const finalNeighborhood = neighborhood === '__custom' ? customNeighborhood.trim() : neighborhood;
    if (!finalNeighborhood) {
      errs.neighborhood = 'Please select or enter a neighborhood.';
    }

    if (!startDate) errs.startDate = 'Start date is required.';
    if (!startTime) errs.startTime = 'Start time is required.';

    if (hasRestoration) {
      if (!restorationDate) errs.restorationDate = 'Restoration date is required.';
      if (!restorationTime) errs.restorationTime = 'Restoration time is required.';

      if (startDate && startTime && restorationDate && restorationTime) {
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${restorationDate}T${restorationTime}`);
        if (end <= start) {
          errs.restorationDate = 'Restoration must be after the start time.';
        }
        if (end > new Date()) {
          errs.restorationDate = 'Restoration time cannot be in the future.';
        }
      }
    }

    if (startDate && startTime) {
      const start = new Date(`${startDate}T${startTime}`);
      if (start > new Date()) {
        errs.startDate = 'Start time cannot be in the future.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const finalNeighborhood = neighborhood === '__custom' ? customNeighborhood.trim() : neighborhood;
    const startISO = new Date(`${startDate}T${startTime}`).toISOString();
    let restorationISO: string | null = null;
    if (hasRestoration && restorationDate && restorationTime) {
      restorationISO = new Date(`${restorationDate}T${restorationTime}`).toISOString();
    }

    onSubmit({
      city,
      neighborhood: finalNeighborhood,
      provider,
      type,
      startDateTime: startISO,
      restorationDateTime: restorationISO,
      impact,
      notes: notes.trim(),
    });

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fadeIn">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="font-display font-bold text-2xl text-navy-900 mb-2">Report Submitted</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Your outage report has been saved and the dashboard has been updated.
            Thank you for contributing to your community's evidence base.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setHasRestoration(false);
                setImpact(null);
                setNotes('');
                setErrors({});
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  const finalNeighborhood = neighborhood === '__custom' ? customNeighborhood : neighborhood;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
          <Zap className="w-3.5 h-3.5" />
          New Report
        </div>
        <h1 className="font-display font-bold text-3xl text-navy-900 tracking-tight">Report an Outage</h1>
        <p className="text-gray-500 mt-2">
          Document an electricity interruption in your area. No full name or precise address required —
          your report is linked to an anonymous identifier.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Location section */}
        <div>
          <h3 className="font-display font-semibold text-navy-900 text-sm uppercase tracking-wide mb-4">
            Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Neighborhood</label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm transition-colors ${
                  errors.neighborhood ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
                }`}
              >
                <option value="">Select neighborhood…</option>
                {availableNeighborhoods.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value="__custom">Other — type below</option>
              </select>
              {neighborhood === '__custom' && (
                <input
                  type="text"
                  value={customNeighborhood}
                  onChange={(e) => setCustomNeighborhood(e.target.value)}
                  placeholder="Enter your neighborhood"
                  className="w-full mt-2 px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                />
              )}
              {errors.neighborhood && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.neighborhood}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Provider and type */}
        <div>
          <h3 className="font-display font-semibold text-navy-900 text-sm uppercase tracking-wide mb-4">
            Outage Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Electricity Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Outage Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('unplanned')}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    type === 'unplanned'
                      ? 'bg-orange-50 text-orange-700 border-2 border-orange-300'
                      : 'bg-gray-50 text-gray-500 border-2 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  Unplanned
                </button>
                <button
                  type="button"
                  onClick={() => setType('planned')}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    type === 'planned'
                      ? 'bg-navy-50 text-navy-700 border-2 border-navy-200'
                      : 'bg-gray-50 text-gray-500 border-2 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  Planned
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timing */}
        <div>
          <h3 className="font-display font-semibold text-navy-900 text-sm uppercase tracking-wide mb-4">
            Timing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                  errors.startDate ? 'border-red-300' : 'border-gray-200'
                } focus:border-amber-400 focus:ring-2 focus:ring-amber-100`}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.startDate}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                  errors.startTime ? 'border-red-300' : 'border-gray-200'
                } focus:border-amber-400 focus:ring-2 focus:ring-amber-100`}
              />
              {errors.startTime && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.startTime}
                </p>
              )}
            </div>
          </div>

          {/* Restoration */}
          <div className="mt-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasRestoration}
                onChange={(e) => setHasRestoration(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Power has been restored (add restoration time)
              </span>
            </label>
            {hasRestoration && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Restoration Date</label>
                  <input
                    type="date"
                    value={restorationDate}
                    onChange={(e) => setRestorationDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                      errors.restorationDate ? 'border-red-300' : 'border-gray-200'
                    } focus:border-amber-400 focus:ring-2 focus:ring-amber-100`}
                  />
                  {errors.restorationDate && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.restorationDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Restoration Time</label>
                  <input
                    type="time"
                    value={restorationTime}
                    onChange={(e) => setRestorationTime(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                      errors.restorationTime ? 'border-red-300' : 'border-gray-200'
                    } focus:border-amber-400 focus:ring-2 focus:ring-amber-100`}
                  />
                  {errors.restorationTime && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.restorationTime}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Impact */}
        <div>
          <h3 className="font-display font-semibold text-navy-900 text-sm uppercase tracking-wide mb-4">
            Community Impact <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {IMPACT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setImpact(impact === opt.value ? null : opt.value)}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  impact === opt.value
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="font-semibold text-sm text-navy-800">{opt.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="font-display font-semibold text-navy-900 text-sm uppercase tracking-wide mb-4">
            Notes <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Add any context about the outage (e.g., affected appliances, frequency, nearby landmarks — no personal details needed)."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors resize-none"
          />
          <div className="text-right text-xs text-gray-300 mt-1">{notes.length}/500</div>
        </div>

        {/* Privacy note */}
        <div className="bg-navy-50 border border-navy-100 rounded-lg px-4 py-3">
          <p className="text-xs text-navy-600 leading-relaxed">
            <span className="font-semibold text-navy-700">Privacy-conscious:</span>{' '}
            This form does not ask for your full name or precise home address.
            Reports are stored locally with an anonymous reporter identifier.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-navy-900 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5"
          >
            <Send className="w-5 h-5" />
            Submit Report
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-3 text-gray-500 hover:text-gray-700 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
