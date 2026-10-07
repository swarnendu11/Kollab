"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Calendar,
  Clock,
  Users,
  UserPlus,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Shield,
  Loader2,
  X,
  Lock,
  Mail,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generateJoinCode } from "@/lib/utils";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (meeting: any) => void;
  defaultMode?: "instant" | "scheduled";
}

interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
}

export function CreateMeetingModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = "instant",
}: CreateMeetingModalProps) {
  const router = useRouter();

  const [mode, setMode] = useState<"instant" | "scheduled">(defaultMode);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Scheduling details
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(45);

  // Security & Room controls
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(true);

  // Member invitation
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [guestEmail, setGuestEmail] = useState("");
  const [guestEmailsList, setGuestEmailsList] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate code on open
  useEffect(() => {
    if (isOpen) {
      setJoinCode(generateJoinCode());
      setTitle(
        defaultMode === "instant"
          ? `Instant Meeting - ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "Team Strategy & Review Sync"
      );
      setMode(defaultMode);
      setSelectedUserIds(new Set());
      setGuestEmailsList([]);
      setErrorMessage(null);

      // Load workspace members
      setLoadingMembers(true);
      fetch("/api/teams")
        .then((r) => r.json())
        .then((d) => {
          if (d.members) {
            const list: TeamMember[] = d.members
              .filter((m: any) => m.userId)
              .map((m: any) => ({
                userId: m.userId,
                fullName: m.fullName || m.email,
                email: m.email,
                avatarUrl: m.avatarUrl,
                role: m.role || "member",
              }));
            setMembers(list);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingMembers(false));
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  const handleRegenerateCode = () => {
    setJoinCode(generateJoinCode());
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAddGuestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = guestEmail.trim().toLowerCase();
    if (clean && clean.includes("@") && !guestEmailsList.includes(clean)) {
      setGuestEmailsList((prev) => [...prev, clean]);
      setGuestEmail("");
    }
  };

  const removeGuestEmail = (email: string) => {
    setGuestEmailsList((prev) => prev.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a meeting title.");
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const isInstant = mode === "instant";
      let scheduledStart: Date | undefined;
      let scheduledEnd: Date | undefined;

      if (!isInstant) {
        scheduledStart = new Date(`${date}T${time}:00`);
        scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60000);
      }

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          customJoinCode: joinCode,
          isInstant,
          scheduledStart,
          scheduledEnd,
          waitingRoomEnabled: waitingRoom,
          recordingEnabled,
          invitedUserIds: Array.from(selectedUserIds),
          invitedEmails: guestEmailsList,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.meeting) {
        throw new Error(data.error || "Failed to create meeting.");
      }

      if (onSuccess) {
        onSuccess(data.meeting);
      }

      onClose();

      if (isInstant) {
        router.push(`/meeting/${data.meeting.id}/prejoin`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.email.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl text-slate-900 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create & Schedule Meeting</h2>
              <p className="text-xs text-slate-500">Generate meeting code & invite workspace members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode("instant")}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === "instant"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Instant Call</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("scheduled")}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === "scheduled"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule for Later</span>
            </button>
          </div>

          {/* Meeting Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Meeting Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Product Design Sync"
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          {/* GENERATE MEETING CODE SECTION */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Meeting Code
              </span>
              <Button
                type="button"
                onClick={handleRegenerateCode}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-indigo-700 hover:bg-indigo-100/60 font-semibold gap-1"
                title="Generate another code"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate Code</span>
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-indigo-200/80 shadow-2xs">
              <span className="text-lg font-mono font-extrabold text-indigo-700 tracking-wider">
                {joinCode}
              </span>
              <Button
                type="button"
                onClick={handleCopyCode}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 font-semibold rounded-lg"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <p className="text-[11px] text-indigo-900/70">
              Colleagues can join using this code or by clicking your invitation.
            </p>
          </div>

          {/* Scheduled Date & Time if scheduled mode */}
          {mode === "scheduled" && (
            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Start Time</label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full h-9 text-xs rounded-xl bg-white border border-slate-200 px-2 text-slate-800"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                </select>
              </div>
            </div>
          )}

          {/* ADD MEMBERS SECTION */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Add Members to Meeting ({selectedUserIds.size} selected)
              </span>
              {selectedUserIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedUserIds(new Set())}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Member search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search colleagues to add..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="h-8 pl-8 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            {/* Members checkboxes */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
              {loadingMembers ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Loading team...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No colleagues found</div>
              ) : (
                filteredMembers.map((m) => {
                  const isSelected = selectedUserIds.has(m.userId);
                  return (
                    <label
                      key={m.userId}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMemberSelection(m.userId)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={m.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700">
                            {m.fullName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-800 block truncate">
                            {m.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {m.email}
                          </span>
                        </div>
                      </div>
                      {m.role === "admin" && (
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          Admin
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {/* Add external guests by email */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-600">Invite External Guests</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    placeholder="partner@external-company.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGuestEmail(e);
                      }
                    }}
                    className="h-8 pl-8 text-xs rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddGuestEmail}
                  disabled={!guestEmail.trim()}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs rounded-xl"
                >
                  Add
                </Button>
              </div>

              {guestEmailsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {guestEmailsList.map((em) => (
                    <span
                      key={em}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]"
                    >
                      <span>{em}</span>
                      <button
                        type="button"
                        onClick={() => removeGuestEmail(em)}
                        className="text-slate-400 hover:text-rose-600 text-xs ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Security & Waiting Room Options */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={waitingRoom}
                onChange={(e) => setWaitingRoom(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300"
              />
              <span>Enable Waiting Room</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={recordingEnabled}
                onChange={(e) => setRecordingEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300"
              />
              <span>Allow Cloud Recording</span>
            </label>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="h-10 px-4 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className={`h-10 px-5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                mode === "instant"
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Processing...</span>
                </>
              ) : mode === "instant" ? (
                <>
                  <Video className="w-4 h-4 mr-1.5" />
                  <span>Start Instant Meeting</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-1.5" />
                  <span>Schedule Meeting</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
