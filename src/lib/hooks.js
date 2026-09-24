import { useEffect, useState } from 'react';
import { useReportStore } from '../stores/reportStore';
/* Realtime fan-out is the first thing to shed under fleet load: Supabase
 * plans cap concurrent realtime connections, so operators can flip
 * VITE_REALTIME_ENABLED=false and fall back to 30s polling with zero
 * code changes. Demo mode is unaffected (local events are free). */
const REALTIME_ON = (import.meta.env.VITE_REALTIME_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
/** Keeps the report store fresh via realtime (Supabase) or local events (demo). */
export function useLiveReports(enabled = true) {
    const refresh = useReportStore((s) => s.refresh);
    const subscribeLive = useReportStore((s) => s.subscribeLive);
    useEffect(() => {
        if (!enabled)
            return;
        void refresh();
        if (!REALTIME_ON && typeof window !== 'undefined') {
            const timer = window.setInterval(() => {
                void refresh();
            }, 30000);
            return () => window.clearInterval(timer);
        }
        return subscribeLive();
    }, [enabled, refresh, subscribeLive]);
}
/**
 * Live "wide screen" flag that follows fold/unfold, rotation and window
 * resizing. Unlike a one-shot window.innerWidth read, this keeps working
 * when a foldable crosses the breakpoint while the app is open.
 */
export function useWideScreen(breakpoint = 769) {
    const [wide, setWide] = useState(() => typeof window === 'undefined' || window.innerWidth >= breakpoint);
    useEffect(() => {
        const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
        const onChange = () => setWide(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [breakpoint]);
    return wide;
}
