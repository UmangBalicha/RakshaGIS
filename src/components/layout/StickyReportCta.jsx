import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin } from 'lucide-react';

/**
 * Mobile-only sticky "Report an incident" CTA. Appears once the page's main
 * call-to-action has scrolled out of view (or, on pages without one, after
 * scrolling past ~480px). Hidden on /report (which has its own sticky send
 * bar) and on /admin (desktop console). Sits above the bottom tab bar and
 * respects the iPhone home-indicator safe area via .rg-sticky-cta.
 */
export default function StickyReportCta() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const hero = document.getElementById('rg-emergency-card');
    if (hero && typeof IntersectionObserver !== 'undefined') {
      const obs = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
        threshold: 0,
      });
      obs.observe(hero);
      return () => obs.disconnect();
    }
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  if (pathname.startsWith('/report') || pathname.startsWith('/admin')) return null;
  if (!visible) return null;

  return (
    <div className="rg-sticky-cta fixed inset-x-0 z-[950] px-4 sm:hidden">
      <Link
        to="/report"
        className="flex min-h-[52px] touch-manipulation items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-base font-extrabold text-white shadow-lg active:scale-[0.98]"
      >
        <MapPin className="h-5 w-5" /> Report an incident →
      </Link>
    </div>
  );
}
