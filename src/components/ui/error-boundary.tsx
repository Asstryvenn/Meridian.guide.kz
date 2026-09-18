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
  let title = "Unable to load view";
  let message = "An unexpected error occurred while rendering this component.";
  let buttonLabel = "Try again";
  try {
    const t = useT();
    if (typeof t === "function") {
      title = t("Unable to load view") || title;
      message = t("An unexpected error occurred while rendering this component.") || message;
      buttonLabel = t("Try again") || buttonLabel;
    }
  } catch {}

  return (
    <div className="min-h-[320px] w-full flex flex-col items-center justify-center p-6 text-center text-ink">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#EBAE29]/40 flex items-center justify-center mb-4 text-amber-ink">
        <AlertTriangle size={24} />
      </div>
      <h2 className="text-lg font-bold mb-1">{title}</h2>
      <p className="text-xs text-ink/70 max-w-sm mb-5">{message}</p>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-br from-[#4e9377] via-[#5ea489] to-[#d4a342] text-white hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#4e9377]/20 border border-white/10"
      >
        <RotateCcw size={14} />
        <span>{buttonLabel}</span>
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
