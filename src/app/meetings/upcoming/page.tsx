"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Video, Clock, Users, Play, Calendar, Loader2 } from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function UpcomingMeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUpcoming = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ meetings: any[] }>("/api/meetings?status=scheduled");
      setMeetings(data.meetings || []);
    } catch (err: any) {
      console.error("[UpcomingMeetings] Load error:", err);
      setError(err?.message || "Failed to load scheduled meetings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Upcoming Meetings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Your future scheduled syncs and company calls.
            </p>
          </div>
          <Link href="/calendar">
            <Button className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20">
              <Calendar className="w-4 h-4" />
              <span>Schedule New</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Link
            href="/meetings"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            All Meetings
          </Link>
          <Link
            href="/meetings/upcoming"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981]/10 text-[#059669]"
          >
            Upcoming ({meetings.length})
          </Link>
          <Link
            href="/meetings/history"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Past History
          </Link>
        </div>

        {/* States */}
        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load upcoming meetings"
            message={error}
            onRetry={loadUpcoming}
          />
        ) : meetings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No upcoming meetings</h3>
            <p className="text-xs text-slate-500 mt-1">Schedule a meeting on your calendar to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <Badge variant="default" className="text-[10px] uppercase font-bold mb-2">
                    SCHEDULED
                  </Badge>
                  <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.scheduledStart ? new Date(m.scheduledStart).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Scheduled"}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.hostName || "Host"}</span>
                    </span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link href={`/meeting/${m.id}/prejoin`}>
                    <Button className="w-full text-xs font-semibold rounded-xl h-9 bg-[#10B981] hover:bg-[#059669] text-white gap-1.5 shadow-sm shadow-emerald-500/20">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Join Room</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
