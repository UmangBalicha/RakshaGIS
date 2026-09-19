import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { sendPhoneOtp, verifyPhoneOtp } from '../../lib/auth';
import { isDemoMode } from '../../lib/api';
import { DEMO_OTP_CODE } from '../../lib/mock';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.trim().startsWith('+')) return raw.trim();
  throw new Error('Enter a valid 10-digit mobile number.');
}

export default function PhoneLogin() {
  const navigate = useNavigate();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    let normalized: string;
    try {
      normalized = normalizePhone(phone);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid phone number.');
      return;
    }
    setBusy(true);
    try {
      await sendPhoneOtp(normalized);
      setPhone(normalized);
      setStep(2);
      toast.success(isDemoMode ? `Demo OTP sent. Use code ${DEMO_OTP_CODE}.` : 'OTP sent via SMS.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send OTP.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length < 4) {
      toast.error('Please enter the OTP code.');
      return;
    }
    setBusy(true);
    try {
      const profile = await verifyPhoneOtp({ phone, code, full_name: name || undefined });
      setProfile(profile);
      toast.success(`Verified. Welcome, ${profile.full_name}.`);
      navigate(profile.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
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
                  onChange={(e) => setPhone(e.target.value)}
                />
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
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
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
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
              Sign in with email instead →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
