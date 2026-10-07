"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Mic,
  Video,
  Volume2,
  Sliders,
  Sparkles,
  Check,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraChange?: (deviceId: string) => void;
  onMicrophoneChange?: (deviceId: string) => void;
  onSpeakerChange?: (deviceId: string) => void;
  currentVideoDeviceId?: string;
  currentAudioDeviceId?: string;
}

export function DeviceSettingsModal({
  isOpen,
  onClose,
  onCameraChange,
  onMicrophoneChange,
  onSpeakerChange,
  currentVideoDeviceId,
  currentAudioDeviceId,
}: DeviceSettingsModalProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);

  const [selectedVideo, setSelectedVideo] = useState(currentVideoDeviceId || "");
  const [selectedAudioInput, setSelectedAudioInput] = useState(currentAudioDeviceId || "");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState("");

  const [activeTab, setActiveTab] = useState<"audio" | "video">("audio");
  const [micLevel, setMicLevel] = useState(0);
  const [noiseSuppression, setNoiseSuppression] = useState<"off" | "standard" | "strong">("standard");
  const [autoLighting, setAutoLighting] = useState(true);
  const [backgroundEffect, setBackgroundEffect] = useState<"none" | "blur" | "office">("none");

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Enumerate devices
  useEffect(() => {
    if (!isOpen) return;

    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setAudioInputDevices(devices.filter((d) => d.kind === "audioinput"));
        setAudioOutputDevices(devices.filter((d) => d.kind === "audiooutput"));
      } catch (e) {
        console.warn("Failed to enumerate media devices:", e);
      }
    }
    loadDevices();
  }, [isOpen]);

  // Audio meter test
  useEffect(() => {
    if (!isOpen || activeTab !== "audio") return;

    let localStream: MediaStream | null = null;
    async function startMeter() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
        });
        localStream = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        console.warn("Audio meter error:", err);
      }
    }
    startMeter();

    return () => {
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [isOpen, activeTab, selectedAudioInput]);

  // Video preview
  useEffect(() => {
    if (!isOpen || activeTab !== "video") return;

    let stream: MediaStream | null = null;
    async function startVideoPreview() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
        });
        stream = s;
        previewStreamRef.current = s;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = s;
        }
      } catch (e) {
        console.warn("Camera preview error:", e);
      }
    }
    startVideoPreview();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen, activeTab, selectedVideo]);

  const testSpeaker = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0F172A] border border-[#253047] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#253047] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">Device & Media Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#253047] bg-[#151D2E]/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("audio")}
            className={`pb-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "audio"
                ? "border-[#6366F1] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mic className="w-4 h-4" />
            Audio Settings
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`pb-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "video"
                ? "border-[#6366F1] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Video className="w-4 h-4" />
            Video Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5 text-xs">
          {activeTab === "audio" ? (
            <>
              {/* Microphone Select */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Microphone Input</label>
                <select
                  value={selectedAudioInput}
                  onChange={(e) => {
                    setSelectedAudioInput(e.target.value);
                    if (onMicrophoneChange) onMicrophoneChange(e.target.value);
                  }}
                  className="w-full bg-[#151D2E] border border-[#253047] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {audioInputDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone (${d.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>

                {/* Input Level Meter */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Input Volume Test</span>
                    <span className="font-mono text-emerald-400">{micLevel}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speaker Select */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Audio Output (Speaker)</label>
                <div className="flex gap-2">
                  <select
                    value={selectedAudioOutput}
                    onChange={(e) => {
                      setSelectedAudioOutput(e.target.value);
                      if (onSpeakerChange) onSpeakerChange(e.target.value);
                    }}
                    className="flex-1 bg-[#151D2E] border border-[#253047] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {audioOutputDevices.length > 0 ? (
                      audioOutputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Speaker (${d.deviceId.slice(0, 8)})`}
                        </option>
                      ))
                    ) : (
                      <option value="">Default System Speaker</option>
                    )}
                  </select>
                  <Button
                    onClick={testSpeaker}
                    type="button"
                    variant="outline"
                    className="h-10 text-xs bg-slate-800 border-slate-700 text-slate-200 gap-1.5 hover:bg-slate-700 shrink-0"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Test Sound</span>
                  </Button>
                </div>
              </div>

              {/* Noise Suppression */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Noise Suppression</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["off", "standard", "strong"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNoiseSuppression(lvl)}
                      className={`py-2 rounded-xl font-medium capitalize border transition-all text-xs ${
                        noiseSuppression === lvl
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                          : "bg-[#151D2E] border-[#253047] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Camera Select */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Camera Source</label>
                <select
                  value={selectedVideo}
                  onChange={(e) => {
                    setSelectedVideo(e.target.value);
                    if (onCameraChange) onCameraChange(e.target.value);
                  }}
                  className="w-full bg-[#151D2E] border border-[#253047] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera (${d.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera Live Preview */}
              <div className="relative w-full aspect-video rounded-2xl bg-[#070A12] border border-[#253047] overflow-hidden flex items-center justify-center shadow-inner">
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Auto Lighting Enhancement */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#151D2E] border border-[#253047]">
                <div>
                  <div className="font-semibold text-slate-200">Low-Light Auto Adjustment</div>
                  <div className="text-[11px] text-slate-400">Software illumination enhancement</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoLighting(!autoLighting)}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                    autoLighting ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoLighting ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Virtual Background */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Background Effect</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "none", label: "None" },
                    { id: "blur", label: "Blur" },
                    { id: "office", label: "Studio" },
                  ].map((eff) => (
                    <button
                      key={eff.id}
                      type="button"
                      onClick={() => setBackgroundEffect(eff.id as any)}
                      className={`py-2 rounded-xl font-medium border transition-all text-xs ${
                        backgroundEffect === eff.id
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-[#151D2E] border-[#253047] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {eff.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#253047] bg-[#151D2E]/40 flex justify-end">
          <Button
            onClick={onClose}
            className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
          >
            Apply & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
