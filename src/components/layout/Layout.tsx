import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Home, LayoutDashboard, MapPin, Menu, Search, ShieldAlert, X } from 'lucide-react';
import { listNotifications, markNotificationRead } from '../../lib/api';
import { isDemoMode } from '../../lib/api';
import { cn, timeAgo } from '../../lib/utils';
import type { AppNotification } from '../../lib/types';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui';

/* ---------------- Notifications bell ---------------- */

export function NotificationsBell() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    listNotifications(profile.id)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => undefined);
    const timer = window.setInterval(() => {
      if (!profile) return;
      listNotifications(profile.id)
        .then((rows) => {
          if (!cancelled) setItems(rows);
        })
        .catch(() => undefined);
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [profile]);

  if (!profile) return null;
  const unread = items.filter((n) => !n.is_read).length;

  const openItem = async (n: AppNotification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id).catch(() => undefined);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    setOpen(false);
    // Deep-link: tapping a notification opens its incident report.
    if (n.report_id) navigate(`/track/${n.report_id}`);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">Notifications</p>
            </div>
            <div className="rg-scroll max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void openItem(n)}
                    className={cn(
                      'block w-full cursor-pointer touch-manipulation border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50',
                      !n.is_read && 'bg-brand-50/60',
                    )}
                  >
                    <p className="text-sm font-bold text-slate-900">{n.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ---------------- Public layout ---------------- */

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
        <ShieldAlert className="h-5 w-5" />
      </span>
      <span className="text-base font-extrabold tracking-tight text-slate-900 min-[400px]:text-lg">
        Raksha<span className="text-brand-600">GIS</span>
      </span>
    </Link>
  );
}

export function PublicLayout() {
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  const tabCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-[56px] flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-bold',
      isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900',
    );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="rg-safe-top sticky top-0 z-[1000] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="rg-gutter-x mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 sm:h-16">
          <Brand />
          {/* Desktop nav — hidden on phones, replaced by bottom tab bar */}
          <nav className="hidden items-center gap-1 text-sm font-semibold sm:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2.5', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900')
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/report"
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2.5', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900')
              }
            >
              Report Incident
            </NavLink>
            <NavLink
              to="/track"
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2.5', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900')
              }
            >
              Track
            </NavLink>
            {profile?.role === 'admin' ? (
              <NavLink
                to="/admin"
                className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2.5 text-white hover:bg-slate-700"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </NavLink>
            ) : null}
          </nav>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            {profile ? (
              <>
                <span className="hidden max-w-32 truncate text-sm font-semibold text-slate-600 md:block">
                  {profile.full_name}
                </span>
                <span className="hidden sm:inline-flex">
                  <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
                    Sign out
                  </Button>
                </span>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden min-h-[44px] items-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white touch-manipulation hover:bg-brand-700 sm:inline-flex"
              >
                Sign in
              </Link>
            )}
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 sm:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {isDemoMode ? (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-semibold text-amber-800">
            Demo mode — data is stored locally in this browser. Add Supabase keys in .env to go live.
          </div>
        ) : null}
        {/* Mobile slide-down menu */}
        {menuOpen ? (
          <nav className="rg-gutter-x border-t border-slate-100 bg-white py-3 sm:hidden">
            <div className="flex flex-col gap-1">
              {profile?.role === 'admin' ? (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[48px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white touch-manipulation"
                >
                  <LayoutDashboard className="h-4 w-4" /> Authority dashboard
                </Link>
              ) : null}
              {profile ? (
                <>
                  <p className="px-4 py-2 text-sm font-semibold text-slate-500">
                    Signed in as {profile.full_name}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex min-h-[48px] cursor-pointer touch-manipulation items-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[48px] items-center justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white touch-manipulation"
                >
                  Sign in
                </Link>
              )}
              <p className="mt-2 px-4 text-xs font-bold tracking-wide text-slate-400 uppercase">Emergency numbers</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { num: '112', label: 'National' },
                  { num: '101', label: 'Fire' },
                  { num: '108', label: 'Ambulance' },
                  { num: '1077', label: 'Disaster' },
                ].map((e) => (
                  <a
                    key={e.num}
                    href={`tel:${e.num}`}
                    className="flex min-h-[48px] touch-manipulation flex-col items-center justify-center rounded-lg bg-red-50 py-2 ring-1 ring-red-200 ring-inset"
                  >
                    <span className="text-base font-extrabold text-red-700 tabular-nums">{e.num}</span>
                    <span className="text-xs font-bold text-red-400">{e.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </nav>
        ) : null}
      </header>
      <main className="rg-gutter-x mx-auto w-full max-w-6xl flex-1 pt-4 pb-24 sm:py-6 sm:pb-6">
        <Outlet />
      </main>
      <footer className="mb-16 border-t border-slate-200 bg-white sm:mb-0">
        <div className="rg-gutter-x mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 py-5 text-sm text-slate-500 sm:flex-row sm:text-xs">
          <p className="font-semibold">RakshaGIS — disaster reporting & response</p>
          <p>
            Emergencies: <strong>112</strong> national · <strong>101</strong> fire · <strong>108</strong> ambulance · <strong>1077</strong> disaster.
            {import.meta.env.VITE_MAPMYINDIA_KEY
              ? ' Map: © MapmyIndia.'
              : ' Map: © OpenStreetMap · boundaries are indicative.'}
          </p>
          <p className="text-xs sm:text-xs">
            Built by <span className="font-bold text-slate-700">Umang Balicha</span>
          </p>
        </div>
      </footer>

      {/* Bottom tab bar — mobile only */}
      <nav className="rg-bottom-safe rg-gutter-x fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="flex items-stretch">
          <NavLink to="/" end className={tabCls}>
            <Home className="h-6 w-6" />
            Home
          </NavLink>
          <NavLink to="/report" className={tabCls}>
            <MapPin className="h-6 w-6" />
            Report
          </NavLink>
          <NavLink to="/track" className={tabCls}>
            <Search className="h-6 w-6" />
            Track
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

/* ---------------- Admin layout ---------------- */

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/safe-zones', label: 'Safe Zones' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/settings', label: 'Settings' },
];

export function AdminLayout() {
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="rg-safe-top sticky top-0 z-[1000] border-b border-slate-200 bg-white">
        <div className="rg-gutter-x mx-auto flex h-16 max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Brand />
            <span className="hidden rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white md:inline-block">
              AUTHORITY CONSOLE
            </span>
          </div>
          <nav className="hidden items-center gap-1 text-sm font-semibold lg:flex">
            {ADMIN_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/"
              className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Public site
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <span className="hidden text-sm font-semibold text-slate-600 md:block">
              {profile?.full_name} · Admin
            </span>
            <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="rg-gutter-x flex items-center gap-1 overflow-x-auto border-t border-slate-100 py-2 text-sm font-semibold lg:hidden">
          {ADMIN_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2.5 whitespace-nowrap touch-manipulation',
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="rg-gutter-x mx-auto w-full max-w-7xl flex-1 py-6">
        <Outlet />
      </main>
    </div>
  );
}
