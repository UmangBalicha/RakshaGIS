import { Link } from 'react-router-dom';
import { MapPin, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center sm:py-16">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
        <ShieldAlert className="h-9 w-9" />
      </span>
      <p className="mt-4 text-5xl font-extrabold text-slate-200 tabular-nums">404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist or may have been moved. Active
        incident maps and reporting are one tap away.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Link
          to="/"
          className="inline-flex min-h-[56px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 text-base font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-[0.98]"
        >
          Back to home →
        </Link>
        <Link
          to="/report"
          className="inline-flex min-h-[56px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
        >
          <MapPin className="h-5 w-5" /> Report an incident
        </Link>
      </div>
      <p className="mt-5 text-sm text-slate-500">
        In an emergency, call <a href="tel:112" className="font-bold text-red-700 underline">112</a> first.
      </p>
    </div>
  );
}
