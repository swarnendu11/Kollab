"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Plus,
  Clock,
  Users,
  Copy,
  Check,
  Play,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((d) => {
        if (d.meetings) setMeetings(d.meetings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Meetings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Start an instant room, join with code, or view your schedule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/calendar">
              <Button variant="outline" className="rounded-xl h-10 px-4 text-xs font-semibold gap-2 border-emerald-200/60 hover:bg-emerald-50/50">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Schedule Meeting</span>
              </Button>
            </Link>

            <Link href="/meeting/new">
              <Button className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20">
                <Video className="w-4 h-4" />
                <span>Instant Meeting</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Link
            href="/meetings"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981]/10 text-[#059669]"
          >
            All Meetings ({meetings.length})
          </Link>
          <Link
            href="/meetings/upcoming"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Upcoming
          </Link>
          <Link
            href="/meetings/history"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Past History
          </Link>
        </div>

        {/* Meeting List */}
        {loading ? (
          <div className="h-48 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No meetings found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You do not have any meetings scheduled. Click below to start an instant room.
            </p>
            <div className="mt-4">
              <Link href="/meeting/new">
                <Button className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold rounded-xl shadow-sm shadow-emerald-500/20">
                  Start Instant Meeting
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => {
              const isLive = m.status === "live";
              const isPast = m.status === "ended";

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant={isLive ? "success" : isPast ? "secondary" : "default"}
                        className="text-[10px] uppercase font-bold"
                      >
                        {isLive ? "● LIVE NOW" : isPast ? "ENDED" : "SCHEDULED"}
                      </Badge>
                      <button
                        onClick={() => copyCode(m.joinCode)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono"
                        title="Copy Join Code"
                      >
                        {copiedId === m.joinCode ? (
                          <>
                            <Check className="w-3 h-3 text-[#10B981]" />
                            <span className="text-[#10B981]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{m.joinCode}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#059669] transition-colors">
                      {m.title}
                    </h3>
                    {m.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {m.description}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {m.scheduledStart
                            ? new Date(m.scheduledStart).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Instant Meeting"}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Host: {m.hostName || "Host"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isPast ? (
                      <Link href={`/meeting/${m.id}/summary`} className="w-full">
                        <Button
                          variant="outline"
                          className="w-full text-xs font-semibold rounded-xl h-9 text-[#059669] border-emerald-200 hover:bg-emerald-50 gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span>View AI Summary & Notes</span>
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/meeting/${m.id}/prejoin`} className="w-full">
                        <Button className="w-full text-xs font-semibold rounded-xl h-9 bg-[#10B981] hover:bg-[#059669] text-white gap-1.5 shadow-sm shadow-emerald-500/20">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Join Prejoin Room</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
