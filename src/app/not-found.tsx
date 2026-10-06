import React from "react";
import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4FAF6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <Search className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            404 Not Found
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight pt-1">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The workspace item, meeting, document, or route you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              className="w-full h-10 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
