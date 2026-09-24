import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout, PublicLayout } from '../components/layout/Layout';
import { RequireAdmin, RequireAuth } from '../components/layout/AuthGuard';
import { Spinner } from '../components/ui';

/* Route-level code splitting: layouts/guards stay in the entry bundle so
 * first paint is fast; every page (including Leaflet + Recharts) loads on
 * demand. Critical for low-end phones on slow networks at scale. */
function el(Component) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16" aria-label="Loading page">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

const Home = lazy(() => import('../pages/Home'));
const Evacuate = lazy(() => import('../pages/Evacuate'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const PhoneLogin = lazy(() => import('../pages/auth/PhoneLogin'));
const ReportDisaster = lazy(() => import('../pages/ReportDisaster'));
const ReportSuccess = lazy(() => import('../pages/ReportSuccess'));
const TrackReport = lazy(() => import('../pages/TrackReport'));
const Privacy = lazy(() => import('../pages/Privacy'));
const Terms = lazy(() => import('../pages/Terms'));
const NotFound = lazy(() => import('../pages/NotFound'));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminReports = lazy(() => import('../pages/admin/Reports'));
const AdminRedZones = lazy(() => import('../pages/admin/RedZones'));
const AdminRelocation = lazy(() => import('../pages/admin/Relocation'));
const AdminAnalytics = lazy(() => import('../pages/admin/Analytics'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));
const AdminSafeZones = lazy(() => import('../pages/admin/SafeZones'));

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
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
  { path: '*', element: el(NotFound) },
]);
