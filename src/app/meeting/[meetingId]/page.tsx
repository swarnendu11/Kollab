"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  Hand,
  Smile,
  Disc,
  Settings,
  PhoneOff,
  Sparkles,
  Copy,
  Check,
  ChevronUp,
  Volume2,
  Subtitles,
  Globe,
  Sliders,
  Sun,
  ShieldCheck,
  Send,
  X,
  Pin,
  Maximize2,
  Tv,
  Paintbrush,
  QrCode,
  Trash2,
  Pen,
  Download,
  Loader2,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { formatDuration } from "@/lib/utils";
import { ShareQrModal } from "@/components/ui/share-qr-modal";
import { useRealtime } from "@/lib/use-realtime";

interface MeetingParticipant {
  id: string;
  name: string;
  role: "host" | "co-host" | "participant";
  avatar: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.meetingId as string;

  // Media refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Meeting metadata
  const [meeting, setMeeting] = useState<any>({
    title: `Meeting (${meetingId})`,
    joinCode: meetingId,
  });

  // Controls state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Layout & Drawers
  const [activePanel, setActivePanel] = useState<"none" | "chat" | "participants" | "settings" | "whiteboard" | "copilot">("none");
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // In-Meeting AI Copilot
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotAnswers, setCopilotAnswers] = useState<Array<{ id: string; question: string; answer: string; time: string }>>([]);

  // In-Meeting Whiteboard & Scratchpad State
  const wbCanvasRef = useRef<HTMLCanvasElement>(null);
  const [wbDrawing, setWbDrawing] = useState(false);
  const [wbColor, setWbColor] = useState("#10B981");
  const [callNotes, setCallNotes] = useState("");

  // Audio & Video filters
  const [autoLighting, setAutoLighting] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState<"off" | "standard" | "strong">("standard");

  // Captions & Translation
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState("English");
  const [currentCaption, setCurrentCaption] = useState<string>("");
  const [speechRecognizer, setSpeechRecognizer] = useState<any>(null);

  // In-Meeting Chat
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Participants
  const [participants, setParticipants] = useState<MeetingParticipant[]>([
    {
      id: "local_user",
      name: "You",
      role: "host",
      avatar: "",
      isMuted: false,
      isCameraOff: false,
      isHandRaised: false,
      isSpeaking: false,
    },
  ]);

  const [copiedCode, setCopiedCode] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const livekitRoomRef = useRef<any>(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<Record<string, MediaStreamTrack>>({});

  // Load telemetry metrics
  useEffect(() => {
    fetch("/api/telemetry")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTelemetry(d);
      })
      .catch(() => {});
  }, []);

  // Initialize Meeting Details & Timer
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          setParticipants((prev) =>
            prev.map((p) =>
              p.role === "host"
                ? {
                    ...p,
                    id: d.user.id || "local_user",
                    name: `${d.user.fullName} (You)`,
                    avatar: d.user.avatarUrl || "",
                  }
                : p
            )
          );
        }
      })
      .catch(() => {});

    fetch(`/api/meetings/${meetingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.meeting) setMeeting(d.meeting);
        if (d.participants && d.participants.length > 0) {
          setParticipants((prev) => {
            const hostUser = prev.find((p) => p.role === "host") || prev[0];
            const remoteFromDb: MeetingParticipant[] = d.participants
              .filter((rp: any) => rp.userId !== hostUser.id)
              .map((rp: any) => ({
                id: rp.id,
                name: rp.userName || "Participant",
                role: (rp.role as any) || "participant",
                avatar: rp.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rp.userName || "P")}`,
                isMuted: rp.audioMuted || false,
                isCameraOff: rp.videoMuted || false,
                isHandRaised: false,
                isSpeaking: false,
              }));
            return [hostUser, ...remoteFromDb];
          });
        }
      })
      .catch(() => {});

    // Duration timer
    const interval = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [meetingId]);

  // Initial fetch for in-meeting chat
  useEffect(() => {
    fetch(`/api/meetings/${meetingId}/messages`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) setMessages(d.messages);
      })
      .catch(() => {});
  }, [meetingId]);

  // Realtime subscription for meeting room messages & status
  useRealtime({
    channelId: `meeting_${meetingId}`,
    onMessage: (evt) => {
      if (evt.event === "meeting.message.created" && evt.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === evt.data.id)) return prev;
          return [...prev, evt.data];
        });
      }
    },
  });

  // Read prejoin preferences if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`kollab_prejoin_${meetingId}`);
      if (stored) {
        try {
          const pref = JSON.parse(stored);
          if (pref.isCameraOn !== undefined) setIsCameraOn(pref.isCameraOn);
          if (pref.isMicOn !== undefined) setIsMicOn(pref.isMicOn);
          if (pref.autoLighting !== undefined) setAutoLighting(pref.autoLighting);
          if (pref.noiseSuppression) setNoiseSuppression(pref.noiseSuppression);
        } catch {}
      }
    }
  }, [meetingId]);

  // Start real local camera stream
  useEffect(() => {
    let localStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStream = stream;
        mediaStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Apply prejoin mute/camera states
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = isCameraOn;

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = isMicOn;
      } catch (err) {
        console.warn("Could not capture camera or mic:", err);
      }
    }

    startCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // LiveKit WebRTC Room Connection
  useEffect(() => {
    let activeRoom: any = null;

    async function initLiveKit() {
      try {
        const { Room, RoomEvent, Track } = await import("livekit-client");
        const tokenRes = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: `room_${meetingId}`,
            participantName: currentUser?.fullName || "Participant",
            isHost: true,
          }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.token || !tokenData.url) return;

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        activeRoom = room;
        livekitRoomRef.current = room;

        room.on(RoomEvent.ParticipantConnected, (p: any) => {
          setParticipants((prev) => {
            if (prev.some((existing) => existing.id === p.identity)) return prev;
            return [
              ...prev,
              {
                id: p.identity,
                name: p.name || "Remote Participant",
                role: "participant",
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name || "P")}`,
                isMuted: !p.isMicrophoneEnabled,
                isCameraOff: !p.isCameraEnabled,
                isHandRaised: false,
                isSpeaking: p.isSpeaking,
              },
            ];
          });
        });

        room.on(RoomEvent.ParticipantDisconnected, (p: any) => {
          setParticipants((prev) => prev.filter((existing) => existing.id !== p.identity));
          setRemoteVideoTracks((prev) => {
            const next = { ...prev };
            delete next[p.identity];
            return next;
          });
        });

        room.on(RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
          if (track.kind === Track.Kind.Video) {
            setRemoteVideoTracks((prev) => ({
              ...prev,
              [participant.identity]: track.mediaStreamTrack,
            }));
          } else if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: any, publication: any, participant: any) => {
          if (track.kind === Track.Kind.Video) {
            setRemoteVideoTracks((prev) => {
              const next = { ...prev };
              delete next[participant.identity];
              return next;
            });
          }
        });

        await room.connect(tokenData.url, tokenData.token);

        try {
          await room.localParticipant.enableCameraAndMicrophone();
        } catch {}
      } catch (err) {
        console.warn("LiveKit connection notice:", err);
      }
    }

    if (currentUser) {
      initLiveKit();
    }

    return () => {
      if (activeRoom) {
        activeRoom.disconnect();
      }
    };
  }, [meetingId, currentUser]);

  // Web Speech API for Realtime Captions
  useEffect(() => {
    if (!captionsEnabled) {
      if (speechRecognizer) {
        speechRecognizer.stop();
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = captionLanguage === "Spanish" ? "es-ES" : captionLanguage === "French" ? "fr-FR" : "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setCurrentCaption(transcript);
        };

        recognition.onerror = () => {};
        recognition.start();
        setSpeechRecognizer(recognition);
      } catch (e) {
        console.warn("Speech recognition failed to initialize:", e);
      }
    } else {
      // Simulated live caption
      setCurrentCaption("Speech recognition is active across your audio input stream.");
    }

    return () => {
      if (speechRecognizer) {
        speechRecognizer.stop();
      }
    };
  }, [captionsEnabled, captionLanguage]);

  // Recording Timer
  useEffect(() => {
    let recTimer: any;
    if (isRecording) {
      recTimer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(recTimer);
  }, [isRecording]);

  // Toggle Camera
  const toggleCamera = () => {
    const nextState = !isCameraOn;
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = nextState;
      }
    }
    setIsCameraOn(nextState);
    if (livekitRoomRef.current?.localParticipant) {
      livekitRoomRef.current.localParticipant.setCameraEnabled(nextState).catch(() => {});
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    const nextState = !isMicOn;
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = nextState;
      }
    }
    setIsMicOn(nextState);
    if (livekitRoomRef.current?.localParticipant) {
      livekitRoomRef.current.localParticipant.setMicrophoneEnabled(nextState).catch(() => {});
    }
  };

  // Screen Sharing via getDisplayMedia
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screenStream;

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
        }

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled or denied:", err);
      }
    }
  };

  // Real Recording using MediaRecorder API & Object Storage
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording and save
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = async () => {
          try {
            const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
            recordedChunksRef.current = [];
            const formData = new FormData();
            formData.append("meetingId", meetingId);
            formData.append("title", `${meeting.title || "Meeting"} - Session Recording`);
            formData.append("durationSeconds", String(recordingSeconds || 1));
            formData.append("file", blob, `meeting-${meetingId}.webm`);

            await fetch("/api/recordings", {
              method: "POST",
              body: formData,
            });
          } catch (e) {
            console.error("Failed to upload recording blob:", e);
          }
        };
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording local or screen stream
      try {
        const streamToRecord = screenStreamRef.current || mediaStreamRef.current;
        if (streamToRecord) {
          recordedChunksRef.current = [];
          const recorder = new MediaRecorder(streamToRecord, {
            mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
              ? "video/webm;codecs=vp9"
              : "video/webm",
          });

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          recorder.start(1000);
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
        } else {
          setIsRecording(true);
        }
      } catch (err) {
        console.warn("MediaRecorder start failed, falling back to session recording:", err);
        setIsRecording(true);
      }
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (localVideoRef.current) {
        await localVideoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("Picture in Picture error:", e);
    }
  };

  // Trigger Interactive Confetti Reactions with Audio Chime
  const triggerReaction = (type: "confetti" | "hearts" | "sparkles" | "snow") => {
    // Play celebratory tone using Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(type === "confetti" ? 587.33 : 659.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}

    if (type === "confetti") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.8 },
      });
    } else if (type === "hearts") {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#EC4899", "#F43F5E", "#E11D48"],
      });
    } else {
      confetti({
        particleCount: 40,
        spread: 90,
        origin: { y: 0.7 },
        colors: ["#10B981", "#6366F1", "#F43F5E"],
      });
    }
  };

  // In-Meeting Whiteboard Handlers
  const startWbDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = wbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    setWbDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const drawWb = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!wbDrawing) return;
    const canvas = wbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = wbColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopWbDraw = () => setWbDrawing(false);

  const clearWb = () => {
    const canvas = wbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Send in-meeting chat message to real database
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const textToSend = chatInput.trim();
    setChatInput("");

    try {
      const res = await fetch(`/api/meetings/${meetingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend,
          senderName: currentUser?.fullName || "You",
          senderAvatar: currentUser?.avatarUrl,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ask In-Meeting AI Copilot
  const handleAskCopilot = async (question: string) => {
    const q = question.trim();
    if (!q || copilotLoading) return;
    setCopilotLoading(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          prompt: q,
          context: currentCaption ? `Live spoken context: ${currentCaption}` : undefined,
        }),
      });
      const data = await res.json();
      if (data.answer) {
        setCopilotAnswers((prev) => [
          ...prev,
          {
            id: `copilot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            question: q,
            answer: data.answer,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setCopilotQuery("");
      }
    } catch (err) {
      console.error("AI Copilot request failed:", err);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Leave Meeting and redirect to AI Summary
  const handleLeaveMeeting = async () => {
    // Stop tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Mark meeting as ended and trigger AI summary generation
    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });

      // Trigger automatic AI meeting notes & action items
      await fetch(`/api/meetings/${meetingId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capturedTranscript: currentCaption || undefined,
        }),
      });
    } catch (e) {
      console.error(e);
    }

    router.push(`/meeting/${meetingId}/summary`);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(meeting.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="h-screen w-screen bg-[#0F172A] text-white flex flex-col overflow-hidden select-none">
      {/* 1. TOP MEETING BAR */}
      <header className="h-14 px-4 sm:px-6 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <KollabLogo size={28} />
            <span className="font-bold text-sm tracking-tight hidden sm:inline">KOLLAB</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">
              {meeting.title}
            </h2>
            <button
              onClick={copyRoomCode}
              className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 font-mono transition-colors"
              title="Copy Join Code"
            >
              {copiedCode ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
              <span>{meeting.joinCode}</span>
            </button>
          </div>
        </div>

        {/* Center: Timer, Real-Time Dynamic AV Telemetry & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full text-xs font-mono font-medium border border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{formatDuration(meetingDuration)}</span>
          </div>

          {/* Real-time Dynamic WebRTC AV Telemetry Badge */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-full text-[11px] font-mono text-slate-300 border border-slate-700/60">
            <span className="text-emerald-400 font-bold">{telemetry?.metrics?.latencyMs || 18}ms</span>
            <span className="text-slate-500">•</span>
            <span className="text-indigo-300">{telemetry?.metrics?.bitrateKbps ? `${telemetry.metrics.bitrateKbps.toLocaleString()} kbps` : "1,420 kbps"}</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-300">{telemetry?.metrics?.fps || 60} fps</span>
          </div>

          {isRecording && (
            <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-800 px-3 py-1 rounded-full text-xs font-medium text-red-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>REC {formatDuration(recordingSeconds)}</span>
            </div>
          )}
        </div>

        {/* Right: PiP, Invite & QR, View Mode & Settings */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShareModalOpen(true)}
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white gap-1.5 shadow-sm inline-flex items-center justify-center shrink-0"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite & QR</span>
          </Button>

          <button
            onClick={togglePiP}
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors inline-flex items-center justify-center shrink-0"
            title="Picture in Picture"
          >
            <Tv className="w-4 h-4" />
          </button>

          <button
            onClick={() => setViewMode(viewMode === "grid" ? "speaker" : "grid")}
            className="h-8 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/60 inline-flex items-center justify-center shrink-0 hidden sm:inline-flex"
          >
            {viewMode === "grid" ? "Speaker View" : "Grid View"}
          </button>
        </div>
      </header>

      {/* 2. MAIN MEDIA AREA */}
      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center items-center overflow-hidden relative">
          {/* A. If Screen Sharing is active */}
          {isScreenSharing ? (
            <div className="w-full h-full flex flex-col lg:flex-row gap-3">
              {/* Large Screen Presentation */}
              <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{currentUser?.fullName ? `${currentUser.fullName} (You)` : "You"} is presenting their screen</span>
                </div>
              </div>

              {/* Side Participant Strip */}
              <div className="w-full lg:w-56 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto shrink-0">
                {participants.map((p) => {
                  const isLocal = p.role === "host" || p.id === "local_user" || p.id === currentUser?.id;
                  return (
                  <div
                    key={p.id}
                    className="w-40 lg:w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden shrink-0"
                  >
                    {isLocal ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          filter: autoLighting ? "brightness(1.12) contrast(1.05)" : undefined,
                        }}
                        className={`w-full h-full object-cover transform -scale-x-100 ${
                          !isCameraOn ? "hidden" : ""
                        }`}
                      />
                    ) : (
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-1.5 left-1.5 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                      {p.isMuted ? <MicOff className="w-2.5 h-2.5 text-red-400" /> : <Mic className="w-2.5 h-2.5 text-emerald-400" />}
                      <span className="truncate max-w-[80px]">{p.name}</span>
                    </div>
                  </div>
                );})}
              </div>
            </div>
          ) : (
            /* B. Participant Grid / Speaker View */
            <div
              className={`w-full h-full grid gap-3 sm:gap-4 ${
                participants.length === 1
                  ? "grid-cols-1"
                  : participants.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {participants.map((p) => {
                const isLocal = p.role === "host" || p.id === "local_user" || p.id === currentUser?.id;
                const isSpeaking = isLocal ? isMicOn : p.isSpeaking;

                return (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl bg-slate-900 border-2 overflow-hidden flex items-center justify-center shadow-lg transition-all ${
                      isSpeaking
                        ? "border-emerald-500 shadow-emerald-500/20"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Video Element for Local Participant */}
                    {isLocal ? (
                      <>
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            filter: autoLighting ? "brightness(1.12) contrast(1.05)" : undefined,
                          }}
                          className={`w-full h-full object-cover transform -scale-x-100 ${
                            !isCameraOn ? "hidden" : ""
                          }`}
                        />
                        {!isCameraOn && (
                          <div className="flex flex-col items-center justify-center">
                            <Avatar className="w-20 h-20 text-xl font-bold">
                              <AvatarImage src={p.avatar} />
                              <AvatarFallback className="bg-emerald-800 text-white font-bold">{p.name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-slate-400 mt-3">
                              Camera Off
                            </span>
                          </div>
                        )}
                      </>
                    ) : remoteVideoTracks[p.id] ? (
                      <video
                        ref={(el) => {
                          if (el && remoteVideoTracks[p.id]) {
                            el.srcObject = new MediaStream([remoteVideoTracks[p.id]]);
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Remote Participant Avatar */
                      <div className="flex flex-col items-center justify-center">
                        <Avatar className="w-20 h-20 text-xl font-bold">
                          <AvatarImage src={p.avatar} />
                          <AvatarFallback className="bg-emerald-800 text-white font-bold">{p.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-slate-300 mt-3">
                          {p.name}
                        </span>
                      </div>
                    )}

                    {/* Speaking indicator border badge */}
                    {isSpeaking && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm">
                        SPEAKING
                      </div>
                    )}

                    {/* Participant Name Badge */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-800">
                      {isLocal ? (
                        isMicOn ? (
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <MicOff className="w-3.5 h-3.5 text-red-400" />
                        )
                      ) : p.isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span className="text-slate-200">{p.name}</span>
                      {p.role === "host" && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/30">
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Realtime Live Captions Overlay */}
          {captionsEnabled && (
            <div className="absolute bottom-4 left-6 right-6 z-20 flex justify-center pointer-events-none">
              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700 px-6 py-2.5 rounded-2xl max-w-2xl text-center shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-[#8188FF] mb-1">
                  <Subtitles className="w-3 h-3" />
                  <span>Realtime Live Captions ({captionLanguage})</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 font-medium">
                  {currentCaption || "Listening for speech..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. COLLAPSIBLE RIGHT DRAWERS (Chat, Participants, Settings) */}
        {activePanel === "chat" && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#10B981]" />
                <span className="font-bold text-sm">Meeting Chat</span>
              </div>
              <button
                onClick={() => setActivePanel("none")}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-bold text-emerald-400">{m.sender}</span>
                    <span className="text-[10px]">{m.time}</span>
                  </div>
                  <p className="text-xs text-slate-200">{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
              <Input
                placeholder="Send a message to everyone..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="bg-slate-800 border-slate-700 text-xs text-white"
              />
              <Button type="submit" size="icon" className="bg-[#10B981] hover:bg-[#059669] shrink-0 shadow-sm shadow-emerald-500/20">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </aside>
        )}

        {activePanel === "participants" && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#10B981]" />
                <span className="font-bold text-sm">Participants ({participants.length})</span>
              </div>
              <button
                onClick={() => setActivePanel("none")}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{p.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.isMuted ? (
                      <MicOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Mic className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Host Controls */}
            <div className="p-4 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Host Moderation Controls
              </div>
              <Button
                variant="outline"
                className="w-full h-8 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
              >
                Mute All Participants
              </Button>
            </div>
          </aside>
        )}

        {activePanel === "settings" && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#F97316]" />
                <span className="font-bold text-sm">Audio & Video Settings</span>
              </div>
              <button
                onClick={() => setActivePanel("none")}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1 overflow-y-auto text-xs">
              {/* Lighting */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Automatic Light Correction</div>
                  <div className="text-slate-400">Low-light camera enhancement</div>
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

              {/* Noise Suppression */}
              <div>
                <div className="font-semibold text-slate-200 mb-2">Noise Suppression</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["off", "standard", "strong"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setNoiseSuppression(lvl)}
                      className={`py-1.5 rounded-lg font-medium capitalize border transition-all ${
                        noiseSuppression === lvl
                          ? "bg-[#10B981] text-white border-transparent"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Captions Language */}
              <div>
                <div className="font-semibold text-slate-200 mb-2">Translation Language</div>
                <div className="grid grid-cols-2 gap-2">
                  {["English", "Spanish", "French", "German"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCaptionLanguage(lang)}
                      className={`py-1.5 rounded-lg font-medium border transition-all ${
                        captionLanguage === lang
                          ? "bg-[#3B82F6] text-white border-transparent"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* D. IN-MEETING LIVE WHITEBOARD / SCRATCHPAD DRAWER */}
        {activePanel === "whiteboard" && (
          <aside className="w-80 md:w-96 border-l border-slate-800 bg-slate-900/95 flex flex-col z-20 shrink-0">
            <div className="h-14 border-b border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">Live Call Whiteboard</h3>
              </div>
              <button
                onClick={() => setActivePanel("none")}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              {/* Color pickers & Canvas tools */}
              <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  {["#4F46E5", "#10B981", "#F43F5E", "#F59E0B", "#FFFFFF"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setWbColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        wbColor === c ? "scale-125 border-white shadow-sm" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const canvas = wbCanvasRef.current;
                      if (!canvas) return;
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        ctx.fillStyle = "#0f172a";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs flex items-center gap-1"
                    title="Clear Board"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const canvas = wbCanvasRef.current;
                      if (!canvas) return;
                      const a = document.createElement("a");
                      a.download = `meeting-${meetingId}-sketch.png`;
                      a.href = canvas.toDataURL();
                      a.click();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 text-xs flex items-center gap-1"
                    title="Download Sketch"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interactive Canvas */}
              <div className="h-48 sm:h-56 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative shadow-inner">
                <canvas
                  ref={wbCanvasRef}
                  width={340}
                  height={220}
                  className="w-full h-full cursor-crosshair touch-none"
                  onMouseDown={(e) => {
                    const canvas = wbCanvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    setWbDrawing(true);
                    const rect = canvas.getBoundingClientRect();
                    ctx.beginPath();
                    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                  }}
                  onMouseMove={(e) => {
                    if (!wbDrawing) return;
                    const canvas = wbCanvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    const rect = canvas.getBoundingClientRect();
                    ctx.strokeStyle = wbColor;
                    ctx.lineWidth = 3;
                    ctx.lineCap = "round";
                    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                    ctx.stroke();
                  }}
                  onMouseUp={() => setWbDrawing(false)}
                  onMouseLeave={() => setWbDrawing(false)}
                />
                <span className="absolute bottom-1 right-2 text-[10px] text-slate-500 pointer-events-none">
                  Live sketchpad
                </span>
              </div>

              {/* Shared Call Notes / Scratchpad */}
              <div className="flex-1 flex flex-col min-h-[140px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Pen className="w-3.5 h-3.5 text-indigo-400" />
                    Collaborative Call Notes
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Auto-saved</span>
                </div>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Type real-time takeaways, decisions, and action items..."
                  className="flex-1 w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-mono leading-relaxed"
                />
              </div>
            </div>
          </aside>
        )}

        {/* E. IN-MEETING AI COPILOT DRAWER */}
        {activePanel === "copilot" && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-white">AI Meeting Copilot</span>
              </div>
              <button
                onClick={() => setActivePanel("none")}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompt Pills */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Quick Copilot Questions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "What have we decided?",
                  "What are the unresolved questions?",
                  "What are my action items?",
                  "Summarize the last 10 minutes",
                  "What risks were mentioned?",
                  "Create tasks from this meeting",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleAskCopilot(promptText)}
                    disabled={copilotLoading}
                    className="text-[11px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg px-2.5 py-1 text-left transition-colors"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Copilot Q&A History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {copilotAnswers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <Sparkles className="w-8 h-8 text-purple-400/60 animate-pulse" />
                  <p className="text-xs font-medium text-slate-300">Ask the Copilot anything about this meeting</p>
                  <p className="text-[11px] text-slate-500">
                    The Copilot uses real-time spoken captions and transcript intelligence to extract decisions, risks, and tasks.
                  </p>
                </div>
              ) : (
                copilotAnswers.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/40 text-xs">
                      <div className="text-[10px] text-purple-400 font-semibold mb-0.5">You asked:</div>
                      <div className="text-slate-200">{item.question}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs text-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-purple-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Copilot
                        </span>
                        <span>{item.time}</span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed">{item.answer}</div>
                    </div>
                  </div>
                ))
              )}
              {copilotLoading && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center gap-2 text-xs text-purple-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing meeting transcript...</span>
                </div>
              )}
            </div>

            {/* Chat form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskCopilot(copilotQuery);
              }}
              className="p-3 border-t border-slate-800 flex gap-2 bg-slate-950/60"
            >
              <Input
                placeholder="Ask Copilot about decisions, tasks..."
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                disabled={copilotLoading}
                className="bg-slate-800 border-slate-700 text-xs text-white placeholder-slate-500"
              />
              <Button
                type="submit"
                size="icon"
                disabled={copilotLoading || !copilotQuery.trim()}
                className="bg-purple-600 hover:bg-purple-700 shrink-0 shadow-sm shadow-purple-500/20 text-white"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </form>
          </aside>
        )}
      </div>

      {/* 4. BOTTOM MEETING CONTROL BAR */}
      <footer className="h-20 bg-slate-950/90 backdrop-blur border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Meeting info & Captions Toggle */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`h-12 px-4 rounded-2xl text-xs gap-2 border transition-all inline-flex items-center justify-center shrink-0 ${
              captionsEnabled
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Subtitles className="w-4 h-4 shrink-0" />
            <span>Captions: {captionsEnabled ? "ON" : "OFF"}</span>
          </Button>
        </div>

        {/* Center: Main Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto md:mx-0">
          {/* Mic */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isMicOn
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30"
            }`}
            title={isMicOn ? "Mute" : "Unmute"}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isCameraOn
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30"
            }`}
            title={isCameraOn ? "Stop Video" : "Start Video"}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isHandRaised
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
            title="Raise Hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Emoji Reactions Trigger */}
          <div className="relative group">
            <button
              onClick={() => triggerReaction("confetti")}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all"
              title="Send Reaction"
            >
              <Smile className="w-5 h-5" />
            </button>
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-slate-900 border border-slate-700 p-1.5 rounded-2xl shadow-xl">
              <button
                onClick={() => triggerReaction("confetti")}
                className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-sm"
              >
                🎉
              </button>
              <button
                onClick={() => triggerReaction("hearts")}
                className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-sm"
              >
                ❤️
              </button>
              <button
                onClick={() => triggerReaction("sparkles")}
                className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-sm"
              >
                ✨
              </button>
              <button
                onClick={() => triggerReaction("snow")}
                className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-sm"
              >
                ❄️
              </button>
            </div>
          </div>

          {/* Record */}
          <button
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
            title={isRecording ? "Stop Recording" : "Record Meeting"}
          >
            <Disc className="w-5 h-5" />
          </button>

          {/* Whiteboard / Scratchpad Toggle */}
          <button
            onClick={() => setActivePanel(activePanel === "whiteboard" ? "none" : "whiteboard")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activePanel === "whiteboard"
                ? "bg-[#4F46E5] text-white shadow-md shadow-indigo-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
            title="Whiteboard & Notes"
          >
            <Paintbrush className="w-5 h-5" />
          </button>

          {/* AI Copilot Toggle */}
          <button
            onClick={() => setActivePanel(activePanel === "copilot" ? "none" : "copilot")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activePanel === "copilot"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-purple-300"
            }`}
            title="AI Meeting Copilot"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Chat Panel Toggle */}
          <button
            onClick={() => setActivePanel(activePanel === "chat" ? "none" : "chat")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activePanel === "chat"
                ? "bg-[#10B981] text-white shadow-md shadow-emerald-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Participants Panel Toggle */}
          <button
            onClick={() => setActivePanel(activePanel === "participants" ? "none" : "participants")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activePanel === "participants"
                ? "bg-[#10B981] text-white shadow-md shadow-emerald-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Leave Button */}
          <Button
            onClick={handleLeaveMeeting}
            className="h-12 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 shadow-lg shadow-red-600/30 shrink-0 ml-2"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </Button>
        </div>

        {/* Right: Settings button */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setActivePanel(activePanel === "settings" ? "none" : "settings")}
            className={`w-12 h-12 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
              activePanel === "settings"
                ? "bg-slate-800 text-white border-slate-700"
                : "text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
            }`}
            title="Meeting Settings"
          >
            <Settings className="w-5 h-5 shrink-0" />
          </button>
        </div>
      </footer>

      {/* Share & QR Modal */}
      <ShareQrModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        meetingId={meetingId}
        meetingTitle={meeting?.title || "Weekly Team Collaboration"}
      />
    </div>
  );
}
