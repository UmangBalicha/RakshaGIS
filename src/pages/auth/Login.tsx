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

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const profile = await signIn(values.email, values.password);
      setProfile(profile);
      toast.success(`Welcome back, ${profile.full_name}.`);
      navigate(profile.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to RakshaGIS</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Authority staff and registered citizens sign in here.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email" required>Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.in" {...register('email')} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="password" required>Password</Label>
              <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
              <FieldError message={errors.password?.message} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link to="/login/phone" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
              Sign in with phone OTP instead →
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
              Create an account
            </Link>
          </div>

          {isDemoMode ? (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              <p className="font-bold">Demo accounts (no setup needed):</p>
              <p className="mt-1">Admin — admin@rakshagis.in / admin123</p>
              <p>Public — user@rakshagis.in / user123</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
