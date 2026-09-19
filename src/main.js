import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from "./App.js";
import { router } from './app/router.js';
import { syncPageMeta } from './lib/pageMeta.js';
// Per-page titles/descriptions (+ opt-in analytics) on every navigation.
router.subscribe((state) => syncPageMeta(state.location.pathname));
syncPageMeta(window.location.pathname);
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
