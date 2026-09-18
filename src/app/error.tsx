"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {}, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-panel text-ink">
      <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-6 text-red-400 shadow-xl">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-center">
        Something went wrong
      </h1>
      <p className="text-sm text-ink/70 max-w-md text-center mb-8">
        An error interrupted page rendering. You can try refreshing the component or return to the main dashboard.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-br from-[#4e9377] via-[#5ea489] to-[#d4a342] text-white hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#4e9377]/20 border border-white/10 cursor-pointer transition-all"
        >
          <RotateCcw size={15} />
          <span>Try again</span>
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-panel border border-[#589C80]/30 text-ink hover:border-[#589C80] shadow-sm cursor-pointer transition-all"
        >
          <Home size={15} />
          <span>Return home</span>
        </Link>
      </div>
    </div>
  );
}
