import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh] relative">
          {/* Cyber-grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,127,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,127,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          <div className="relative text-center">
            {/* Error icon */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-[#ff6b6b] rounded-xl opacity-20 blur-md animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f] to-[#ff6b6b] rounded-xl opacity-40 flex items-center justify-center">
                <span className="text-2xl font-bold text-white font-mono">⚠</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-white mb-2 font-mono">
              {this.props.fallbackTitle || 'Data Retrieval Error'}
            </h2>
            <p className="text-sm text-white/70 font-mono mb-2 max-w-sm">
              {this.props.fallbackMessage || 'An error occurred while loading data. This may be due to a database issue.'}
            </p>

            {/* Error details */}
            {this.state.error && (
              <div className="mt-4 p-3 rounded-lg bg-[#ff007f]/5 border border-[#ff007f]/20 text-left max-w-sm">
                <p className="text-[10px] text-[#ff007f] font-mono mb-1 tracking-wider uppercase">Error Trace</p>
                <p className="text-[11px] text-[#8892a9] font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-5 py-2.5 rounded-xl text-sm font-mono font-medium bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/25 hover:bg-[#00f2fe]/20 transition-all"
              >
                ◈ Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl text-sm font-mono font-medium bg-[#0d1222] text-[#8892a9] border border-[#1e2840] hover:text-white hover:border-[#2a3654] transition-all"
              >
                ↻ Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
