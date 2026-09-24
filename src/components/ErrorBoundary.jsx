import { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui';

/**
 * Last-resort crash guard: a single runtime error must never blank the whole
 * app (critical for an emergency tool). Shows a branded fallback with recovery
 * actions instead of a white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught UI error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-5xl font-extrabold text-slate-200">!</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Something went wrong</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            The app hit an unexpected error. Your reports are safe — reloading
            usually fixes it. In an emergency, call{' '}
            <a href="tel:112" className="font-bold text-red-700 underline">112</a> first.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button size="lg" className="w-full" onClick={() => window.location.reload()}>
              Reload the app
            </Button>
            <Link to="/">
              <Button variant="secondary" size="lg" className="w-full">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
