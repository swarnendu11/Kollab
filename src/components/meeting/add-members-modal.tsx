"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Share2,
  Sparkles,
  Link as LinkIcon,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MemberItem {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  status?: string;
}

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  joinCode: string;
  meetingTitle?: string;
  isHost?: boolean;
  onCodeRegenerated?: (newCode: string) => void;
  activeParticipantUserIds?: (string | null | undefined)[];
}

export function AddMembersModal({
  isOpen,
  onClose,
  meetingId,
  joinCode,
  meetingTitle = "Meeting",
  isHost = true,
  onCodeRegenerated,
  activeParticipantUserIds = [],
}: AddMembersModalProps) {
  const [currentCode, setCurrentCode] = useState(joinCode);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [codeSuccessMsg, setCodeSuccessMsg] = useState<string | null>(null);

  // Members list & selection
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [invitedEmails, setInvitedEmails] = useState<Set<string>>(new Set());
  const [invitingMembers, setInvitingMembers] = useState(false);

  // Manual guest email invite
  const [guestEmail, setGuestEmail] = useState("");
  const [guestInviteError, setGuestInviteError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setCurrentCode(joinCode);
  }, [joinCode]);

  // Load team members and contacts when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoadingMembers(true);
    setStatusMessage(null);

    Promise.allSettled([
      fetch("/api/teams").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
      fetch(`/api/meetings/${meetingId}/invites`).then((r) => r.json()),
    ]).then(([teamsRes, contactsRes, invitesRes]) => {
      if (!mounted) return;

      const combinedMap = new Map<string, MemberItem>();

      // 1. Team members
      if (teamsRes.status === "fulfilled" && teamsRes.value.members) {
        for (const m of teamsRes.value.members) {
          if (m.userId) {
            combinedMap.set(m.userId, {
              id: m.id,
              userId: m.userId,
              fullName: m.fullName || m.email,
              email: m.email,
              avatarUrl: m.avatarUrl,
              role: m.role || "member",
              status: m.status || "active",
            });
          }
        }
      }

      // 2. Contacts
      if (contactsRes.status === "fulfilled" && contactsRes.value.contacts) {
        for (const c of contactsRes.value.contacts) {
          const key = c.contactUserId || `contact_${c.id}`;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, {
              id: c.id,
              userId: c.contactUserId,
              fullName: c.contactName,
              email: c.contactEmail,
              avatarUrl: c.contactAvatar,
              role: "contact",
              status: c.status || "active",
            });
          }
        }
      }

      setMembers(Array.from(combinedMap.values()));

      // 3. Mark existing invites
      if (invitesRes.status === "fulfilled" && invitesRes.value.invites) {
        const invited = new Set<string>();
        for (const inv of invitesRes.value.invites) {
          if (inv.email) invited.add(inv.email.toLowerCase());
        }
        setInvitedEmails(invited);
      }

      setLoadingMembers(false);
    });

    return () => {
      mounted = false;
    };
  }, [isOpen, meetingId]);

  if (!isOpen) return null;

  const meetingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/meeting/${currentCode}`
    : `https://kollab.io/meeting/${currentCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRegenerateCode = async () => {
    setRegeneratingCode(true);
    setCodeSuccessMsg(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.joinCode) {
        setCurrentCode(data.joinCode);
        if (onCodeRegenerated) {
          onCodeRegenerated(data.joinCode);
        }
        setCodeSuccessMsg("Generated new meeting code!");
        setTimeout(() => setCodeSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingCode(false);
    }
  };

  const toggleSelectMember = (userId?: string) => {
    if (!userId) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleInviteSelected = async () => {
    if (selectedUserIds.size === 0) return;
    setInvitingMembers(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedInvited = new Set(invitedEmails);
        members.forEach((m) => {
          if (m.userId && selectedUserIds.has(m.userId)) {
            updatedInvited.add(m.email.toLowerCase());
          }
        });
        setInvitedEmails(updatedInvited);
        setSelectedUserIds(new Set());
        setStatusMessage({
          type: "success",
          text: `Sent invitation to ${data.invitedCount} colleague${data.invitedCount > 1 ? "s" : ""}!`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to send invitations.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error sending invitations.",
      });
    } finally {
      setInvitingMembers(false);
    }
  };

  const handleInviteSingleMember = async (member: MemberItem) => {
    setInvitingMembers(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          member.userId
            ? { userId: member.userId }
            : { email: member.email }
        ),
      });
      const data = await res.json();
      if (data.success) {
        setInvitedEmails((prev) => new Set(prev).add(member.email.toLowerCase()));
        setStatusMessage({
          type: "success",
          text: `Invitation sent to ${member.fullName}!`,
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: `Failed to invite ${member.fullName}.`,
      });
    } finally {
      setInvitingMembers(false);
    }
  };

  const handleInviteGuestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim() || !guestEmail.includes("@")) {
      setGuestInviteError("Please enter a valid email address.");
      return;
    }
    setGuestInviteError(null);
    setInvitingMembers(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInvitedEmails((prev) => new Set(prev).add(guestEmail.trim().toLowerCase()));
        setStatusMessage({
          type: "success",
          text: `Invitation sent to ${guestEmail.trim()}!`,
        });
        setGuestEmail("");
      } else {
        setGuestInviteError(data.error || "Failed to send invitation.");
      }
    } catch {
      setGuestInviteError("Network error sending invite.");
    } finally {
      setInvitingMembers(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-[#253047] rounded-3xl w-full max-w-xl text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#253047] flex items-center justify-between bg-[#151D2E]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Add Members to Call
              </h2>
              <p className="text-xs text-slate-400">
                Share code or invite colleagues directly into {meetingTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1: Meeting Code & Instant Sharing */}
          <div className="p-4 rounded-2xl bg-[#151D2E] border border-[#253047] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Meeting Join Code
                </span>
                {codeSuccessMsg && (
                  <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                    {codeSuccessMsg}
                  </span>
                )}
              </div>
              {isHost && (
                <Button
                  onClick={handleRegenerateCode}
                  disabled={regeneratingCode}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 gap-1.5"
                  title="Generate a new unique meeting code"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingCode ? "animate-spin" : ""}`} />
                  <span>Generate New Code</span>
                </Button>
              )}
            </div>

            {/* Code Box */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl sm:text-2xl font-mono font-extrabold tracking-wider text-emerald-400 select-all">
                  {currentCode}
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                  Live Room
                </Badge>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={handleCopyCode}
                  size="sm"
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 transition-all ${
                    copiedCode
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied Code" : "Copy Code"}</span>
                </Button>

                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 gap-1.5"
                  title="Copy direct join link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedLink ? "Copied Link" : "Copy Link"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Section 2: Invite by Email */}
          <form onSubmit={handleInviteGuestEmail} className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="pl-9 h-10 bg-[#151D2E] border-[#253047] text-xs text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={invitingMembers || !guestEmail.trim()}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 shrink-0"
              >
                {invitingMembers ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                <span>Send Invite</span>
              </Button>
            </div>
            {guestInviteError && (
              <p className="text-[11px] text-rose-400">{guestInviteError}</p>
            )}
          </form>

          {/* Section 3: Workspace Members Directory */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Workspace Members ({members.length})
                </span>
                {selectedUserIds.size > 0 && (
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                    {selectedUserIds.size} selected
                  </Badge>
                )}
              </div>

              {selectedUserIds.size > 0 && (
                <Button
                  onClick={handleInviteSelected}
                  disabled={invitingMembers}
                  size="sm"
                  className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg gap-1.5"
                >
                  {invitingMembers ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <UserPlus className="w-3 h-3" />
                  )}
                  <span>Invite Selected ({selectedUserIds.size})</span>
                </Button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Search colleagues by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-[#151D2E] border-[#253047] text-xs text-white placeholder:text-slate-500 rounded-xl"
              />
            </div>

            {/* Members List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#253047]/50">
              {loadingMembers ? (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <span>Loading workspace directory...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No colleagues match your search
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const isInCall = m.userId && activeParticipantUserIds.includes(m.userId);
                  const isInvited = invitedEmails.has(m.email.toLowerCase());
                  const isSelected = m.userId ? selectedUserIds.has(m.userId) : false;

                  return (
                    <div
                      key={m.id}
                      className={`pt-2 first:pt-0 flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                        isSelected
                          ? "bg-indigo-950/30 border border-indigo-800/50"
                          : "hover:bg-[#151D2E]/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox for selectable members */}
                        {!isInCall && m.userId && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectMember(m.userId)}
                            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                          />
                        )}

                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={m.avatarUrl || undefined} />
                          <AvatarFallback className="bg-indigo-900 text-indigo-200 text-xs font-bold">
                            {m.fullName[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-200 truncate">
                              {m.fullName}
                            </span>
                            {m.role === "admin" && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {m.email}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isInCall ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            In Call
                          </Badge>
                        ) : isInvited ? (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] gap-1">
                            <Check className="w-3 h-3" />
                            Invited
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleInviteSingleMember(m)}
                            disabled={invitingMembers}
                            size="sm"
                            className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Invite</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#253047] flex items-center justify-between bg-[#151D2E]/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-end encrypted session</span>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="h-8 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs rounded-xl"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
