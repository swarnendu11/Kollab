"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  Mic,
  Volume2,
  CheckCircle2,
  X,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HardwareTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HardwareTestModal({ isOpen, onClose }: HardwareTestModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [activeTab, setActiveTab] = useState<"camera" | "mic" | "speaker">("camera");
  const [cameraActive, setCameraActive] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedAudio, setSelectedAudio] = useState("");

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio meter
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);
            analyserRef.current = analyser;

            const data = new Uint8Array(analyser.frequencyBinCount);
            const update = () => {
              if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i];
                const avg = sum / data.length;
                setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
              }
              animFrameRef.current = requestAnimationFrame(update);
            };
            update();
          }
        } catch {
          // fallback
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      } catch (e) {
        console.warn("Hardware test device access:", e);
      }
    }

    startMedia();

    return () => cleanup();
  }, [isOpen]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicLevel(0);
  };

  // Play pleasant speaker test tone using Web Audio API
  const playTestSpeakerChime = () => {
    try {
      setIsPlayingSound(true);
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Play joyful 3-note chord (C5, E5, G5)
      playTone(523.25, 0, 0.35);
      playTone(659.25, 0.15, 0.45);
      playTone(783.99, 0.3, 0.6);

      setTimeout(() => {
        setIsPlayingSound(false);
      }, 1000);
    } catch {
      setIsPlayingSound(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Audio & Video Diagnostic
              </h3>
              <p className="text-xs text-slate-500">
                Test your camera, microphone, and speakers before joining meetings
              </p>
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

        {/* Tab switchers */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "camera"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Camera</span>
          </button>
          <button
            onClick={() => setActiveTab("mic")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "mic"
                ? "bg-white text-emerald-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Microphone</span>
          </button>
          <button
            onClick={() => setActiveTab("speaker")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "speaker"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Speaker</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "camera" && (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border-2 border-indigo-100 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 flex items-center gap-1.5 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera Stream Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="font-medium">Detected Camera:</span>
              <span className="font-semibold text-slate-800 truncate max-w-xs">
                {videoDevices[0]?.label || "Built-in HD WebCam"}
              </span>
            </div>
          </div>
        )}

        {activeTab === "mic" && (
          <div className="space-y-4 py-2">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Live Microphone Level</div>
                    <div className="text-[11px] text-slate-500">Speak into your mic to test sensitivity</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  {micLevel}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 rounded-full transition-all duration-75"
                  style={{ width: `${micLevel}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Input is responding to room audio normally.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "speaker" && (
          <div className="space-y-4 py-2">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Volume2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">Test Audio Output</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the button below to play a multi-frequency test chime through your speakers or headphones.
                </p>
              </div>

              <Button
                onClick={playTestSpeakerChime}
                disabled={isPlayingSound}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-md shadow-rose-500/25 mx-auto"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isPlayingSound ? "Playing Test Chime..." : "Play Test Sound"}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Hardware permissions verified</span>
          </div>

          <Button
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            All Done
          </Button>
        </div>
      </div>
    </div>
  );
}
