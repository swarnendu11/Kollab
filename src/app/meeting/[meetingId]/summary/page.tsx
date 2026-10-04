"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  CheckCircle2,
  ListTodo,
  Clock,
  Film,
  FileText,
  Copy,
  Check,
  Search,
  ArrowRight,
  Share2,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";

export default function MeetingSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.meetingId as string;

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<any>({
    title: "Weekly Product Design Sync",
    joinCode: meetingId,
  });
  const [summaryData, setSummaryData] = useState<any>(null);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [transcriptSegments, setTranscriptSegments] = useState<any[]>([]);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  useEffect(() => {
    // Fetch meeting details & summary
    Promise.all([
      fetch(`/api/meetings/${meetingId}`).then((r) => r.json()),
      fetch(`/api/meetings/${meetingId}/summary`).then((r) => r.json()),
    ])
      .then(([meetingRes, summaryRes]) => {
        if (meetingRes.meeting) setMeeting(meetingRes.meeting);
        if (summaryRes.summary) setSummaryData(summaryRes.summary);
        if (summaryRes.actionItems) setActionItems(summaryRes.actionItems);
        if (summaryRes.segments) setTranscriptSegments(summaryRes.segments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [meetingId]);

  const copyFullTranscript = () => {
    const text = transcriptSegments
      .map((s) => `${s.speakerName}: ${s.text}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const filteredSegments = transcriptSearch.trim() === ""
    ? transcriptSegments
    : transcriptSegments.filter(
        (s) =>
          s.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
          s.speakerName.toLowerCase().includes(transcriptSearch.toLowerCase())
      );

  if (loading) {
    return (
      <AppShell>
        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
          <p className="text-sm font-semibold">Generating autonomous AI meeting intelligence...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-500/30 text-emerald-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Meeting Intelligence Generated</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {meeting.title} — Summary & Notes
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Conducted on {new Date().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })} • Room: {meeting.joinCode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/recordings">
              <Button variant="outline" className="h-10 rounded-xl text-xs font-semibold gap-1.5 border-emerald-200/60 hover:bg-emerald-50/50">
                <Film className="w-4 h-4 text-emerald-600" />
                <span>View Recording</span>
              </Button>
            </Link>

            <Link href="/documents">
              <Button className="h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold gap-1.5 shadow-sm shadow-emerald-500/20">
                <FileText className="w-4 h-4" />
                <span>Export to Doc</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Section 1: Executive Summary Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Executive Summary</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            {summaryData?.summaryText ||
              "The team successfully synchronized on deliverables and verified WebRTC audio/video quality benchmarks. Noise cancellation standard mode was standardized, and the release target was confirmed."}
          </p>

          {/* Key Decisions */}
          {summaryData?.keyDecisions && summaryData.keyDecisions.length > 0 && (
            <div className="mt-6 pt-5 border-t border-emerald-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Key Decisions Made:
              </h4>
              <div className="space-y-2">
                {summaryData.keyDecisions.map((decision: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span className="font-medium">{decision}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Action Items Tracker */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Assigned Action Items</h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                {actionItems.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {actionItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No open action items recorded.
              </div>
            ) : (
              actionItems.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-md border-2 border-slate-300 mt-0.5 cursor-pointer hover:border-emerald-500 flex items-center justify-center">
                      {item.status === "done" && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${item.status === "done" ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {item.task}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Owner: <strong className="text-slate-700">{item.ownerName}</strong></span>
                        <span>•</span>
                        <span>Due: {item.dueDate || "Next sync"}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={item.status === "done" ? "success" : "secondary"}
                    className="text-[10px] uppercase font-bold self-start sm:self-center"
                  >
                    {item.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Searchable Timestamped Transcript */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Timestamped Transcript</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                {transcriptSegments.length} segments
              </span>
            </h3>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search transcript..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="pl-8 pr-3 h-8 text-xs rounded-xl bg-white border border-slate-200 outline-none w-48 focus:border-emerald-500"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={copyFullTranscript}
                className="h-8 rounded-xl text-xs gap-1"
              >
                {copiedTranscript ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTranscript ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {filteredSegments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                {transcriptSegments.length === 0
                  ? "Transcript recorded during call will appear here."
                  : "No matching transcript lines found."}
              </div>
            ) : (
              filteredSegments.map((s, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start gap-4">
                  <span className="text-[11px] font-mono text-slate-400 mt-0.5 shrink-0 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    00:{s.startTimeSeconds.toString().padStart(2, "0")}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 mb-0.5">{s.speakerName}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick action button to return to dashboard */}
        <div className="pt-4 flex justify-end">
          <Link href="/dashboard">
            <Button className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-xl text-xs gap-1.5 shadow-sm shadow-emerald-500/20">
              <span>Return to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
