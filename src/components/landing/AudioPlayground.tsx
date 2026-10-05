"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Mic, Sparkles, CheckCircle2, Sliders, Radio } from "lucide-react";

export function AudioPlayground() {
  const [isPlayingChime, setIsPlayingChime] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"ai-krisp" | "spatial" | "studio">("ai-krisp");
  const animationFrameRef = useRef<number | null>(null);

  // Play high quality synthetic Web Audio chime
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Dual harmonic chime
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.35); // G5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1046.5, now); // C6
      osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.25);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);

      setIsPlayingChime(true);
      setTimeout(() => setIsPlayingChime(false), 900);
    } catch {
      setIsPlayingChime(false);
    }
  };

  // Simulated mic level animation when toggled
  useEffect(() => {
    if (!micActive) {
      setVolumeLevel(0);
      return;
    }

    let t = 0;
    const update = () => {
      t += 0.08;
      // Simulated natural voice audio envelope
      const val = Math.max(15, Math.min(95, Math.sin(t) * 35 + Math.cos(t * 2.3) * 25 + 50));
      setVolumeLevel(Math.round(val));
      animationFrameRef.current = requestAnimationFrame(update);
    };
    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [micActive]);

  return (
    <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white border border-indigo-500/30 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient color spots */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Info */}
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
            <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>Interactive Web Audio Diagnostic Engine</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Experience Studio-Grade Audio Before You Join
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Test hardware output, toggle simulated microphone frequency meters, and switch real-time AI noise filtering algorithms instantly in your browser.
          </p>
        </div>

        {/* Right: Controls & Interactive playground */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Test Sound Button */}
          <button
            onClick={playChime}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
              isPlayingChime
                ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/40 scale-105"
                : "bg-white/10 hover:bg-white/20 text-white border-white/20"
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isPlayingChime ? "animate-bounce text-yellow-300" : "text-indigo-400"}`} />
            <span>{isPlayingChime ? "Playing Audio Chime..." : "Test Stereo Chime"}</span>
          </button>

          {/* Test Mic Meter Button */}
          <button
            onClick={() => setMicActive(!micActive)}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
              micActive
                ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/40"
                : "bg-white/10 hover:bg-white/20 text-white border-white/20"
            }`}
          >
            <Mic className={`w-4 h-4 ${micActive ? "animate-pulse text-emerald-200" : "text-emerald-400"}`} />
            <span>{micActive ? "Simulating Mic (Live)" : "Simulate Mic Meter"}</span>
          </button>
        </div>
      </div>

      {/* Live frequency visualizer strip */}
      {micActive && (
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-emerald-300">Live Voice Meter:</span>
            <div className="flex-1 sm:w-64 h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 transition-all duration-100"
                style={{ width: `${volumeLevel}%` }}
              />
            </div>
            <span className="text-xs font-mono text-emerald-300 font-bold">{volumeLevel}%</span>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Algorithm:</span>
            {(["ai-krisp", "spatial", "studio"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] uppercase transition-all ${
                  activeFilter === filter
                    ? "bg-emerald-500 text-slate-950 font-extrabold shadow-sm"
                    : "bg-white/5 text-slate-300 hover:bg-white/15"
                }`}
              >
                {filter === "ai-krisp" ? "AI Noise Cancel" : filter === "spatial" ? "3D Spatial" : "Studio Pro"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
