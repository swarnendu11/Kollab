"use client";

import React, { useEffect, useRef } from "react";
import { Mic, MicOff, Pin, PinOff, Hand, Wifi, WifiOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { RoomParticipantState } from "@/lib/use-livekit-room";

interface VideoTileProps {
  participant: RoomParticipantState;
  isActiveSpeaker?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
  objectFit?: "cover" | "contain";
  className?: string;
}

export function VideoTile({
  participant,
  isActiveSpeaker = false,
  isPinned = false,
  onPin,
  objectFit = "cover",
  className = "",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (participant.videoTrack && participant.isCameraEnabled) {
      const stream = new MediaStream([participant.videoTrack]);
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
    } else {
      videoEl.srcObject = null;
    }

    return () => {
      if (videoEl) videoEl.srcObject = null;
    };
  }, [participant.videoTrack, participant.isCameraEnabled]);

  const hasVideo = Boolean(participant.videoTrack && participant.isCameraEnabled);

  return (
    <div
      className={`relative w-full h-full rounded-2xl bg-[#0F172A] border overflow-hidden group select-none transition-all duration-200 ${
        isActiveSpeaker
          ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/50"
          : "border-[#253047] hover:border-slate-600"
      } ${className}`}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className={`w-full h-full transition-opacity duration-300 ${
          hasVideo ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${objectFit === "contain" ? "object-contain bg-black" : "object-cover"}`}
      />

      {/* Fallback Avatar when Camera is Off */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#151D2E] to-[#0F172A]">
          <div className="relative">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-[#253047] shadow-xl">
              <AvatarImage src={participant.avatar} />
              <AvatarFallback className="bg-[#6366F1] text-white text-2xl font-bold">
                {participant.name ? participant.name.charAt(0).toUpperCase() : "P"}
              </AvatarFallback>
            </Avatar>

            {/* Speaking animation ripple */}
            {isActiveSpeaker && (
              <span className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-40 pointer-events-none" />
            )}
          </div>
          <span className="mt-3 text-sm font-semibold text-slate-200 tracking-wide">
            {participant.name}
          </span>
          {participant.role === "host" && (
            <Badge className="mt-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] px-2 py-0.5">
              Host
            </Badge>
          )}
        </div>
      )}

      {/* Top Left: Hand Raised Badge */}
      {participant.isHandRaised && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500/90 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full shadow-lg animate-bounce">
          <Hand className="w-3.5 h-3.5" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Top Right: Pin & Network Quality */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onPin && (
          <button
            onClick={onPin}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
              isPinned
                ? "bg-indigo-600 text-white"
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title={isPinned ? "Unpin participant" : "Pin participant"}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Bottom Bar: Name label, Mic status, Network Quality */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 max-w-[85%]">
          {/* Mic indicator */}
          {participant.isMicrophoneEnabled ? (
            <div className="flex items-center gap-1 text-emerald-400">
              <Mic className="w-3.5 h-3.5" />
              {isActiveSpeaker && (
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 bg-emerald-400 animate-pulse h-2 rounded-full" />
                  <span className="w-0.5 bg-emerald-400 animate-pulse h-3 rounded-full delay-75" />
                  <span className="w-0.5 bg-emerald-400 animate-pulse h-1.5 rounded-full delay-150" />
                </span>
              )}
            </div>
          ) : (
            <MicOff className="w-3.5 h-3.5 text-red-400" />
          )}

          {/* Name & Role */}
          <span className="text-xs font-semibold text-slate-100 truncate">
            {participant.name} {participant.isLocal && "(You)"}
          </span>

          {participant.role !== "participant" && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {participant.role}
            </span>
          )}
        </div>

        {/* Network quality icon */}
        <div
          className="bg-slate-950/70 backdrop-blur-md p-1.5 rounded-lg border border-slate-800/60 text-slate-400"
          title={`Connection: ${participant.networkQuality >= 2 ? "Good" : participant.networkQuality === 1 ? "Fair" : "Weak"}`}
        >
          {participant.networkQuality >= 2 ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : participant.networkQuality === 1 ? (
            <Wifi className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          )}
        </div>
      </div>
    </div>
  );
}
