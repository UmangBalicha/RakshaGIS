import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { sendPhoneOtp, verifyPhoneOtp } from '../../lib/auth';
import { isDemoMode } from '../../lib/api';
import { DEMO_OTP_CODE } from '../../lib/mock';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, CardContent, CardHeader, CardTitle, FieldError, Input, Label } from '../../components/ui';

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.trim().startsWith('+')) return raw.trim();
  throw new Error('Enter a valid 10-digit mobile number.');
}

export default function PhoneLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const setProfile = useAuthStore((s) => s.setProfile);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    setPhoneError('');
    let normalized;
    try {
      normalized = normalizePhone(phone);
    } catch (e) {
      setPhoneError(e instanceof Error ? e.message : 'Invalid phone number.');
      return;
    }
    setBusy(true);
    try {
      await sendPhoneOtp(normalized);
      setPhone(normalized);
      setStep(2);
      toast.success(isDemoMode ? `Demo OTP sent. Use code ${DEMO_OTP_CODE}.` : 'OTP sent via SMS.');
    } catch (e) {
      setPhoneError(e instanceof Error ? e.message : 'Could not send OTP.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setCodeError('');
    const digits = code.trim();
    if (!/^\d{6}$/.test(digits)) {
      setCodeError('Enter the 6-digit code from your SMS.');
      return;
    }
    setBusy(true);
    try {
      const profile = await verifyPhoneOtp({ phone, code, full_name: name || undefined });
      setProfile(profile);
      toast.success(`Verified. Welcome, ${profile.full_name}.`);
      const dest = from && !from.startsWith('/login') && from !== '/register'
        ? from
        : (profile.role === 'admin' ? '/admin' : '/');
      navigate(dest, { replace: true });
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : 'Verification failed. Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="hidden overflow-hidden rounded-2xl bg-slate-900 p-6 text-white lg:block">
        <p className="text-xl font-extrabold tracking-tight">RakshaGIS</p>
        <p className="mt-2 text-sm text-slate-300">
          Report disasters, track response and evacuate to safety — all hazards, one live map.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-200">
          <li>✓ Live incident map with severity tracking</li>
          <li>✓ Road routing to the nearest safe zone</li>
          <li>✓ Red-zone intelligence for authorities</li>
        </ul>
        <p className="mt-4 rounded-lg bg-white/10 p-3 text-sm font-bold">Emergency? Call 112 first.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sign in with phone OTP</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {step === 1 ? 'Enter your mobile number to receive a code.' : `Code sent to ${phone}.`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <Label htmlFor="phone" required>Mobile number</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="98XXX XXXXX"
                  value={phone}
                  aria-invalid={phoneError ? true : undefined}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError('');
                  }}
                />
                <FieldError message={phoneError} />
              </div>
              <Button className="w-full" size="lg" disabled={busy} onClick={() => void handleSend()}>
                {busy ? 'Sending…' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="otp" required>6-digit code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  aria-invalid={codeError ? true : undefined}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError('');
                  }}
                />
                <FieldError message={codeError} />
              </div>
              <div>
                <Label htmlFor="otp-name">Your name (for first-time users)</Label>
                <Input
                  id="otp-name"
                  placeholder="e.g. Ananya Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <Button className="w-full" size="lg" disabled={busy} onClick={() => void handleVerify()}>
                {busy ? 'Verifying…' : 'Verify & sign in'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
                ← Use a different number
              </Button>
            </>
          )}
          <div className="text-center text-sm">
            <Link
              to="/login"
              className="inline-flex min-h-[44px] touch-manipulation items-center font-bold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Sign in with email instead →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
