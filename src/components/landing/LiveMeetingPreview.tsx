"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mic, MicOff, Video, VideoOff, Monitor, Smile, Sparkles, Check } from "lucide-react";

export function LiveMeetingPreview() {
  const [seconds, setSeconds] = useState(1471); // Starts around 24:31 and ticks up live
  const [telemetry, setTelemetry] = useState<any>(null);
  const [activeMeeting, setActiveMeeting] = useState<any>({
    title: "Weekly Product Design Sync",
    joinCode: "klb-design-q4",
  });
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [reaction, setReaction] = useState<string | null>(null);
  const [captionIndex, setCaptionIndex] = useState(0);

  const dynamicCaptions = [
    "Target launch date is confirmed for October 21. Realtime WebRTC and AI meeting summaries are live!",
    "PostgreSQL relational engine is achieving sub-20ms query latency across the workspace.",
    "Hardware noise suppression filters and adaptive bitrate streaming are operating at 60 fps.",
    "Autonomous AI meeting intelligence will generate action items and transcripts immediately upon call wrap-up.",
  ];

  // Live timer ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll real-time dynamic telemetry every 2 seconds
  useEffect(() => {
    const fetchTelemetry = () => {
      fetch("/api/telemetry")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setTelemetry(d);
        })
        .catch(() => {});
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real meeting from database
  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((d) => {
        if (d.meetings && d.meetings.length > 0) {
          const liveOrFirst = d.meetings.find((m: any) => m.status === "live") || d.meetings[0];
          setActiveMeeting(liveOrFirst);
        }
      })
      .catch(() => {});
  }, []);

  // Cycle live captions every 5 seconds
  useEffect(() => {
    const capTimer = setInterval(() => {
      setCaptionIndex((prev) => (prev + 1) % dynamicCaptions.length);
    }, 5000);
    return () => clearInterval(capTimer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const triggerReaction = (emoji: string) => {
    setReaction(emoji);
    setTimeout(() => setReaction(null), 1500);
  };

  return (
    <div className="mt-16 max-w-5xl mx-auto relative rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden group select-none">
      {/* Window bar */}
      <div className="h-11 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <div className="text-xs font-semibold text-slate-700 bg-white px-6 py-1 rounded-md border border-slate-200 shadow-2xs font-mono">
          kollab.io/meeting/{activeMeeting.joinCode || "live-sync"}
        </div>
        <div className="text-xs text-emerald-700 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>{telemetry?.metrics?.fps ? `${telemetry.metrics.fps} FPS` : "60 FPS"} • HD</span>
        </div>
      </div>

      {/* Live Interactive Meeting Room Preview */}
      <div className="bg-[#081C15] p-6 text-white min-h-[440px] flex flex-col justify-between relative overflow-hidden">
        {/* Floating reaction particle */}
        {reaction && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce z-40">
            {reaction}
          </div>
        )}

        {/* Room Header */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-emerald-950 text-sm gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-base text-white">{activeMeeting.title}</span>
            <span className="text-xs bg-emerald-900/60 text-emerald-300 font-mono px-2.5 py-0.5 rounded-full border border-emerald-700/60 font-bold">
              {formatTimer(seconds)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-900 text-emerald-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RTT: {telemetry?.metrics?.latencyMs || 18}ms</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-900 text-indigo-300 font-mono">
              <span>{telemetry?.metrics?.bitrateKbps ? `${telemetry.metrics.bitrateKbps} kbps` : "1,420 kbps"}</span>
            </div>
          </div>
        </div>

        {/* Participant Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="relative aspect-video rounded-2xl bg-slate-900 border-2 border-emerald-400 overflow-hidden shadow-lg shadow-emerald-500/25 group">
            {cameraOn ? (
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"
                alt="Meeting Host"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 text-xs">
                <span>Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-[#081C15]/85 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-900">
              {micOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
              <span>Meeting Host (You)</span>
            </div>
            {micOn && (
              <div className="absolute top-2 right-2 bg-[#10B981] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                SPEAKING
              </div>
            )}
          </div>

          <div className="relative aspect-video rounded-2xl bg-slate-900 border border-emerald-950 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500"
              alt="Design Lead"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-[#081C15]/85 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-900">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>Sarah Chen • Design</span>
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl bg-slate-900 border border-emerald-950 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
              alt="Engineering"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-[#081C15]/85 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-900">
              <Mic className="w-3 h-3 text-slate-400" />
              <span>Marcus Vance • Eng</span>
            </div>
          </div>
        </div>

        {/* Real-time Dynamic Live Caption Bar */}
        <div className="bg-[#061812]/90 border border-emerald-900/80 rounded-xl p-3 text-center text-xs sm:text-sm text-emerald-100 transition-all duration-300">
          <span className="text-[#34D399] font-bold mr-2">Live AI Captions:</span>
          &ldquo;{dynamicCaptions[captionIndex]}&rdquo;
        </div>

        {/* Interactive Meeting Controls Preview */}
        <div className="mt-4 flex items-center justify-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              micOn ? "bg-emerald-900/70 text-white hover:bg-emerald-800" : "bg-red-600 text-white"
            }`}
            title={micOn ? "Mute" : "Unmute"}
          >
            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setCameraOn(!cameraOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              cameraOn ? "bg-emerald-900/70 text-white hover:bg-emerald-800" : "bg-red-600 text-white"
            }`}
            title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => triggerReaction("🎉")}
            className="w-10 h-10 rounded-full bg-emerald-900/70 text-white flex items-center justify-center hover:bg-emerald-800 transition-all"
            title="Celebrate"
          >
            🎉
          </button>

          <button
            onClick={() => triggerReaction("❤️")}
            className="w-10 h-10 rounded-full bg-emerald-900/70 text-white flex items-center justify-center hover:bg-emerald-800 transition-all"
            title="Heart"
          >
            ❤️
          </button>

          <Link
            href="/dashboard"
            className="h-10 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-red-600/30 transition-all"
          >
            JOIN ROOM
          </Link>
        </div>
      </div>
    </div>
  );
}
