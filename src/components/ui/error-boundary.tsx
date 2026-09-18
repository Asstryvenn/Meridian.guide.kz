"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function DefaultFallback({ onReset }: { onReset: () => void }) {
  const t = useT();
  return (
    <div className="min-h-[320px] w-full flex flex-col items-center justify-center p-6 text-center text-ink">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#EBAE29]/40 flex items-center justify-center mb-4 text-amber-ink">
        <AlertTriangle size={24} />
      </div>
      <h2 className="text-lg font-bold mb-1">{t("Unable to load view")}</h2>
      <p className="text-xs text-ink/70 max-w-sm mb-5">
        {t("An unexpected error occurred while rendering this component.")}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-on-accent hover:brightness-110 transition-all cursor-pointer shadow-md"
      >
        <RotateCcw size={14} />
        <span>{t("Try again")}</span>
      </button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
