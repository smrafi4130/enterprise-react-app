import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/shared/lib/observability";

/** Last line of defence for render errors. Route-level boundaries keep a broken page from taking down the shell. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack ?? "" });
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="error-state">
        <h2>This page crashed</h2>
        <p>Try reloading. If it keeps happening, contact support.</p>
        <button type="button" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}
