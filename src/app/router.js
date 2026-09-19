import { jsx as _jsx } from "react/jsx-runtime";
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
        element: _jsx(PublicLayout, {}),
        children: [
            { path: '/', element: _jsx(Home, {}) },
            { path: '/login', element: _jsx(Login, {}) },
            { path: '/login/phone', element: _jsx(PhoneLogin, {}) },
            { path: '/register', element: _jsx(Register, {}) },
            { path: '/report', element: _jsx(ReportDisaster, {}) },
            { path: '/evacuate/:id', element: _jsx(Evacuate, {}) },
            { path: '/track', element: _jsx(TrackReport, {}) },
            { path: '/track/:id', element: _jsx(TrackReport, {}) },
        ],
    },
    {
        element: _jsx(RequireAuth, {}),
        children: [
            {
                element: _jsx(RequireAdmin, {}),
                children: [
                    {
                        element: _jsx(AdminLayout, {}),
                        children: [
                            { path: '/admin', element: _jsx(AdminDashboard, {}) },
                            { path: '/admin/reports', element: _jsx(AdminReports, {}) },
                            { path: '/admin/safe-zones', element: _jsx(AdminSafeZones, {}) },
                            { path: '/admin/analytics', element: _jsx(AdminAnalytics, {}) },
                            { path: '/admin/users', element: _jsx(AdminUsers, {}) },
                            { path: '/admin/settings', element: _jsx(AdminSettings, {}) },
                        ],
                    },
                ],
            },
        ],
    },
    { path: '*', element: _jsx(NotFound, {}) },
]);
