import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-extrabold text-slate-200">404</p>
      <h1 className="mt-2 text-xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
      >
        Back to home
      </Link>
    </div>
  );
}
