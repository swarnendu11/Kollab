"use client";

import React from "react";
import { X, Activity, Server, Wifi, Shield, Cpu } from "lucide-react";
import type { WebRtcDiagnostics } from "@/lib/use-livekit-room";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: WebRtcDiagnostics;
}

export function DiagnosticsModal({
  isOpen,
  onClose,
  diagnostics,
}: DiagnosticsModalProps) {
  if (!isOpen) return null;

  const qualityScore =
    diagnostics.latencyMs < 50 && diagnostics.packetLossPct < 2
      ? "Excellent"
      : diagnostics.latencyMs < 120 && diagnostics.packetLossPct < 5
      ? "Good"
      : "Poor";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0F172A] border border-[#253047] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#253047] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Network & WebRTC Diagnostics</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Quality Summary Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#151D2E] border border-[#253047]">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  qualityScore === "Excellent"
                    ? "bg-emerald-400 animate-pulse"
                    : qualityScore === "Good"
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
              />
              <div>
                <div className="font-bold text-sm text-slate-100">Connection Quality: {qualityScore}</div>
                <div className="text-[11px] text-slate-400">Live WebRTC SFU telemetry</div>
              </div>
            </div>
            <span className="font-mono font-bold text-emerald-400 text-sm">{diagnostics.latencyMs} ms</span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#151D2E]/80 border border-[#253047]">
              <div className="text-[11px] text-slate-400 mb-0.5">Round-Trip Latency</div>
              <div className="font-mono text-base font-bold text-slate-200">{diagnostics.latencyMs} ms</div>
            </div>

            <div className="p-3 rounded-xl bg-[#151D2E]/80 border border-[#253047]">
              <div className="text-[11px] text-slate-400 mb-0.5">Packet Loss</div>
              <div className="font-mono text-base font-bold text-slate-200">{diagnostics.packetLossPct}%</div>
            </div>

            <div className="p-3 rounded-xl bg-[#151D2E]/80 border border-[#253047]">
              <div className="text-[11px] text-slate-400 mb-0.5">Jitter</div>
              <div className="font-mono text-base font-bold text-slate-200">{diagnostics.jitterMs} ms</div>
            </div>

            <div className="p-3 rounded-xl bg-[#151D2E]/80 border border-[#253047]">
              <div className="text-[11px] text-slate-400 mb-0.5">Bitrate</div>
              <div className="font-mono text-base font-bold text-slate-200">{diagnostics.bitrateKbps} kbps</div>
            </div>

            <div className="p-3 rounded-xl bg-[#151D2E]/80 border border-[#253047]">
              <div className="text-[11px] text-slate-400 mb-0.5">Resolution & FPS</div>
              <div className="font-mono text-sm font-semibold text-slate-200">
                {diagnostics.resolution} @ {diagnostics.fps}fps
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#151D2E]/80 border border-[#253047]">
              <div className="text-[11px] text-slate-400 mb-0.5">Media Codecs</div>
              <div className="font-mono text-sm font-semibold text-slate-200">{diagnostics.codec}</div>
            </div>
          </div>

          {/* Server & ICE Details */}
          <div className="p-3.5 rounded-xl bg-[#151D2E]/60 border border-[#253047] space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">SFU Server:</span>
              <span className="font-semibold text-slate-200">{diagnostics.serverRegion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Connection State:</span>
              <span className="font-semibold text-emerald-400 capitalize">{diagnostics.connectionState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ICE Reconnection Attempts:</span>
              <span className="font-semibold text-slate-200">{diagnostics.reconnectAttempts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
