import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export type ErrorBoundaryFallbackProps = {
  error: Error;
  reset: () => void;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
};

type ErrorBoundaryState = { error: Error | null };

function arrayIsDifferent(a: unknown[] = [], b: unknown[] = []) {
  if (a.length !== b.length) return true;
  return a.some((value, index) => !Object.is(value, b[index]));
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error && arrayIsDifferent(this.props.resetKeys, prevProps.resetKeys)) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (typeof fallback === "function") {
        return fallback({ error, reset: this.resetErrorBoundary });
      }

      if (fallback) return fallback;

      return null;
    }

    return children;
  }
}

function DefaultGameErrorFallback({ reset }: ErrorBoundaryFallbackProps) {
  const navigate = useNavigate();
  const handleBack = () => navigate("/", { replace: false });

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl border bg-card p-6 text-card-foreground shadow">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
          Something went wrong
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t load this part of the experience. Try again or head back to the game hub.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="ghost" onClick={handleBack}>
            Back to hub
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SharedGameBoundary({ children, resetKeys }: { children: ReactNode; resetKeys?: unknown[] }) {
  const location = useLocation();
  return (
    <ErrorBoundary resetKeys={resetKeys ?? [location.pathname]} fallback={(props) => <DefaultGameErrorFallback {...props} />}>
      {children}
    </ErrorBoundary>
  );
}
