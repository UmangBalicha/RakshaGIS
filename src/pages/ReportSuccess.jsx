import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin, Radar } from 'lucide-react';
import { getReport } from '../lib/api';
import { DISASTER_TYPE_META } from '../lib/utils';
import { useEffect, useState } from 'react';
import { Card, CardContent, EmptyState } from '../components/ui';
import { SeverityBadge } from '../components/reports/ReportDetail';

export default function ReportSuccess() {
  const { id } = useParams();
  const [address, setAddress] = useState(null);
  const [disasterType, setDisasterType] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(id));
    } catch {
      // Clipboard API unavailable (older WebViews) — select-and-copy fallback.
      const ta = document.createElement('textarea');
      ta.value = String(id);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReport(id ?? '')
      .then((r) => {
        if (cancelled) return;
        if (r) {
          setAddress(r.address);
          setDisasterType(r.disaster_type);
          setSeverity(r.severity);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-md py-6 text-center sm:py-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-9 w-9" />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Report received</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        Thank you — your incident report was sent to the response team
        {address ? (
          <>
            {' '}for <strong className="text-slate-700">{address}</strong>
          </>
        ) : null}
        .
      </p>

      {loading ? (
        <div className="mt-5 h-20 animate-pulse rounded-xl bg-slate-200" role="status" />
      ) : disasterType ? (
        <Card className="mt-5 text-left">
          <CardContent className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Report ID</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="font-mono text-sm font-bold break-all text-slate-900">{String(id)}</p>
                <button
                  type="button"
                  onClick={() => void copyId()}
                  className="inline-flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation items-center rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {DISASTER_TYPE_META[disasterType].label}
              </p>
            </div>
            {severity ? <SeverityBadge value={severity} /> : null}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="Receipt saved"
            hint="The live details for this report could not be loaded, but your submission went through."
          />
        </div>
      )}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600">
        <p className="font-bold text-slate-900">What happens next</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Authority staff triage your report on the live map.</li>
          <li>Its status moves from pending → investigating → contained → resolved.</li>
          <li>You can follow every update on the tracking page.</li>
        </ol>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Link
          to={`/track/${id}`}
          className="inline-flex min-h-[56px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 text-base font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-[0.98]"
        >
          <Radar className="h-5 w-5" /> Track this report →
        </Link>
        <div className="flex gap-2">
          <Link
            to="/report"
            className="inline-flex min-h-[48px] flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
          >
            <MapPin className="h-5 w-5" /> Report another
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-[48px] flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
