import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#fbfaf8] px-6">
          <div className="max-w-md text-center luxury-card p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-black/[0.06] bg-[#fbf2e1]">
              <AlertTriangle className="h-8 w-8 text-[#2563eb]" />
            </div>
            <h1 className="font-playfair text-3xl text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 mb-8">An unexpected error occurred. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="gold-button px-8 py-3 text-sm uppercase tracking-[0.18em]"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
