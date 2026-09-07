import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@hamd/ui/primitives";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Failed lazy route chunks must not leave the Suspense skeleton forever.
 */
export class RouteChunkErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[RouteChunkErrorBoundary]", error, info.componentStack);
    }
  }

  override render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="We couldn't load this page"
          description="Refresh and try again. If this continues, contact almahbubinternational@gmail.com."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
