/* Privacy-first analytics hook.
 *
 * No tracking happens unless VITE_ANALYTICS_ID is set at build time
 * (see .env.example). There is deliberately no bundled provider and no
 * invented tracking ID — wire your provider here when you have one.
 */
const ANALYTICS_ID = (import.meta.env.VITE_ANALYTICS_ID ?? '').trim();

/** True only when an analytics ID has been configured for this build. */
export function isAnalyticsEnabled() {
  return ANALYTICS_ID.length > 0;
}

/**
 * Record a page view. Safe to call unconditionally — it is a documented
 * no-op until VITE_ANALYTICS_ID is set AND a provider is wired below.
 */
export function trackPageView(path) {
  if (!isAnalyticsEnabled()) return;
  void path; // consumed by the provider once one is wired below.
  // TODO: send `path` to your analytics provider here (e.g. navigator.sendBeacon).
}

/** Record a custom event. Same no-op-until-configured contract as above. */
export function trackEvent(name, data) {
  if (!isAnalyticsEnabled()) return;
  void name;
  void data;
  // TODO: send the event to your analytics provider here.
}
