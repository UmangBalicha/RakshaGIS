import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { signIn } from '../../lib/auth';
import { isDemoMode } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, CardContent, CardHeader, CardTitle, FieldError, Input, Label } from '../../components/ui';
const schema = z.object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});
export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const setProfile = useAuthStore((s) => s.setProfile);
    const [submitting, setSubmitting] = useState(false);
    const from = location.state?.from ?? '/';
    const { register, handleSubmit, formState: { errors }, } = useForm({ resolver: zodResolver(schema) });
    const onSubmit = async (values) => {
        setSubmitting(true);
        try {
            const profile = await signIn(values.email, values.password);
            setProfile(profile);
            toast.success(`Welcome back, ${profile.full_name}.`);
            // Honor the page the user originally tried to open (stored by the
            // auth guard), unless it is itself an auth page.
            const dest = from && !from.startsWith('/login') && from !== '/register'
                ? from
                : (profile.role === 'admin' ? '/admin' : '/');
            navigate(dest, { replace: true });
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Sign in failed.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "mx-auto max-w-md", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Sign in to RakshaGIS" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Authority staff and registered citizens sign in here." })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: (e) => void handleSubmit(onSubmit)(e), className: "space-y-4", noValidate: true, children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "email", required: true, children: "Email" }), _jsx(Input, { id: "email", type: "email", autoComplete: "email", placeholder: "you@example.in", ...register('email') }), _jsx(FieldError, { message: errors.email?.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "password", required: true, children: "Password" }), _jsx(Input, { id: "password", type: "password", autoComplete: "current-password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ...register('password') }), _jsx(FieldError, { message: errors.password?.message })] }), _jsx(Button, { type: "submit", className: "w-full", size: "lg", disabled: submitting, children: submitting ? 'Signing in…' : 'Sign in' })] }), _jsx("div", { className: "mt-4 text-center text-sm", children: _jsx(Link, { to: "/login/phone", className: "inline-flex min-h-[44px] touch-manipulation items-center font-bold text-brand-600 hover:text-brand-700 hover:underline", children: "Sign in with phone OTP instead \u2192" }) }), _jsxs("div", { className: "mt-2 text-center text-sm text-slate-500", children: ["New here?", ' ', _jsx(Link, { to: "/register", className: "inline-flex min-h-[44px] touch-manipulation items-center font-bold text-brand-600 hover:text-brand-700 hover:underline", children: "Create an account" })] }), isDemoMode ? (_jsxs("div", { className: "mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900", children: [_jsx("p", { className: "font-bold", children: "Demo accounts (no setup needed):" }), _jsx("p", { className: "mt-1", children: "Admin \u2014 admin@rakshagis.in / admin123" }), _jsx("p", { children: "Public \u2014 user@rakshagis.in / user123" })] })) : null] })] }) }));
}
