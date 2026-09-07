import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@hamd/ui/primitives";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Global error boundary for the public website shell. */
export class GlobalErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[GlobalErrorBoundary]", error, info.componentStack);
    }
  }

  override render() {
    if (this.state.error) {
      return (
        <main id="main-content" className="hamd-web-error-boundary">
          <ErrorState
            title="Something went wrong"
            description="The page failed to render. Return home and try again. If this continues, contact almahbubinternational@gmail.com."
            actionHref="/"
            actionLabel="Return to homepage"
          />
        </main>
      );
    }
    return this.props.children;
  }
}
