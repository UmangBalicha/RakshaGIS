import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { signUp } from '../../lib/auth';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, CardContent, CardHeader, CardTitle, FieldError, Input, Label } from '../../components/ui';
const schema = z.object({
    full_name: z.string().min(2, 'Please enter your full name'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    phone: z
        .string()
        .optional()
        .refine((v) => !v || /^[+\d][\d\s-]{7,15}$/.test(v), 'Enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export default function Register() {
    const navigate = useNavigate();
    const setProfile = useAuthStore((s) => s.setProfile);
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm({ resolver: zodResolver(schema) });
    const onSubmit = async (values) => {
        setSubmitting(true);
        try {
            const profile = await signUp({
                full_name: values.full_name,
                email: values.email,
                password: values.password,
                phone: values.phone || undefined,
            });
            setProfile(profile);
            toast.success('Account created. Welcome to RakshaGIS.');
            navigate(profile.role === 'admin' ? '/admin' : '/', { replace: true });
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Registration failed.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "mx-auto max-w-md", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Create an account" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Report incidents faster and track their status." })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: (e) => void handleSubmit(onSubmit)(e), className: "space-y-4", noValidate: true, children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "full_name", required: true, children: "Full name" }), _jsx(Input, { id: "full_name", autoComplete: "name", placeholder: "e.g. Ananya Gupta", ...register('full_name') }), _jsx(FieldError, { message: errors.full_name?.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", required: true, children: "Email" }), _jsx(Input, { id: "email", type: "email", autoComplete: "email", placeholder: "you@example.in", ...register('email') }), _jsx(FieldError, { message: errors.email?.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: "Phone (optional)" }), _jsx(Input, { id: "phone", type: "tel", autoComplete: "tel", placeholder: "+91 98XXX XXXXX", ...register('phone') }), _jsx(FieldError, { message: errors.phone?.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "password", required: true, children: "Password" }), _jsx(Input, { id: "password", type: "password", autoComplete: "new-password", placeholder: "Min. 6 characters", ...register('password') }), _jsx(FieldError, { message: errors.password?.message })] }), _jsx(Button, { type: "submit", className: "w-full", size: "lg", disabled: submitting, children: submitting ? 'Creating account…' : 'Create account' })] }), _jsxs("div", { className: "mt-4 text-center text-sm text-slate-500", children: ["Already registered?", ' ', _jsx(Link, { to: "/login", className: "inline-flex min-h-[44px] touch-manipulation items-center font-bold text-brand-600 hover:text-brand-700 hover:underline", children: "Sign in" })] })] })] }) }));
}
