/* Per-page SEO metadata for the SPA.
 *
 * index.html carries the default title/description; syncPageMeta() overrides
 * them on every client-side navigation (wired in src/main.js via
 * router.subscribe). One integration point — no per-page boilerplate.
 */
import { trackPageView } from './analytics.js';

export const DEFAULT_TITLE = 'RakshaGIS — Disaster Reporting & Evacuation';
export const DEFAULT_DESCRIPTION =
  'Report earthquakes, floods, fires, cyclones, landslides and more. Live maps, safe zones and turn-by-turn evacuation routing.';

const EXACT = {
  '/': {
    title: 'RakshaGIS — Report Disasters & Find Evacuation Routes',
    description:
      'Live all-hazard incident map. Report earthquakes, floods, fires, cyclones and landslides, and navigate to the nearest safe zone.',
  },
  '/report': {
    title: 'Report an Incident — RakshaGIS',
    description:
      'File a geo-tagged disaster report in under a minute — any disaster, natural or man-made. Optional photos, anonymous reporting allowed.',
  },
  '/track': {
    title: 'Track Incident Reports — RakshaGIS',
    description:
      'Follow disaster response progress by report ID — see live status from pending to resolved, with evacuation routes for every incident.',
  },
  '/login': {
    title: 'Sign In — RakshaGIS',
    description: 'Sign in to RakshaGIS to track your incident reports and receive status updates.',
  },
  '/register': {
    title: 'Create an Account — RakshaGIS',
    description: 'Create a free RakshaGIS account to file reports faster and track their response status.',
  },
  '/login/phone': {
    title: 'Sign In with Phone OTP — RakshaGIS',
    description: 'Sign in to RakshaGIS with a one-time code sent to your mobile number.',
  },
  '/privacy': {
    title: 'Privacy Policy — RakshaGIS',
    description: 'How RakshaGIS handles your reports, location and account data — in demo mode and with Supabase.',
  },
  '/terms': {
    title: 'Terms & Conditions — RakshaGIS',
    description: 'Terms of use for the RakshaGIS disaster reporting platform.',
  },
  '/admin': {
    title: 'Authority Console — RakshaGIS',
    description: 'Authority triage console: live reports, safe zones, analytics and user management.',
  },
  '/admin/reports': {
    title: 'Manage Reports — RakshaGIS',
    description: 'Authority view of all disaster reports with triage controls and CSV export.',
  },
  '/admin/safe-zones': {
    title: 'Manage Safe Zones — RakshaGIS',
    description: 'Authority management of evacuation shelters, hospitals and relief camps.',
  },
  '/admin/analytics': {
    title: 'Analytics — RakshaGIS',
    description: 'Disaster trends, severity breakdowns and response snapshots for authorities.',
  },
  '/admin/users': {
    title: 'Manage Users — RakshaGIS',
    description: 'Authority user and role management.',
  },
  '/admin/settings': {
    title: 'Settings — RakshaGIS',
    description: 'Authority console settings and triage guidance.',
  },
};

function dynamic(pathname) {
  if (pathname.startsWith('/report/success/')) {
    return {
      title: 'Report Received — RakshaGIS',
      description: 'Your disaster report was received. Track its response status live.',
    };
  }
  if (pathname.startsWith('/evacuate/')) {
    return {
      title: 'Evacuate to Safety — RakshaGIS',
      description:
        'Live road routing to the nearest safe zone with turn-by-turn directions and 3D navigation.',
    };
  }
  if (pathname.startsWith('/track/')) {
    return {
      title: 'Track Incident Report — RakshaGIS',
      description: 'Live response progress for this disaster report, with evacuation routes.',
    };
  }
  return null;
}

/** Resolve { title, description } for a pathname (exact match, then dynamic). */
export function metaForPath(pathname) {
  return EXACT[pathname] ?? dynamic(pathname) ?? { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
}

/** Apply metadata for the current route + record an (opt-in) page view. */
export function syncPageMeta(pathname) {
  const meta = metaForPath(pathname);
  document.title = meta.title;
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', meta.description);
  trackPageView(pathname);
}
