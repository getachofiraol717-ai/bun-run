import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative z-50 text-foreground">
          <div className="glass-strong border border-border/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-foreground">
                Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-poppins leading-relaxed">
                An unexpected error occurred while rendering this view. Your study data and session state remain safely saved.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-muted/40 rounded-xl text-left border border-border/60 text-xs font-mono text-muted-foreground overflow-x-auto max-h-32 select-all">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="default"
                onClick={this.handleReset}
                className="gap-2 font-orbitron font-semibold text-xs rounded-xl"
              >
                <RefreshCw className="h-4 w-4" />
                Reload View
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="gap-2 font-orbitron font-semibold text-xs rounded-xl"
              >
                <Home className="h-4 w-4" />
                Return to Galaxy Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
