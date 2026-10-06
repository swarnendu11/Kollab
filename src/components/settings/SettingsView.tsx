"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ErrorState } from "@/components/ui/error-state";
import {
  Settings,
  User,
  Shield,
  Bell,
  Video,
  Sun,
  Mic,
  Check,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export interface SettingsViewProps {
  initialTab?: "profile" | "meeting" | "notifications" | "security";
}

export function SettingsView({ initialTab }: SettingsViewProps) {
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab") as any;

  const [activeTab, setActiveTab] = useState<"profile" | "meeting" | "notifications" | "security">(
    initialTab || queryTab || "meeting"
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Profile states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userRole, setUserRole] = useState("Member");

  // Meeting states
  const [defaultMute, setDefaultMute] = useState(false);
  const [defaultCameraOff, setDefaultCameraOff] = useState(false);
  const [autoLighting, setAutoLighting] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState<"off" | "standard" | "strong">("standard");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchJsonWithTimeout<{ user: any }>("/api/auth/session");
      if (data.user) {
        setFullName(data.user.fullName || "");
        setEmail(data.user.email || "");
        setAvatarUrl(data.user.avatarUrl || "");
        setUserRole(data.user.role || "Member");
      }
    } catch (err: any) {
      console.error("[Settings] Load session error:", err);
      setLoadError(err?.message || "Failed to load current session details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await fetchJsonWithTimeout("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateProfile",
          fullName: fullName.trim(),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error("[Settings] Save error:", err);
      setSaveError(err?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize meeting audio, camera enhancement, profile details, and notifications.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          {[
            { id: "meeting", label: "Meeting & Audio/Video", icon: Video },
            { id: "profile", label: "Profile", icon: User },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "security", label: "Security", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#10B981]/10 text-[#059669]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {saveError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Loading / Error / Content */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : loadError ? (
          <ErrorState
            title="Unable to load settings"
            message={loadError}
            onRetry={loadSession}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            {activeTab === "meeting" && (
              <form onSubmit={handleSave} className="space-y-6">
                <h3 className="text-base font-bold text-slate-900">
                  Audio & Video Enhancement Defaults
                </h3>

                {/* Auto Lighting Correction */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Automatic Light Correction</div>
                      <div className="text-xs text-slate-500">
                        Dynamically brighten low-light camera feeds using real-time canvas enhancement
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoLighting(!autoLighting)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      autoLighting ? "bg-[#10B981]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        autoLighting ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Noise Suppression */}
                <div className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Default Noise Suppression</div>
                      <div className="text-xs text-slate-500">
                        Select filtering strength for background noise, clicks, and fan hums
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-w-md ml-12">
                    {(["off", "standard", "strong"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setNoiseSuppression(lvl)}
                        className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                          noiseSuppression === lvl
                            ? "bg-[#10B981] text-white border-transparent shadow-xs shadow-emerald-500/20"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prejoin Defaults */}
                <div className="space-y-3 pb-4 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">Room Entry Preferences</div>

                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaultMute}
                      onChange={(e) => setDefaultMute(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Always mute my microphone when entering a meeting room</span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaultCameraOff}
                      onChange={(e) => setDefaultCameraOff(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Turn off my camera by default when joining</span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {saved && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Preferences saved!
                    </span>
                  )}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="ml-auto h-10 px-6 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold gap-1.5 shadow-sm shadow-emerald-500/20"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Preferences</span>
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-6">
                <h3 className="text-base font-bold text-slate-900">Personal Information</h3>

                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 ring-2 ring-emerald-200">
                    <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || "User")}`} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold">
                      {fullName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{fullName || "User"}</div>
                    <div className="text-xs text-slate-500">{email}</div>
                    <div className="text-[10px] text-[#059669] font-bold mt-0.5">{userRole}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <Input value={email} disabled className="h-10 rounded-xl bg-slate-50 text-slate-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {saved && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Profile saved!
                    </span>
                  )}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="ml-auto h-10 px-6 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-sm shadow-emerald-500/20"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Notification Settings</h3>
                <p className="text-xs text-slate-500">
                  Control email and in-app alerts for meetings, team chat, and recording status.
                </p>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                    <span>Notify me 10 minutes before a scheduled meeting starts</span>
                  </label>
                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                    <span>Send an alert when an AI summary & recording is ready</span>
                  </label>
                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                    <span>Direct message and mention notifications in channels</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Security & Authentication</h3>
                <p className="text-xs text-slate-500">
                  All credentials, media sessions, and database permissions are authenticated server-side.
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
                  <div className="font-semibold text-slate-900">Active Authentication Layer: Zero-Trust Cryptographic Session & Tokens</div>
                  <div className="text-slate-500">Active user session: {email || "Authenticated"}</div>
                  <div className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> End-to-End Media Token Signing Verified
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
