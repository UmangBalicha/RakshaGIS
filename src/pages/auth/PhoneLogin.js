import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { sendPhoneOtp, verifyPhoneOtp } from '../../lib/auth';
import { isDemoMode } from '../../lib/api';
import { DEMO_OTP_CODE } from '../../lib/mock';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';
function normalizePhone(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10)
        return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91'))
        return `+${digits}`;
    if (raw.trim().startsWith('+'))
        return raw.trim();
    throw new Error('Enter a valid 10-digit mobile number.');
}
export default function PhoneLogin() {
    const navigate = useNavigate();
    const setProfile = useAuthStore((s) => s.setProfile);
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const handleSend = async () => {
        let normalized;
        try {
            normalized = normalizePhone(phone);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Invalid phone number.');
            return;
        }
        setBusy(true);
        try {
            await sendPhoneOtp(normalized);
            setPhone(normalized);
            setStep(2);
            toast.success(isDemoMode ? `Demo OTP sent. Use code ${DEMO_OTP_CODE}.` : 'OTP sent via SMS.');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not send OTP.');
        }
        finally {
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
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Verification failed.');
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsx("div", { className: "mx-auto max-w-md", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Sign in with phone OTP" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: step === 1 ? 'Enter your mobile number to receive a code.' : `Code sent to ${phone}.` })] }), _jsxs(CardContent, { className: "space-y-4", children: [step === 1 ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", required: true, children: "Mobile number" }), _jsx(Input, { id: "phone", type: "tel", autoComplete: "tel", placeholder: "98XXX XXXXX", value: phone, onChange: (e) => setPhone(e.target.value) })] }), _jsx(Button, { className: "w-full", size: "lg", disabled: busy, onClick: () => void handleSend(), children: busy ? 'Sending…' : 'Send OTP' })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "otp", required: true, children: "6-digit code" }), _jsx(Input, { id: "otp", inputMode: "numeric", placeholder: "123456", value: code, onChange: (e) => setCode(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "otp-name", children: "Your name (for first-time users)" }), _jsx(Input, { id: "otp-name", placeholder: "e.g. Ananya Gupta", value: name, onChange: (e) => setName(e.target.value) })] }), _jsx(Button, { className: "w-full", size: "lg", disabled: busy, onClick: () => void handleVerify(), children: busy ? 'Verifying…' : 'Verify & sign in' }), _jsx(Button, { variant: "ghost", className: "w-full", onClick: () => setStep(1), children: "\u2190 Use a different number" })] })), _jsx("div", { className: "text-center text-sm", children: _jsx(Link, { to: "/login", className: "font-bold text-brand-600 hover:text-brand-700 hover:underline", children: "Sign in with email instead \u2192" }) })] })] }) }));
}
