import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** App-wide error boundary providing a friendly fallback instead of a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In later phases this is where we'd forward to a local error log.
    console.error('Unhandled error:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.assign('/');
  };

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-bg px-4 text-center">
          <div className="max-w-md">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-content-muted">
              The app hit an unexpected error. Your data is safe.
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-surface-2 p-3 text-left text-xs text-danger">
              {this.state.error.message}
            </pre>
            <button onClick={this.handleReset} className="btn-primary mt-5">
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
