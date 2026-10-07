"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { useRealtime } from "@/lib/use-realtime";

interface WaitingRoomScreenProps {
  meetingId: string;
  meetingTitle: string;
  hostName: string;
  participantId?: string;
  onAdmitted: () => void;
  onLeave: () => void;
}

export function WaitingRoomScreen({
  meetingId,
  meetingTitle,
  hostName,
  participantId,
  onAdmitted,
  onLeave,
}: WaitingRoomScreenProps) {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [statusMessage, setStatusMessage] = useState("The meeting host has been notified you are waiting.");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Local camera preview while in waiting room
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function setupPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        activeStream = stream;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.warn("Waiting room preview notice:", e);
      }
    }
    setupPreview();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleCam = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsCameraOn(track.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
      }
    }
  };

  // Realtime subscription for admission event
  useRealtime({
    channelId: `meeting_${meetingId}`,
    onMessage: (evt) => {
      if (
        (evt.event === "meeting.participant.admitted" && evt.data?.participantId === participantId) ||
        evt.event === "meeting.participant.admitted_all"
      ) {
        onAdmitted();
      } else if (evt.event === "meeting.participant.rejected" && evt.data?.participantId === participantId) {
        setStatusMessage("The host declined your request to join this meeting.");
      }
    },
  });

  // Polling fallback every 3s in case SSE was disconnected
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/meetings/${meetingId}/participants`);
        if (res.ok) {
          const data = await res.json();
          const inAdmitted = data.participants?.some(
            (p: any) => p.id === participantId && p.status === "admitted"
          );
          if (inAdmitted) {
            onAdmitted();
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [meetingId, participantId, onAdmitted]);

  return (
    <div className="min-h-screen bg-[#070A12] text-white flex flex-col items-center justify-center p-6 selection:bg-[#6366F1]/30">
      <div className="max-w-md w-full bg-[#0F172A] border border-[#253047] rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <KollabLogo size={36} />
          <span className="font-extrabold text-xl tracking-tight text-white">KOLLAB</span>
        </div>

        {/* Video Preview Box */}
        <div className="relative w-48 h-36 rounded-2xl bg-[#151D2E] border border-[#253047] overflow-hidden mb-6 shadow-inner flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraOn ? "opacity-100" : "opacity-0"}`}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
              Camera is off
            </div>
          )}

          {/* Quick controls */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`p-1.5 rounded-full ${
                isMicOn ? "bg-slate-800 text-white" : "bg-red-600 text-white"
              }`}
            >
              {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleCam}
              className={`p-1.5 rounded-full ${
                isCameraOn ? "bg-slate-800 text-white" : "bg-red-600 text-white"
              }`}
            >
              {isCameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Waiting Room Active</span>
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-1">{meetingTitle}</h2>
        <p className="text-xs text-slate-400 mb-4">Hosted by {hostName || "Meeting Host"}</p>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#151D2E] border border-[#253047] p-3.5 rounded-2xl w-full mb-6">
          {statusMessage}
        </p>

        <Button
          onClick={onLeave}
          variant="outline"
          className="w-full h-11 rounded-xl bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 gap-2 text-xs font-semibold"
        >
          <PhoneOff className="w-4 h-4 text-red-400" />
          <span>Leave Waiting Room</span>
        </Button>
      </div>
    </div>
  );
}
