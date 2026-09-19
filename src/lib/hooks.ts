import { useEffect, useState } from 'react';
import { useReportStore } from '../stores/reportStore';

/** Keeps the report store fresh via realtime (Supabase) or local events (demo). */
export function useLiveReports(enabled = true): void {
  const refresh = useReportStore((s) => s.refresh);
  const subscribeLive = useReportStore((s) => s.subscribeLive);
  useEffect(() => {
    if (!enabled) return;
    void refresh();
    return subscribeLive();
  }, [enabled, refresh, subscribeLive]);
}

/**
 * Live "wide screen" flag that follows fold/unfold, rotation and window
 * resizing. Unlike a one-shot window.innerWidth read, this keeps working
 * when a foldable crosses the breakpoint while the app is open.
 */
export function useWideScreen(breakpoint = 769): boolean {
  const [wide, setWide] = useState<boolean>(
    () => typeof window === 'undefined' || window.innerWidth >= breakpoint,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const onChange = () => setWide(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return wide;
}
