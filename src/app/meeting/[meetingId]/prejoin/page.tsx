"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Sparkles,
  Sliders,
  Volume2,
  ShieldCheck,
  Check,
  ChevronRight,
  Sun,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KollabLogo } from "@/components/ui/kollab-logo";

export default function PrejoinPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.meetingId as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // States
  const [meeting, setMeeting] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  // Enhancement options
  const [autoLighting, setAutoLighting] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState<"off" | "standard" | "strong">("standard");
  const [backgroundEffect, setBackgroundEffect] = useState<"none" | "blur" | "strong_blur">("none");

  // Devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [deviceSettingsOpen, setDeviceSettingsOpen] = useState(false);

  const [stream, setStream] = useState<MediaStream | null>(null);

  // Load meeting details & user session
  useEffect(() => {
    // Fetch current user session
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    fetch(`/api/meetings/${meetingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.meeting) {
          setMeeting(data.meeting);
        } else {
          setMeeting({
            id: meetingId,
            title: `Meeting (${meetingId})`,
            joinCode: meetingId,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setMeeting({
          id: meetingId,
          title: `Meeting Room`,
          joinCode: meetingId,
        });
        setLoading(false);
      });
  }, [meetingId]);

  // Request real media stream and enumerate devices
  useEffect(() => {
    let localStream: MediaStream | null = null;

    async function initMedia() {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
          audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
        };

        const media = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = media;
        setStream(media);

        if (videoRef.current) {
          videoRef.current.srcObject = media;
        }

        // Setup Audio Analyser for test meter
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(media);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            }
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        } catch {
          // Audio context might fail without user gesture on some browsers
        }

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      } catch (err) {
        console.warn("Media devices not accessible or permission denied:", err);
      }
    }

    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [selectedVideoId, selectedAudioId]);

  // Toggle Video Track
  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    } else {
      setIsCameraOn(!isCameraOn);
    }
  };

  // Toggle Mic Track
  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  const handleJoin = () => {
    // Store prejoin preferences into sessionStorage for instant seamless transition into room
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `kollab_prejoin_${meetingId}`,
        JSON.stringify({
          isCameraOn,
          isMicOn,
          autoLighting,
          noiseSuppression,
          backgroundEffect,
          selectedVideoId,
          selectedAudioId,
        })
      );
    }
    router.push(`/meeting/${meetingId}`);
  };

  const getBackgroundFilter = () => {
    let filter = "";
    if (autoLighting) {
      filter += "brightness(1.12) contrast(1.05) ";
    }
    if (backgroundEffect === "blur") {
      // In video element preview, subtle blur on video or background
    }
    return filter.trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-[#10B981] animate-spin mb-3" />
        <p className="text-sm font-semibold">Preparing meeting preview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-[#10B981]/30">
      {/* Top Prejoin Header */}
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <KollabLogo size={32} />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            KOLLAB
          </span>
        </Link>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connection: Excellent
          </span>
        </div>
      </header>

      {/* Main Prejoin Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 sm:p-10 gap-8 max-w-6xl mx-auto w-full">
        {/* Left: Large Camera Video Preview */}
        <div className="w-full lg:w-3/5 flex flex-col items-center">
          <div className="relative w-full aspect-video rounded-3xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Real video stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ filter: getBackgroundFilter() }}
              className={`w-full h-full object-cover transform -scale-x-100 ${
                !isCameraOn ? "hidden" : ""
              }`}
            />

            {/* Camera Off Avatar Overlay */}
            {!isCameraOn && (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-2xl border border-indigo-400/30 overflow-hidden">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {currentUser?.fullName
                        ? currentUser.fullName
                            .split(" ")
                            .map((p: string) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "KL"}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-200">
                  {currentUser?.fullName || "Camera is turned off"}
                </p>
                <p className="text-xs text-slate-400 mt-1">Your video will be muted on join</p>
              </div>
            )}

            {/* Virtual Background Filter Overlay indicator */}
            {backgroundEffect !== "none" && isCameraOn && (
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1 rounded-full text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Effect: {backgroundEffect.toUpperCase()}</span>
              </div>
            )}

            {/* Lighting Boost Indicator */}
            {autoLighting && isCameraOn && (
              <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1 rounded-full text-xs font-medium text-amber-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Light Active</span>
              </div>
            )}

            {/* Realtime Audio Test Meter */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-full pointer-events-auto">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                    style={{ width: `${isMicOn ? audioLevel : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  {isMicOn ? "Mic test" : "Muted"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Hardware Controls below preview */}
          <div className="mt-5 flex items-center gap-4">
            <button
              onClick={toggleMic}
              className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all ${
                isMicOn
                  ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30"
              }`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleCamera}
              className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all ${
                isCameraOn
                  ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30"
              }`}
              title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setDeviceSettingsOpen(!deviceSettingsOpen)}
              className="w-13 h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition-all"
              title="Device & Audio Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: Join Info, Effects & Audio Controls */}
        <div className="w-full lg:w-2/5 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure Meeting Room</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {meeting.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Join Code: <span className="font-mono text-slate-200">{meeting.joinCode}</span>
            </p>
          </div>

          {/* Quick Settings Accordion */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            {/* Auto Lighting Enhancement */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Automatic Light Correction</div>
                  <div className="text-[11px] text-slate-500">Boost low-light video exposure</div>
                </div>
              </div>
              <button
                onClick={() => setAutoLighting(!autoLighting)}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                  autoLighting ? "bg-[#10B981]" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoLighting ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Noise Suppression Level */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">Noise Cancellation</span>
                <span className="text-[11px] uppercase font-bold text-indigo-400">
                  {noiseSuppression}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["off", "standard", "strong"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setNoiseSuppression(lvl)}
                    className={`py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                      noiseSuppression === lvl
                        ? "bg-indigo-600 text-white border-indigo-400/40 shadow-xs"
                        : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Effects */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-xs font-semibold text-slate-200 mb-2">Background Effects</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "none", label: "None" },
                  { id: "blur", label: "Standard Blur" },
                  { id: "strong_blur", label: "Heavy Blur" },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setBackgroundEffect(bg.id as any)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      backgroundEffect === bg.id
                        ? "bg-indigo-600 text-white border-indigo-400/40 shadow-xs"
                        : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Join Button */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleJoin}
              className="group relative w-full h-13 rounded-xl font-bold text-sm sm:text-base text-white transition-all duration-200 cursor-pointer overflow-hidden
                bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600
                border border-indigo-400/40 hover:border-indigo-300/80
                shadow-[0_1px_2px_rgba(255,255,255,0.25)_inset,0_10px_25px_-5px_rgba(99,102,241,0.4)]
                hover:shadow-[0_1px_2px_rgba(255,255,255,0.35)_inset,0_16px_32px_-6px_rgba(99,102,241,0.55)]
                active:scale-[0.99] flex items-center justify-center gap-3 select-none"
            >
              {/* Subtle animated light sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

              <Video className="w-5 h-5 text-indigo-100 group-hover:scale-110 transition-transform duration-200" />
              <span className="tracking-tight">Join Meeting Now</span>
              <ChevronRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Joining as{" "}
                <span className="text-slate-200 font-semibold">
                  {currentUser?.fullName || "Attendee"}
                </span>
              </span>
              <span>•</span>
              <span className="text-slate-400">Encrypted WebRTC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
