import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Spinner } from '../ui';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8" />
        <p className="text-sm font-semibold text-slate-500">Loading RakshaGIS…</p>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const initialized = useAuthStore((s) => s.initialized);
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();

  if (!initialized) return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireAdmin() {
  const initialized = useAuthStore((s) => s.initialized);
  const profile = useAuthStore((s) => s.profile);

  if (!initialized) return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  if (profile.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
