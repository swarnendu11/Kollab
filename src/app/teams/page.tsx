"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import {
  Users,
  Plus,
  Mail,
  Check,
  Loader2,
  X,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function TeamsPage() {
  const [team, setTeam] = useState<any>({ name: "Kollab Workspace", slug: "kollab-workspace" });
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Member action states
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ organization: any; members: any[] }>("/api/teams");
      if (data.organization) setTeam(data.organization);
      if (data.members) setMembers(data.members);
    } catch (err: any) {
      console.error("[Teams] Load error:", err);
      setError(err?.message || "Failed to load workspace members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && inviteModalOpen) {
        setInviteModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inviteModalOpen]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteError(null);
    setInviteSuccessMsg(null);
    try {
      const data = await fetchJsonWithTimeout<{ success: boolean; message: string; member?: any }>("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      setInviteSuccessMsg(data.message || `Invitation successfully processed for ${inviteEmail}!`);
      // Reload members list to reflect new user
      loadTeams();
      setTimeout(() => {
        setInviteSuccessMsg(null);
        setInviteModalOpen(false);
        setInviteEmail("");
      }, 1800);
    } catch (err: any) {
      console.error("[Teams] Invite error:", err);
      setInviteError(err?.message || "Failed to send invitation. Please verify the email and your permissions.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the workspace?")) return;
    setRemovingId(memberId);
    setActionError(null);
    try {
      await fetchJsonWithTimeout(`/api/teams?memberId=${encodeURIComponent(memberId)}`, {
        method: "DELETE",
      });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      console.error("[Teams] Remove member error:", err);
      setActionError(err?.message || "Failed to remove member.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {team.name}
              </h1>
              <Badge variant="cyan" className="text-[10px] uppercase font-bold">
                PRO WORKSPACE
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Manage organization members, workspace access, roles, and permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setInviteError(null);
                setInviteSuccessMsg(null);
                setInviteEmail("");
                setInviteModalOpen(true);
              }}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Member</span>
            </Button>
          </div>
        </div>

        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Member list & States */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load team members"
            message={error}
            onRetry={loadTeams}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Team Members ({members.length})</span>
              </div>
              <span className="text-xs text-slate-400">Organization Slug: /{team.slug || "workspace"}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar className="w-10 h-10 ring-1 ring-emerald-200/50">
                      <AvatarImage src={m.avatarUrl} />
                      <AvatarFallback>{m.fullName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{m.fullName || "User"}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={m.role === "owner" ? "default" : m.role === "admin" ? "cyan" : "secondary"}
                      className="text-[10px] uppercase font-bold"
                    >
                      {m.role}
                    </Badge>
                    {m.role !== "owner" && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        disabled={removingId === m.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Remove member"
                        aria-label="Remove member"
                      >
                        {removingId === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInviteModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccessMsg ? (
              <div className="p-6 text-center text-emerald-600 text-sm font-semibold flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-[#10B981]" />
                </div>
                <span>{inviteSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="colleague@kollab.io"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role in Organization
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={!inviteEmail.trim() || inviting}
                  className="w-full h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs mt-2 shadow-sm shadow-emerald-500/20"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Invitation"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
