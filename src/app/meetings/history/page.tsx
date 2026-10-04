"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Users, Sparkles, Loader2 } from "lucide-react";

export default function MeetingHistoryPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meetings?status=ended")
      .then((r) => r.json())
      .then((d) => {
        if (d.meetings) setMeetings(d.meetings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Meeting History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse completed meetings, recordings, AI summaries, and action items.
          </p>
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
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Upcoming
          </Link>
          <Link
            href="/meetings/history"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981]/10 text-[#059669]"
          >
            Past History ({meetings.length})
          </Link>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No past meetings</h3>
            <p className="text-xs text-slate-500 mt-1">Completed meeting sessions and transcripts will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold mb-2">
                    ENDED
                  </Badge>
                  <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link href={`/meeting/${m.id}/summary`}>
                    <Button
                      variant="outline"
                      className="w-full text-xs font-semibold rounded-xl h-9 text-[#059669] border-emerald-200 hover:bg-emerald-50 gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>View AI Summary & Notes</span>
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
