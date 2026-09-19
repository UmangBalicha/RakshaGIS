import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LocationPicker, { type LatLng } from '../components/map/LocationPicker';
import { SeverityBadge } from '../components/reports/ReportDetail';
import { createReport, uploadReportImages } from '../lib/api';
import { DISASTER_TYPE_META, reverseGeocode, suggestSeverity, cn } from '../lib/utils';
import { DISASTER_TYPES } from '../lib/types';
import type { DisasterReport, DisasterType } from '../lib/types';
import { useAuthStore } from '../stores/authStore';
import { useReportStore } from '../stores/reportStore';
import { Button, Card, CardContent, Input, Label, Textarea } from '../components/ui';

const MINE_KEY = 'rakshagis_mine_v1';

function rememberMine(id: string): void {
  try {
    const raw = localStorage.getItem(MINE_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    list.unshift(id);
    localStorage.setItem(MINE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export default function ReportDisaster() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const refresh = useReportStore((s) => s.refresh);

  const [location, setLocation] = useState<LatLng | null>(null);
  const [disasterType, setDisasterType] = useState<DisasterType | null>(null);
  const [description, setDescription] = useState('');
  const [hasInjuries, setHasInjuries] = useState<boolean | null>(null);
  const [injuryCount, setInjuryCount] = useState('1');
  const [photos, setPhotos] = useState<File[]>([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [address, setAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);

  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve the address in the background whenever the pin moves —
  // never blocks the form (network can be slow during disasters).
  useEffect(() => {
    if (!location) {
      setAddress('');
      return;
    }
    let cancelled = false;
    setResolvingAddress(true);
    void reverseGeocode(location.lat, location.lng).then((addr) => {
      if (!cancelled) {
        setAddress(addr);
        setResolvingAddress(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location]);

  const canSubmit =
    location !== null &&
    disasterType !== null &&
    hasInjuries !== null &&
    (hasInjuries ? Number(injuryCount) >= 1 : true);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = [...photos, ...Array.from(files)].slice(0, 5);
    const tooBig = next.find((f) => f.size > 4 * 1024 * 1024);
    if (tooBig) {
      toast.error(`"${tooBig.name}" exceeds 4 MB and was skipped.`);
      setPhotos(next.filter((f) => f.size <= 4 * 1024 * 1024).slice(0, 5));
      return;
    }
    setPhotos(next);
  };

  const handleSubmit = async () => {
    if (!location || !disasterType || hasInjuries === null) return;
    setSubmitting(true);
    try {
      const images = await uploadReportImages(photos);
      const severity = suggestSeverity({ disaster_type: disasterType, has_injuries: hasInjuries });
      const report = await createReport(
        {
          latitude: location.lat,
          longitude: location.lng,
          address: address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
          disaster_type: disasterType,
          description: description.trim(),
          has_injuries: hasInjuries,
          injury_count: hasInjuries ? Math.max(1, Number(injuryCount) || 1) : 0,
          images,
        },
        profile,
        severity,
      );
      rememberMine(report.id);
      await refresh();
      toast.success('Incident reported. Response team notified.');
      navigate(`/track/${report.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const previewReport: DisasterReport[] = useMemo(() => {
    if (!location || !disasterType) return [];
    const sev = suggestSeverity({ disaster_type: disasterType, has_injuries: hasInjuries === true });
    return [
      {
        id: 'preview',
        reporter_id: null,
        reporter_name: profile?.full_name ?? 'You',
        latitude: location.lat,
        longitude: location.lng,
        address: address || 'Resolving address…',
        disaster_type: disasterType,
        severity: sev,
        status: 'pending',
        description,
        has_injuries: hasInjuries === true,
        injury_count: hasInjuries ? Number(injuryCount) || 0 : 0,
        images: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }, [location, disasterType, hasInjuries, injuryCount, address, description, profile]);

  return (
    <div className="mx-auto max-w-3xl pb-2">
      <h1 className="text-2xl font-extrabold text-slate-900">Report an incident</h1>
      <p className="mt-1 text-sm text-slate-500">
        One page — pin the location, pick what happened, send. In a life-threatening
        emergency, call <a href="tel:112" className="font-bold text-red-700 underline">112</a> first (<strong>101</strong> fire · <strong>108</strong> ambulance · <strong>1077</strong> disaster).
      </p>

      <Card className="mt-4">
        <CardContent className="space-y-6 pt-5">
          <div>
            <Label required>Where did it happen?</Label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div>
            <Label required>What happened?</Label>
            <div className="grid grid-cols-3 gap-2">
              {DISASTER_TYPES.map((value) => {
                const { label, hint, Icon } = DISASTER_TYPE_META[value];
                const active = disasterType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDisasterType(value)}
                    aria-pressed={active}
                    className={cn(
                      'min-h-[76px] cursor-pointer touch-manipulation rounded-xl border-2 p-2 text-center transition-colors active:scale-[0.98]',
                      active
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <Icon className={cn('mx-auto h-8 w-8', active ? 'text-brand-600' : 'text-slate-400')} />
                    <p className="mt-1 text-sm font-bold text-slate-900">{label}</p>
                    <p className="hidden text-xs text-slate-500 sm:block">{hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label required>Anyone injured or trapped?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHasInjuries(true)}
                aria-pressed={hasInjuries === true}
                className={cn(
                  'min-h-[52px] flex-1 cursor-pointer touch-manipulation rounded-xl border-2 py-3.5 text-base font-bold active:scale-[0.98]',
                  hasInjuries === true ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500',
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setHasInjuries(false)}
                aria-pressed={hasInjuries === false}
                className={cn(
                  'min-h-[52px] flex-1 cursor-pointer touch-manipulation rounded-xl border-2 py-3.5 text-base font-bold active:scale-[0.98]',
                  hasInjuries === false ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500',
                )}
              >
                No
              </button>
            </div>
            {hasInjuries ? (
              <div className="mt-2 max-w-44">
                <Label htmlFor="injuryCount">How many?</Label>
                <Input
                  id="injuryCount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  value={injuryCount}
                  onChange={(e) => setInjuryCount(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          {/* Optional extras — collapsed so the send button stays near */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowPhotos((v) => !v)}
              aria-expanded={showPhotos}
              className="flex min-h-[44px] w-full cursor-pointer touch-manipulation items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              📷 Add photos (optional){showPhotos ? ' ▲' : ' ▼'}
            </button>
            {showPhotos ? (
              <div>
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => addPhotos(e.target.files)}
                />
                {previews.length > 0 ? (
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {previews.map((src, i) => (
                      <div key={src} className="relative">
                        <img src={src} alt={`Evidence ${i + 1}`} className="h-20 w-full rounded-lg border border-slate-200 object-cover" />
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                          className="absolute -top-3 -right-3 flex h-11 w-11 min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full bg-slate-900 text-lg text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              className="flex min-h-[44px] w-full cursor-pointer touch-manipulation items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              ✏️ Add details (optional){showDetails ? ' ▲' : ' ▼'}
            </button>
            {showDetails ? (
              <Textarea
                id="desc"
                placeholder="Landmarks, scale of damage, people affected, road access…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            ) : null}
          </div>

          {location && disasterType ? (
            <dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 font-semibold text-slate-500">Location</dt>
                <dd className="text-right font-medium text-slate-900">
                  {resolvingAddress ? 'Resolving address…' : address}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-500">Priority</dt>
                <dd>{previewReport[0] ? <SeverityBadge value={previewReport[0].severity} /> : null}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">Reporting as</dt>
                <dd className="font-medium text-slate-900">{profile ? profile.full_name : 'Guest (anonymous)'}</dd>
              </div>
            </dl>
          ) : null}
          {!profile ? (
            <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              You are reporting as a guest. The report is still sent to the response team.
              Sign in to track all your reports in one place.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Sticky send bar — always visible above the bottom tab bar */}
      <div className="sticky bottom-20 mt-3 sm:bottom-4">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
          <Button
            size="lg"
            className="w-full"
            disabled={!canSubmit || submitting || resolvingAddress}
            onClick={() => void handleSubmit()}
          >
            {submitting ? 'Sending…' : 'Send incident report →'}
          </Button>
          {!canSubmit ? (
            <p className="mt-1 text-center text-xs font-semibold text-slate-500">
              {!location ? 'Drop a pin on the map above' : !disasterType ? 'Pick what happened' : 'Say if anyone is injured'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
