import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { isDemoMode } from '../../lib/api';
import { isSupabaseEnabled } from '../../lib/supabase';
import { mockResetDemo } from '../../lib/mock';
import { useAuthStore } from '../../stores/authStore';
import { useReportStore } from '../../stores/reportStore';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '../../components/ui';

const NOTIF_KEY = 'rakshagis_notif_prefs_v1';

interface NotifPrefs {
  browser: boolean;
  criticalOnly: boolean;
}

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return JSON.parse(raw) as NotifPrefs;
  } catch {
    /* ignore */
  }
  return { browser: true, criticalOnly: false };
}

export default function AdminSettings() {
  const profile = useAuthStore((s) => s.profile);
  const refresh = useReportStore((s) => s.refresh);
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);
  const [permission, setPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const enableBrowser = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('This browser does not support notifications.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setPrefs((p) => ({ ...p, browser: true }));
      toast.success('Browser notifications enabled.');
    } else {
      toast.error('Notification permission was denied.');
    }
  };

  const testNotification = () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      toast.error('Enable browser notifications first.');
      return;
    }
    new Notification('RakshaGIS test alert', {
      body: 'Critical landslide near Mallital, Nainital — triage required.',
    });
    toast.success('Test notification sent.');
  };

  const resetDemo = async () => {
    if (!isDemoMode) {
      toast.error('Demo reset is only available in demo mode.');
      return;
    }
    mockResetDemo();
    await refresh();
    toast.success('Demo data restored to seed state.');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Console preferences, alerts and backend status.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Signed in as</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <p className="font-bold text-slate-900">{profile?.full_name}</p>
          <p className="text-slate-500">{profile?.email ?? profile?.phone} · role: {profile?.role}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alert notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Browser notifications</Label>
              <p className="text-xs text-slate-500">Status: {permission}. Pop a system alert when new reports arrive.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void enableBrowser()}>
              {permission === 'granted' ? 'Re-check' : 'Enable'}
            </Button>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <div>
              <Label>Critical-only alerts</Label>
              <p className="text-xs text-slate-500">Only notify for critical-severity reports.</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.criticalOnly}
              onChange={(e) => setPrefs((p) => ({ ...p, criticalOnly: e.target.checked }))}
              className="h-5 w-5 accent-red-600"
            />
          </label>
          <Button variant="secondary" size="sm" onClick={testNotification}>Send test alert</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Backend connection</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {isSupabaseEnabled ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
              <p className="font-bold">Live — connected to Supabase.</p>
              <p className="mt-0.5 text-xs">Reports, auth and realtime sync use your Supabase project. Run supabase/schema.sql once to create tables.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <p className="font-bold">Demo mode — no backend keys found.</p>
              <p className="mt-0.5 text-xs">Data is seeded locally in this browser. Copy .env.example to .env and add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to go live.</p>
            </div>
          )}
          {isDemoMode ? (
            <Button variant="danger" size="sm" className="mt-3" onClick={() => void resetDemo()}>
              Restore demo seed data
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Triage guide</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-xs text-slate-600">
            <li><strong>Critical</strong> — injuries reported, or an event threatening homes, hospitals or highways (quake, tsunami, cyclone, major blast). Triage immediately.</li>
            <li><strong>High</strong> — spreading floods, landslides, wildfires, or hazmat leaks affecting habitation.</li>
            <li><strong>Medium</strong> — contained building fires or slow-moving events away from people.</li>
            <li><strong>Low</strong> — minor, already controlled, or likely false alarm pending verification.</li>
            <li>Move reports through Pending → Investigating → Contained → Resolved so citizens see progress.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
