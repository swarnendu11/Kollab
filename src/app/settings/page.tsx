"use client";

import React, { Suspense } from "react";
import { SettingsView } from "@/components/settings/SettingsView";
import { AppShell } from "@/components/layout/AppShell";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-64 flex items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        </AppShell>
      }
    >
      <SettingsView />
    </Suspense>
  );
}
