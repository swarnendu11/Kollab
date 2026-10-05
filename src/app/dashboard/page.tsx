"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Plus,
  Calendar,
  MessageSquare,
  FileText,
  Paintbrush,
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  CheckCircle2,
  Film,
  HardDrive,
  Send,
  Loader2,
  Play,
  KeyRound,
  Sliders,
  QrCode,
  Share2,
} from "lucide-react";
import { HardwareTestModal } from "@/components/ui/hardware-test-modal";
import { ShareQrModal } from "@/components/ui/share-qr-modal";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isStartingInstant, setIsStartingInstant] = useState(false);

  // Live Activity state
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // New Features: Hardware Diagnostic & QR Share modals
  const [hardwareModalOpen, setHardwareModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedMeetingForShare, setSelectedMeetingForShare] = useState<any>(null);

  // Ask Kollab AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});

    fetch("/api/meetings?status=scheduled")
      .then((r) => r.json())
      .then((d) => {
        if (d.meetings) setUpcomingMeetings(d.meetings);
        setLoadingMeetings(false);
      })
      .catch(() => setLoadingMeetings(false));

    // Initial and periodic Activity poll (every 4 seconds)
    const fetchActivity = () => {
      fetch("/api/activity")
        .then((r) => r.json())
        .then((d) => {
          if (d.activities) setActivities(d.activities);
          setLoadingActivities(false);
        })
        .catch(() => setLoadingActivities(false));
    };
    fetchActivity();
    const activityTimer = setInterval(fetchActivity, 4000);

    return () => {
      clearInterval(activityTimer);
    };
  }, []);

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return "just now";
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diffSeconds < 10) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const startInstantMeeting = async () => {
    setIsStartingInstant(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Instant Meeting - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          isInstant: true,
        }),
      });
      const data = await res.json();
      if (data.meeting?.id) {
        router.push(`/meeting/${data.meeting.id}/prejoin`);
      }
    } catch (e) {
      console.error(e);
      setIsStartingInstant(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    router.push(`/meeting/${joinCodeInput.trim()}/prejoin`);
  };

  const handleAskAI = async (promptToSend?: string) => {
    const queryText = promptToSend || aiPrompt;
    if (!queryText.trim()) return;

    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: queryText, mode: "query" }),
      });
      const data = await res.json();
      setAiResponse(data.response || "No response received.");
    } catch {
      setAiResponse("Failed to query Kollab AI. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here is what is happening across your meetings, teamwork, and AI notes today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hardware Diagnostic Button */}
            <Button
              variant="outline"
              onClick={() => setHardwareModalOpen(true)}
              className="h-10 px-3.5 rounded-xl border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Test Audio & Video</span>
            </Button>

            {/* Join with code quick form */}
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  placeholder="Enter meeting code"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="pl-9 h-10 w-44 sm:w-56 text-xs rounded-xl border-slate-200"
                />
              </div>
              <Button
                type="submit"
                disabled={!joinCodeInput.trim()}
                className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 shadow-sm shadow-indigo-500/20"
              >
                Join
              </Button>
            </form>
          </div>
        </div>


        {/* Quick Action Tiles - Vibrant 3-Color Palette */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Action 1: Start Meeting (Electric Indigo) */}
          <button
            onClick={startInstantMeeting}
            disabled={isStartingInstant}
            className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-indigo-400 hover:-translate-y-0.5 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              {isStartingInstant ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Video className="w-6 h-6" />
              )}
            </div>
            <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Start Meeting
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Instant room</span>
          </button>

          {/* Action 2: Schedule Meeting (Fresh Electric Emerald) */}
          <Link
            href="/calendar"
            className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-emerald-400 hover:-translate-y-0.5 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Schedule Meeting
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Calendar & invites</span>
          </Link>

          {/* Action 3: New Chat (Warm Sunset Coral) */}
          <Link
            href="/chat"
            className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-rose-400 hover:-translate-y-0.5 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F43F5E] to-[#E11D48] text-white flex items-center justify-center mb-3 shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
              Team Chat
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Channels & DMs</span>
          </Link>

          {/* Action 4: New Document (Warm Amber) */}
          <Link
            href="/documents"
            className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-amber-400 hover:-translate-y-0.5 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              New Document
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Notes & specs</span>
          </Link>

          {/* Action 5: New Whiteboard (Royal Violet) */}
          <Link
            href="/whiteboards"
            className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-purple-400 hover:-translate-y-0.5 transition-all text-center group col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Paintbrush className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Whiteboard
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Live canvas</span>
          </Link>
        </div>

        {/* Ask Kollab AI Section in luxurious dark forest green */}
        <div id="ai-assistant" className="rounded-3xl bg-gradient-to-br from-[#051C13] via-[#08291E] to-[#04160F] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-900/60">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-[#34D399] animate-pulse" />
              <span>Kollab Autonomous AI Assistant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Ask Kollab Anything
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-2xl">
              Query meetings, summarize unread conversations, prepare for your next sync, or extract action items with full workspace authorization.
            </p>

            {/* Prompt input */}
            <div className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. Prepare me for my next meeting, or what did I miss yesterday?"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAskAI();
                  }}
                  className="w-full h-12 rounded-2xl bg-white/10 backdrop-blur border border-emerald-500/30 px-4 text-sm text-white placeholder:text-emerald-200/50 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
                />
              </div>
              <Button
                onClick={() => handleAskAI()}
                disabled={aiLoading || !aiPrompt.trim()}
                className="h-12 px-5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-bold gap-1.5 shrink-0 shadow-lg shadow-emerald-500/30"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Ask AI</span>
              </Button>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="mt-3.5 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => {
                  setAiPrompt("What meetings do I have today?");
                  handleAskAI("What meetings do I have today?");
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-emerald-400/20 transition-colors text-emerald-100 font-medium"
              >
                📅 What meetings do I have today?
              </button>
              <button
                onClick={() => {
                  setAiPrompt("Prepare me for my next meeting.");
                  handleAskAI("Prepare me for my next meeting.");
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-emerald-400/20 transition-colors text-emerald-100 font-medium"
              >
                📋 Prepare me for my next meeting
              </button>
              <button
                onClick={() => {
                  setAiPrompt("What are my open action items?");
                  handleAskAI("What are my open action items?");
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-emerald-400/20 transition-colors text-emerald-100 font-medium"
              >
                ✅ What are my open action items?
              </button>
              <button
                onClick={() => {
                  setAiPrompt("Summarize my unread messages.");
                  handleAskAI("Summarize my unread messages.");
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-emerald-400/20 transition-colors text-emerald-100 font-medium"
              >
                💬 Summarize my unread messages
              </button>
            </div>

            {/* Live AI Response Display */}
            {aiResponse && (
              <div className="mt-6 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-emerald-400/30 text-emerald-50 text-sm whitespace-pre-wrap leading-relaxed animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 font-bold text-xs text-[#34D399] uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kollab AI Intelligence Analysis:</span>
                </div>
                {aiResponse}
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout: Upcoming Meetings & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Meetings (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-emerald-950">Upcoming Meetings</h3>
                <span className="text-xs bg-emerald-100 font-bold px-2.5 py-0.5 rounded-full text-[#047857]">
                  {upcomingMeetings.length}
                </span>
              </div>
              <Link href="/meetings" className="text-xs font-bold text-[#059669] hover:underline flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingMeetings ? (
              <div className="h-40 bg-white rounded-3xl border border-emerald-100 flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-emerald-100">
                <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No scheduled meetings today</p>
                <p className="text-xs text-slate-400 mt-1">Start an instant meeting or schedule one on your calendar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-3xl bg-white border border-emerald-100/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0 font-bold group-hover:bg-[#10B981] group-hover:text-white transition-colors shadow-2xs">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-[#047857] transition-colors">
                            {m.title}
                          </h4>
                          <span className="text-[10px] bg-emerald-50 text-[#047857] border border-emerald-200 px-2 py-0.5 rounded-md font-mono font-semibold">
                            {m.joinCode}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {m.scheduledStart ? new Date(m.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today"}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Host: {m.hostName || user?.fullName || "Workspace Host"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedMeetingForShare(m);
                          setShareModalOpen(true);
                        }}
                        className="h-10 px-3.5 rounded-xl border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 text-xs font-semibold gap-1.5 shadow-2xs shrink-0"
                        title="Share Meeting & QR Code"
                      >
                        <QrCode className="w-4 h-4 text-indigo-600" />
                        <span className="hidden sm:inline">QR Code</span>
                      </Button>

                      <Link href={`/meeting/${m.id}/prejoin`} className="inline-flex shrink-0">
                        <Button className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm shadow-indigo-500/20">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Join Meeting</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity (1 Col) - Live Dynamic Data from API */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-emerald-950">Live Workspace Activity</h3>
                <span className="text-[10px] bg-emerald-100 text-[#047857] px-2 py-0.5 rounded-full font-bold">
                  {activities.length} updates
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-synced</span>
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-emerald-100 p-5 divide-y divide-emerald-50 shadow-xs">
              {loadingActivities ? (
                <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span>Streaming live workspace events...</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No activity recorded yet
                </div>
              ) : (
                activities.map((act) => {
                  const getIcon = () => {
                    switch (act.type) {
                      case "meeting":
                        return <Video className="w-4 h-4" />;
                      case "message":
                        return <MessageSquare className="w-4 h-4" />;
                      case "document":
                        return <FileText className="w-4 h-4" />;
                      case "recording":
                        return <Film className="w-4 h-4" />;
                      default:
                        return <CheckCircle2 className="w-4 h-4" />;
                    }
                  };

                  const getIconColors = () => {
                    switch (act.type) {
                      case "meeting":
                        return "bg-indigo-50 text-indigo-600";
                      case "message":
                        return "bg-rose-50 text-rose-600";
                      case "document":
                        return "bg-amber-50 text-amber-600";
                      case "recording":
                        return "bg-emerald-50 text-emerald-600";
                      default:
                        return "bg-slate-50 text-slate-600";
                    }
                  };

                  return (
                    <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 group">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${getIconColors()}`}>
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <Link
                            href={act.link}
                            className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate"
                          >
                            {act.title}
                          </Link>
                          {act.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                              {act.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-700">{act.author}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">{formatRelativeTime(act.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Diagnostic & QR Share Modals */}
      <HardwareTestModal
        isOpen={hardwareModalOpen}
        onClose={() => setHardwareModalOpen(false)}
      />

      {selectedMeetingForShare && (
        <ShareQrModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedMeetingForShare(null);
          }}
          meetingId={selectedMeetingForShare.id}
          meetingTitle={selectedMeetingForShare.title}
          joinCode={selectedMeetingForShare.joinCode}
        />
      )}
    </AppShell>
  );
}
