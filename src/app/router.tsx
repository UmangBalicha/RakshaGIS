import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout, PublicLayout } from '../components/layout/Layout';
import { RequireAdmin, RequireAuth } from '../components/layout/AuthGuard';
import Home from '../pages/Home';
import Evacuate from '../pages/Evacuate';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import PhoneLogin from '../pages/auth/PhoneLogin';
import ReportDisaster from '../pages/ReportDisaster';
import TrackReport from '../pages/TrackReport';
import NotFound from '../pages/NotFound';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminReports from '../pages/admin/Reports';
import AdminAnalytics from '../pages/admin/Analytics';
import AdminUsers from '../pages/admin/Users';
import AdminSettings from '../pages/admin/Settings';
import AdminSafeZones from '../pages/admin/SafeZones';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/login/phone', element: <PhoneLogin /> },
      { path: '/register', element: <Register /> },
      { path: '/report', element: <ReportDisaster /> },
      { path: '/evacuate/:id', element: <Evacuate /> },
      { path: '/track', element: <TrackReport /> },
      { path: '/track/:id', element: <TrackReport /> },
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
              { path: '/admin', element: <AdminDashboard /> },
              { path: '/admin/reports', element: <AdminReports /> },
              { path: '/admin/safe-zones', element: <AdminSafeZones /> },
              { path: '/admin/analytics', element: <AdminAnalytics /> },
              { path: '/admin/users', element: <AdminUsers /> },
              { path: '/admin/settings', element: <AdminSettings /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
