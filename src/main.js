import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from "./App.js";
import { router } from './app/router.jsx';
import { syncPageMeta } from './lib/pageMeta.js';
// Per-page titles/descriptions (+ opt-in analytics) on every navigation,
// plus scroll restoration (React Router has none by default — without this a
// tap on "Report an incident" from a scrolled page lands mid-form).
router.subscribe((state) => {
    syncPageMeta(state.location.pathname);
    window.scrollTo(0, 0);
});
syncPageMeta(window.location.pathname);
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
