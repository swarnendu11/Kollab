"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Plus,
  Mail,
  ShieldCheck,
  Check,
  Loader2,
  X,
} from "lucide-react";

export default function TeamsPage() {
  const [team, setTeam] = useState<any>({ name: "Kollab Core Team", slug: "kollab-team" });
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => {
        if (d.organization) setTeam(d.organization);
        if (d.members) setMembers(d.members);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      setInviteSuccess(true);
      setTimeout(() => {
        setInviteSuccess(false);
        setInviteModalOpen(false);
        setInviteEmail("");
      }, 1500);
    } catch (e) {
      console.error(e);
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
              onClick={() => setInviteModalOpen(true)}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Member</span>
            </Button>
          </div>
        </div>

        {/* Member list */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Team Members ({members.length})</span>
            </div>
            <span className="text-xs text-slate-400">Organization Slug: /{team.slug}</span>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={m.avatarUrl} />
                      <AvatarFallback>{m.fullName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{m.fullName}</div>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 text-center text-emerald-600 text-sm font-semibold flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-[#10B981]" />
                <span>Invitation email sent successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
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
                  disabled={!inviteEmail.trim()}
                  className="w-full h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs mt-2 shadow-sm shadow-emerald-500/20"
                >
                  Send Invitation
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
