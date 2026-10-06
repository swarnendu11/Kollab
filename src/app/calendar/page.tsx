"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Play,
  Check,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "agenda">("agenda");

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("45");
  const [description, setDescription] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchJsonWithTimeout<{ events: any[] }>("/api/calendar");
      setEvents(d.events || []);
    } catch (err: any) {
      console.error("[Calendar] Load events error:", err);
      setError(err?.message || "Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const d = await fetchJsonWithTimeout<{ contacts: any[] }>("/api/contacts");
      if (d.contacts) setContacts(d.contacts);
    } catch {
      // Don't fail calendar page if contacts cannot be loaded
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadContacts();
  }, [loadEvents, loadContacts]);

  // Modal Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isScheduleOpen) {
        setIsScheduleOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isScheduleOpen]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000);

      // Create meeting first
      const invitedContact = contacts.find((c) => c.id === selectedContactId);
      const meetingDesc = invitedContact
        ? `${description ? description + "\n" : ""}Attendee: ${invitedContact.contactName} (${invitedContact.contactEmail})`
        : description;

      const meetData = await fetchJsonWithTimeout<{ meeting: any }>("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: meetingDesc,
          scheduledStart: startTime,
          scheduledEnd: endTime,
        }),
      });

      // Create calendar event
      const calData = await fetchJsonWithTimeout<{ event: any }>("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: meetingDesc,
          startTime,
          endTime,
          meetingId: meetData.meeting?.id,
        }),
      });

      if (calData.event) {
        setEvents((prev) => [...prev, { ...calData.event, meetingJoinCode: meetData.meeting?.joinCode }]);
      }

      // Notify attendee in direct chat
      if (invitedContact?.contactUserId) {
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isDirect: true,
            recipientId: invitedContact.contactUserId,
            name: invitedContact.contactName,
          }),
        })
          .then((r) => r.json())
          .then((cd) => {
            if (cd.channel?.id) {
              fetch(`/api/chat/${cd.channel.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: `📅 Scheduled meeting "${title.trim()}" for ${new Date(startTime).toLocaleString()}. Join Code: ${meetData.meeting?.joinCode}`,
                }),
              });
            }
          })
          .catch(() => {});
      }

      setIsScheduleOpen(false);
      setTitle("");
      setDescription("");
      setSelectedContactId("");
    } catch (e: any) {
      console.error("[Calendar] Schedule error:", e);
      setSubmitError(e?.message || "Failed to schedule meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter events based on viewMode
  const now = new Date();
  const filteredEvents = events.filter((ev) => {
    if (!ev.startTime) return true;
    const evDate = new Date(ev.startTime);
    if (viewMode === "day") {
      return evDate.toDateString() === now.toDateString();
    } else if (viewMode === "week") {
      const diffDays = Math.abs((evDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } else if (viewMode === "month") {
      return evDate.getMonth() === now.getMonth() && evDate.getFullYear() === now.getFullYear();
    }
    return true; // "agenda" shows all
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Calendar & Schedule
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Organize your video meetings, team syncs, and client calls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setSubmitError(null);
                setIsScheduleOpen(true);
              }}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </Button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            {(["agenda", "day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  viewMode === mode
                    ? "bg-[#10B981]/10 text-[#059669]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {mode} View
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>
              {new Date().toLocaleDateString([], { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Events View: Loading | Error | Success */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load schedule"
            message={error}
            onRetry={loadEvents}
          />
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No scheduled events</h3>
            <p className="text-xs text-slate-500 mt-1">
              {viewMode !== "agenda" ? `No events scheduled for this ${viewMode}.` : "Click Schedule Meeting above to create your first event."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-[#10B981] group-hover:text-white transition-colors">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#059669] transition-colors">
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ev.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {ev.startTime
                            ? new Date(ev.startTime).toLocaleDateString([], {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Scheduled"}
                        </span>
                      </span>
                      {ev.meetingJoinCode && (
                        <span className="text-[11px] bg-slate-100 font-mono px-2 py-0.5 rounded text-slate-600">
                          Code: {ev.meetingJoinCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center">
                  <Link href={`/meeting/${ev.meetingId || "meet_product_sync"}/prejoin`}>
                    <Button className="h-9 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold gap-1.5 shadow-sm shadow-emerald-500/20">
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

      {/* Schedule Modal */}
      {isScheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScheduleOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Schedule New Meeting</h3>
              </div>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Title
                </label>
                <Input
                  placeholder="e.g. Weekly Product Design Sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invite Colleague / Contact (optional)
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-emerald-500"
                >
                  <option value="">No specific contact (Open meeting)</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contactName} ({c.contactEmail})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-emerald-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Agenda (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide context or key goals for this meeting..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !title.trim()}
                className="w-full h-11 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs gap-1.5 shadow-sm shadow-emerald-500/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Create & Schedule Meeting</span>
              </Button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
