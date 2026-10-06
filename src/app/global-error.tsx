"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-[#F4FAF6] flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
          <p className="text-xs text-slate-500">
            {error?.message || "A critical error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="h-10 px-6 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold cursor-pointer"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
