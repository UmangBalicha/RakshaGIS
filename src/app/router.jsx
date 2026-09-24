import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout, PublicLayout } from '../components/layout/Layout';
import { RequireAdmin, RequireAuth } from '../components/layout/AuthGuard';
import { Spinner } from '../components/ui';

/* Route-level code splitting: layouts/guards stay in the entry bundle so
 * first paint is fast; every page (including Leaflet + Recharts) loads on
 * demand. Critical for low-end phones on slow networks at scale. */
function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (e) {
      // Stale hashed chunk after a deploy (immutable /assets/* caching means
      // the old chunk 404s) or a network blip: reload once, then give up and
      // let the route error boundary render branded recovery UI.
      const key = 'rg_chunk_retry_v1';
      let retried = false;
      try {
        retried = sessionStorage.getItem(key) === '1';
        sessionStorage.setItem(key, '1');
      } catch {
        /* storage unavailable — retry once anyway */
      }
      if (!retried) {
        window.location.reload();
        return new Promise(() => {});
      }
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      throw e;
    }
  });
}

/** Branded recovery for render/lazy-chunk failures (React Router shows a raw
 * stack trace by default). Plain <a> tags only — this renders outside the
 * normal route tree, so router components may not work here. */
function RouteError() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-5xl font-extrabold text-slate-200">!</p>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        This page failed to load — often fixed by reloading, especially right
        after an app update. In an emergency, call{' '}
        <a href="tel:112" className="font-bold text-red-700 underline">112</a> first.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <a
          href={window.location.pathname + window.location.search}
          className="inline-flex min-h-[56px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 text-base font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Reload this page
        </a>
        <a
          href="/"
          className="inline-flex min-h-[56px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}

function el(Component) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16" role="status">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

const Home = lazyWithRetry(() => import('../pages/Home'));
const Evacuate = lazyWithRetry(() => import('../pages/Evacuate'));
const Login = lazyWithRetry(() => import('../pages/auth/Login'));
const Register = lazyWithRetry(() => import('../pages/auth/Register'));
const PhoneLogin = lazyWithRetry(() => import('../pages/auth/PhoneLogin'));
const ReportDisaster = lazyWithRetry(() => import('../pages/ReportDisaster'));
const ReportSuccess = lazyWithRetry(() => import('../pages/ReportSuccess'));
const TrackReport = lazyWithRetry(() => import('../pages/TrackReport'));
const Privacy = lazyWithRetry(() => import('../pages/Privacy'));
const Terms = lazyWithRetry(() => import('../pages/Terms'));
const NotFound = lazyWithRetry(() => import('../pages/NotFound'));
const AdminDashboard = lazyWithRetry(() => import('../pages/admin/Dashboard'));
const AdminReports = lazyWithRetry(() => import('../pages/admin/Reports'));
const AdminRedZones = lazyWithRetry(() => import('../pages/admin/RedZones'));
const AdminRelocation = lazyWithRetry(() => import('../pages/admin/Relocation'));
const AdminAnalytics = lazyWithRetry(() => import('../pages/admin/Analytics'));
const AdminUsers = lazyWithRetry(() => import('../pages/admin/Users'));
const AdminSettings = lazyWithRetry(() => import('../pages/admin/Settings'));
const AdminSafeZones = lazyWithRetry(() => import('../pages/admin/SafeZones'));

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: el(Home) },
      { path: '/login', element: el(Login) },
      { path: '/login/phone', element: el(PhoneLogin) },
      { path: '/register', element: el(Register) },
      { path: '/report', element: el(ReportDisaster) },
      { path: '/report/success/:id', element: el(ReportSuccess) },
      { path: '/evacuate/:id', element: el(Evacuate) },
      { path: '/track', element: el(TrackReport) },
      { path: '/track/:id', element: el(TrackReport) },
      { path: '/privacy', element: el(Privacy) },
      { path: '/terms', element: el(Terms) },
    ],
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin', element: el(AdminDashboard) },
              { path: '/admin/reports', element: el(AdminReports) },
              { path: '/admin/red-zones', element: el(AdminRedZones) },
              { path: '/admin/relocation', element: el(AdminRelocation) },
              { path: '/admin/safe-zones', element: el(AdminSafeZones) },
              { path: '/admin/analytics', element: el(AdminAnalytics) },
              { path: '/admin/users', element: el(AdminUsers) },
              { path: '/admin/settings', element: el(AdminSettings) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: el(NotFound), errorElement: <RouteError /> },
]);
