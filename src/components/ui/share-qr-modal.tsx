"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  QrCode,
  Share2,
  X,
  Mail,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle?: string;
  joinCode?: string;
}

export function ShareQrModal({
  isOpen,
  onClose,
  meetingId,
  meetingTitle = "Kollab Meeting",
  joinCode = meetingId,
}: ShareQrModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen) return null;

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/meeting/${joinCode}/prejoin`
    : `http://localhost:3000/meeting/${joinCode}/prejoin`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCodeOnly = () => {
    navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyFullInvite = () => {
    const text = `Join my Kollab meeting:\n\nTitle: ${meetingTitle}\nJoin Link: ${joinUrl}\nMeeting Code: ${joinCode}\n\nPowered by Kollab 2.0`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Invite & Join QR Code
              </h3>
              <p className="text-xs text-slate-500">Scan with phone or copy the room link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {/* Center: Interactive Visual QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200/80 text-center">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100 mb-3 relative group">
            {/* SVG Visual QR representation */}
            <svg
              viewBox="0 0 160 160"
              width="140"
              height="140"
              className="rounded-lg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner position markers */}
              <rect x="10" y="10" width="40" height="40" rx="6" fill="#4F46E5" />
              <rect x="18" y="18" width="24" height="24" rx="3" fill="#FFFFFF" />
              <rect x="24" y="24" width="12" height="12" rx="2" fill="#4F46E5" />

              <rect x="110" y="10" width="40" height="40" rx="6" fill="#10B981" />
              <rect x="118" y="18" width="24" height="24" rx="3" fill="#FFFFFF" />
              <rect x="124" y="24" width="12" height="12" rx="2" fill="#10B981" />

              <rect x="10" y="110" width="40" height="40" rx="6" fill="#F43F5E" />
              <rect x="18" y="118" width="24" height="24" rx="3" fill="#FFFFFF" />
              <rect x="24" y="124" width="12" height="12" rx="2" fill="#F43F5E" />

              {/* Data pattern dots */}
              <rect x="60" y="15" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="75" y="15" width="8" height="8" rx="2" fill="#4F46E5" />
              <rect x="90" y="15" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="60" y="30" width="8" height="8" rx="2" fill="#10B981" />
              <rect x="85" y="30" width="8" height="8" rx="2" fill="#0F172A" />

              <rect x="15" y="60" width="8" height="8" rx="2" fill="#4F46E5" />
              <rect x="30" y="60" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="45" y="60" width="8" height="8" rx="2" fill="#10B981" />
              <rect x="60" y="60" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="75" y="60" width="8" height="8" rx="2" fill="#F43F5E" />
              <rect x="95" y="60" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="110" y="60" width="8" height="8" rx="2" fill="#4F46E5" />
              <rect x="135" y="60" width="8" height="8" rx="2" fill="#0F172A" />

              <rect x="15" y="80" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="35" y="80" width="8" height="8" rx="2" fill="#F43F5E" />
              <rect x="60" y="80" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="80" y="80" width="8" height="8" rx="2" fill="#10B981" />
              <rect x="105" y="80" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="125" y="80" width="8" height="8" rx="2" fill="#4F46E5" />

              <rect x="60" y="105" width="8" height="8" rx="2" fill="#10B981" />
              <rect x="75" y="105" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="95" y="105" width="8" height="8" rx="2" fill="#F43F5E" />
              <rect x="110" y="105" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="130" y="105" width="8" height="8" rx="2" fill="#4F46E5" />

              <rect x="60" y="125" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="80" y="125" width="8" height="8" rx="2" fill="#4F46E5" />
              <rect x="100" y="125" width="8" height="8" rx="2" fill="#10B981" />
              <rect x="120" y="125" width="8" height="8" rx="2" fill="#0F172A" />
              <rect x="140" y="125" width="8" height="8" rx="2" fill="#F43F5E" />

              {/* Center Logo Hub */}
              <circle cx="80" cy="80" r="14" fill="#FFFFFF" />
              <circle cx="80" cy="80" r="10" fill="#4F46E5" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scan to join instantly on mobile</span>
          </div>
        </div>

        {/* Meeting Details and Copy Row */}
        <div className="space-y-3 text-xs">
          <div>
            <div className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Direct Link</span>
              <button
                onClick={copyLink}
                className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-600 truncate">
              {joinUrl}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Join Code</div>
              <div className="font-mono font-bold text-sm text-slate-900">{joinCode}</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyCodeOnly}
              className="h-8 text-xs gap-1 rounded-lg"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
            </Button>
          </div>
        </div>

        {/* Full Invite Button */}
        <Button
          onClick={copyFullInvite}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-500/25"
        >
          {copiedInvite ? <Check className="w-4 h-4 text-emerald-300" /> : <Mail className="w-4 h-4" />}
          <span>{copiedInvite ? "Invite Text Copied!" : "Copy Full Invitation"}</span>
        </Button>
      </div>
    </div>
  );
}
