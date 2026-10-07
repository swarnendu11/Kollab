"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Subtitles,
  Activity,
  Shield,
  Sliders,
  Paintbrush,
  QrCode,
  Pen,
  Download,
  Trash2,
  Lock,
  Unlock,
  Loader2,
  ChevronUp,
  LayoutGrid,
  UserCheck,
  UserPlus,
  Send,
  X,
  Volume2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { formatDuration } from "@/lib/utils";
import { useRealtime } from "@/lib/use-realtime";
import { useLiveKitRoom, RoomParticipantState } from "@/lib/use-livekit-room";
import { VideoTile } from "@/components/meeting/video-tile";
import { ScreenShareTile } from "@/components/meeting/screen-share-tile";
import { WaitingRoomScreen } from "@/components/meeting/waiting-room-screen";
import { DeviceSettingsModal } from "@/components/meeting/device-settings-modal";
import { DiagnosticsModal } from "@/components/meeting/diagnostics-modal";
import { SecurityPanel } from "@/components/meeting/security-panel";
import { BreakoutRoomsModal } from "@/components/meeting/breakout-rooms-modal";
import { ShareQrModal } from "@/components/ui/share-qr-modal";
import { AddMembersModal } from "@/components/meeting/add-members-modal";

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.meetingId as string;

  // Session & User
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [meeting, setMeeting] = useState<any>({
    title: `Meeting (${meetingId})`,
    joinCode: meetingId,
  });

  // Prejoin stored preferences
  const [initialPreferences, setInitialPreferences] = useState<{
    isCameraOn: boolean;
    isMicOn: boolean;
    selectedVideoId?: string;
    selectedAudioId?: string;
  }>({ isCameraOn: true, isMicOn: true });

  // LiveKit Token & Server URL
  const [lkToken, setLkToken] = useState<string | null>(null);
  const [lkServerUrl, setLkServerUrl] = useState<string | null>(null);
  const [isWaitingRoomPending, setIsWaitingRoomPending] = useState(false);
  const [waitingParticipantId, setWaitingParticipantId] = useState<string | undefined>();
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Layout & UI States
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [meetingDuration, setMeetingDuration] = useState(0);

  // Active Collapsible Drawers & Modals
  const [activePanel, setActivePanel] = useState<
    "none" | "chat" | "participants" | "security" | "whiteboard" | "copilot"
  >("none");
  const [deviceSettingsOpen, setDeviceSettingsOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [breakoutRoomsOpen, setBreakoutRoomsOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [addMembersModalOpen, setAddMembersModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Server Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Live Captions & Transcripts
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState("English");
  const [currentCaption, setCurrentCaption] = useState<string>("");
  const [liveTranscriptHistory, setLiveTranscriptHistory] = useState<
    Array<{ id: string; speakerName: string; text: string; time: string }>
  >([]);

  // Persistent In-Meeting Chat
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // In-Meeting AI Copilot
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotAnswers, setCopilotAnswers] = useState<
    Array<{ id: string; question: string; answer: string; time: string }>
  >([]);

  // In-Meeting Whiteboard & Call Notes
  const wbCanvasRef = useRef<HTMLCanvasElement>(null);
  const [wbDrawing, setWbDrawing] = useState(false);
  const [wbColor, setWbColor] = useState("#10B981");
  const [callNotes, setCallNotes] = useState("");

  // Host Moderation: Waiting Room Queue
  const [waitingQueue, setWaitingQueue] = useState<any[]>([]);

  // 1. Read stored prejoin preferences
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`kollab_prejoin_${meetingId}`);
      if (stored) {
        try {
          const pref = JSON.parse(stored);
          setInitialPreferences({
            isCameraOn: pref.isCameraOn ?? true,
            isMicOn: pref.isMicOn ?? true,
            selectedVideoId: pref.selectedVideoId,
            selectedAudioId: pref.selectedAudioId,
          });
        } catch {}
      }
    }
  }, [meetingId]);

  // 2. Fetch User & Meeting Metadata
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    fetch(`/api/meetings/${meetingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.meeting) setMeeting(d.meeting);
        if (d.waitingRoom) setWaitingQueue(d.waitingRoom);
      })
      .catch(() => {});

    // Duration timer
    const interval = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [meetingId]);

  // 3. Acquire Secure LiveKit Token with Server-Side Validation
  const requestLiveKitToken = useCallback(async () => {
    try {
      setTokenError(null);
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          roomName: `room_${meetingId}`,
          participantName: currentUser?.fullName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTokenError(data.error || "Failed to join meeting.");
        return;
      }

      if (data.waitingRoom) {
        setIsWaitingRoomPending(true);
        setWaitingParticipantId(data.participantId);
        return;
      }

      setIsWaitingRoomPending(false);
      setLkToken(data.token);
      setLkServerUrl(data.url);
    } catch (err: any) {
      setTokenError("Network error connecting to meeting service.");
    }
  }, [meetingId, currentUser]);

  useEffect(() => {
    if (currentUser) {
      requestLiveKitToken();
    }
  }, [currentUser, requestLiveKitToken]);

  // 4. Authoritative LiveKit Room Hook
  const {
    room,
    connectionState,
    participants,
    activeSpeakerId,
    screenShareParticipantId,
    isHandRaised,
    reactions,
    diagnostics,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    switchCameraDevice,
    switchMicrophoneDevice,
    switchAudioOutputDevice,
    sendReaction,
    toggleHandRaise,
    muteRemoteParticipant,
    muteAllParticipants,
    kickParticipant,
  } = useLiveKitRoom({
    meetingId,
    token: lkToken,
    serverUrl: lkServerUrl,
    initialCameraEnabled: initialPreferences.isCameraOn,
    initialMicrophoneEnabled: initialPreferences.isMicOn,
    preferredVideoDeviceId: initialPreferences.selectedVideoId,
    preferredAudioDeviceId: initialPreferences.selectedAudioId,
    onKicked: () => {
      alert("You have been removed from the meeting by the host.");
      router.push("/dashboard");
    },
  });

  // Local participant state
  const localParticipant = participants.find((p) => p.isLocal) || {
    identity: "local",
    name: currentUser?.fullName || "You",
    role: meeting.hostId === currentUser?.id ? "host" : "participant",
    isLocal: true,
    isCameraEnabled: initialPreferences.isCameraOn,
    isMicrophoneEnabled: initialPreferences.isMicOn,
    isScreenShareEnabled: false,
    isHandRaised,
    isSpeaking: false,
    audioLevel: 0,
    networkQuality: 3,
  };

  const isHost = meeting.hostId === currentUser?.id || localParticipant.role === "host";
  const isCoHost = localParticipant.role === "co-host";
  const canModerate = isHost || isCoHost;

  // 5. Realtime Meeting Messages & Events
  useRealtime({
    channelId: `meeting_${meetingId}`,
    onMessage: (evt) => {
      if (evt.event === "meeting.message.created" && evt.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === evt.data.id)) return prev;
          return [...prev, evt.data];
        });
        if (activePanel !== "chat") {
          setUnreadChatCount((prev) => prev + 1);
        }
      } else if (evt.event === "meeting.settings_updated" && evt.data) {
        setMeeting((prev: any) => ({ ...prev, ...evt.data }));
      } else if (evt.event === "meeting.code_updated" && evt.data?.joinCode) {
        setMeeting((prev: any) => ({ ...prev, joinCode: evt.data.joinCode }));
      } else if (evt.event === "meeting.waiting_room.joined" && evt.data) {
        setWaitingQueue((prev) => [...prev, evt.data.participant]);
      } else if (evt.event === "meeting.recording.started") {
        setIsRecording(true);
      } else if (evt.event === "meeting.recording.ready" || evt.event === "meeting.recording.stopped") {
        setIsRecording(false);
      } else if (evt.event === "meeting.caption.created" && evt.data?.segment) {
        const seg = evt.data.segment;
        setCurrentCaption(`${seg.speakerName}: "${seg.text}"`);
        setLiveTranscriptHistory((prev) => [
          ...prev,
          {
            id: seg.id || `seg_${Date.now()}`,
            speakerName: seg.speakerName,
            text: seg.text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    },
  });

  // Initial fetch for chat messages & recording status
  useEffect(() => {
    fetch(`/api/meetings/${meetingId}/messages`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) setMessages(d.messages);
      })
      .catch(() => {});

    fetch(`/api/meetings/${meetingId}/recording`)
      .then((r) => r.json())
      .then((d) => {
        if (d.isRecording) setIsRecording(true);
      })
      .catch(() => {});
  }, [meetingId]);

  // Recording counter
  useEffect(() => {
    let t: any;
    if (isRecording) {
      t = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(t);
  }, [isRecording]);

  // Handle Server-Side Recording Start / Stop
  const handleToggleRecording = async () => {
    if (!canModerate) return;
    try {
      const action = isRecording ? "stop" : "start";
      const res = await fetch(`/api/meetings/${meetingId}/recording`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, durationSeconds: recordingSeconds }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsRecording(action === "start");
      } else {
        alert(data.error || "Failed to update recording state.");
      }
    } catch {
      alert("Failed to communicate with recording service.");
    }
  };

  // Handle Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;
    const text = chatInput.trim();
    setChatInput("");

    try {
      await fetch(`/api/meetings/${meetingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: text }),
      });
    } catch {}
  };

  // Handle AI Copilot Query Grounded on Transcript
  const handleAskCopilot = async (question: string) => {
    if (!question.trim()) return;
    setCopilotLoading(true);
    const qId = `q_${Date.now()}`;

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          query: question,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "No response generated from meeting context.";

      setCopilotAnswers((prev) => [
        {
          id: qId,
          question,
          answer,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);
    } catch {
      setCopilotAnswers((prev) => [
        {
          id: qId,
          question,
          answer: "AI analysis is temporarily unavailable. Check server connectivity.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);
    }
    setCopilotLoading(false);
  };

  // Host Moderation Actions (Admit, Reject, Mute)
  const handleModeration = async (action: string, participantId?: string, extra?: any) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, participantId, ...extra }),
      });
      if (res.ok) {
        if (action === "admit" && participantId) {
          setWaitingQueue((prev) => prev.filter((p) => p.id !== participantId));
        } else if (action === "admit_all") {
          setWaitingQueue([]);
        } else if (action === "reject" && participantId) {
          setWaitingQueue((prev) => prev.filter((p) => p.id !== participantId));
        }
      }
    } catch {}
  };

  // Host Security Settings Updates (Meeting Lock, Waiting Room, Permissions)
  const handleUpdateSecuritySetting = async (field: string, value: boolean) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setMeeting((prev: any) => ({ ...prev, [field]: value }));
      }
    } catch {}
  };

  // Handle End / Leave Meeting
  const handleLeaveMeeting = () => {
    router.push(`/meeting/${meetingId}/summary`);
  };

  const handleEndMeetingForAll = async () => {
    if (!isHost) return;
    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
    } catch {}
    router.push(`/meeting/${meetingId}/summary`);
  };

  // Render Waiting Room Screen if participant is not admitted
  if (isWaitingRoomPending) {
    return (
      <WaitingRoomScreen
        meetingId={meetingId}
        meetingTitle={meeting.title || "Kollab Meeting"}
        hostName={meeting.hostName || "Meeting Host"}
        participantId={waitingParticipantId}
        onAdmitted={requestLiveKitToken}
        onLeave={() => router.push("/dashboard")}
      />
    );
  }

  // Render Error Screen if token failed
  if (tokenError) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0F172A] border border-[#253047] rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Unable to Join Meeting</h2>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#151D2E] p-3 rounded-xl border border-[#253047]">
            {tokenError}
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="flex-1 h-10 text-xs bg-slate-800 border-slate-700 text-slate-300"
            >
              Dashboard
            </Button>
            <Button
              onClick={requestLiveKitToken}
              className="flex-1 h-10 text-xs bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine Active Screen Share and Primary Focus
  const screenShareParticipant = participants.find((p) => p.isScreenShareEnabled);
  const activeSpeaker =
    participants.find((p) => p.identity === (pinnedParticipantId || activeSpeakerId)) ||
    participants.find((p) => !p.isLocal) ||
    participants[0];

  return (
    <div className="min-h-screen bg-[#070A12] text-white flex flex-col overflow-hidden selection:bg-[#6366F1]/30">
      {/* Reconnecting Banner */}
      {connectionState === "reconnecting" && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-pulse z-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connection lost. Reconnecting to LiveKit SFU...</span>
        </div>
      )}

      {/* Floating Animated Ephemeral Reactions */}
      <div className="fixed bottom-24 right-8 z-40 pointer-events-none flex flex-col-reverse gap-2">
        {reactions.map((rx) => (
          <div
            key={rx.id}
            className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-full shadow-2xl animate-in slide-in-from-bottom duration-300"
          >
            <span className="text-2xl animate-bounce">{rx.emoji}</span>
            <span className="text-[11px] font-semibold text-slate-300">{rx.senderName}</span>
          </div>
        ))}
      </div>

      {/* 1. TOP MEETING HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#253047] flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <KollabLogo size={28} />
            <span className="font-extrabold text-base tracking-tight text-white hidden sm:inline">
              KOLLAB
            </span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Meeting Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 max-w-[200px] sm:max-w-xs truncate">
              {meeting.title}
            </h1>
            {meeting.isLocked && (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] px-2 py-0.5 gap-1">
                <Lock className="w-3 h-3" /> Locked
              </Badge>
            )}
          </div>
        </div>

        {/* Center: Meeting Duration & Recording Indicator */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-300 bg-[#151D2E] px-3 py-1 rounded-full border border-[#253047]">
            {formatDuration(meetingDuration)}
          </span>

          {isRecording && (
            <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>REC {formatDuration(recordingSeconds)}</span>
            </div>
          )}
        </div>

        {/* Right: Layout Switcher, Share, Network Quality */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "speaker" : "grid")}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs hidden sm:flex items-center gap-1.5 transition-colors"
            title={viewMode === "grid" ? "Switch to Speaker View" : "Switch to Grid View"}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="capitalize">{viewMode}</span>
          </button>

          {/* Add Members & Meeting Code */}
          <Button
            onClick={() => setAddMembersModalOpen(true)}
            size="sm"
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm shadow-emerald-600/20"
            title="Add Members & View Meeting Code"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Members</span>
          </Button>

          {/* Share QR / Link */}
          <Button
            onClick={() => setShareModalOpen(true)}
            size="sm"
            variant="outline"
            className="h-9 px-3 rounded-xl bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </Button>

          {/* Network diagnostics button */}
          <button
            onClick={() => setDiagnosticsOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs px-2.5 py-1.5 rounded-xl hover:bg-emerald-900/50 transition-colors"
            title="Open WebRTC Diagnostics"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden lg:inline">{diagnostics.latencyMs}ms</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN MEETING STAGE & SIDEBAR */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Stage Content */}
        <div className="flex-1 p-3 sm:p-5 flex flex-col relative overflow-hidden">
          {/* A. SCREEN SHARE HERO STAGE */}
          {screenShareParticipant?.screenTrack ? (
            <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full">
              {/* Large Screen Share Hero */}
              <div className="flex-1 h-full min-h-[300px]">
                <ScreenShareTile
                  screenTrack={screenShareParticipant.screenTrack}
                  presenterName={screenShareParticipant.name}
                  isLocal={screenShareParticipant.isLocal}
                  onStopSharing={toggleScreenShare}
                />
              </div>

              {/* Companion Participant Strip on Side */}
              <div className="w-full lg:w-64 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto shrink-0 max-h-48 lg:max-h-full">
                {participants.map((p) => (
                  <div key={p.identity} className="w-44 lg:w-full h-28 lg:h-36 shrink-0">
                    <VideoTile
                      participant={p}
                      isActiveSpeaker={p.identity === activeSpeakerId}
                      isPinned={p.identity === pinnedParticipantId}
                      onPin={() =>
                        setPinnedParticipantId(
                          pinnedParticipantId === p.identity ? null : p.identity
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : viewMode === "speaker" && activeSpeaker ? (
            /* B. SPEAKER VIEW LAYOUT */
            <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full">
              {/* Dominant Active Speaker Stage */}
              <div className="flex-1 h-full min-h-[300px]">
                <VideoTile
                  participant={activeSpeaker}
                  isActiveSpeaker={activeSpeaker.identity === activeSpeakerId}
                  isPinned={activeSpeaker.identity === pinnedParticipantId}
                  onPin={() =>
                    setPinnedParticipantId(
                      pinnedParticipantId === activeSpeaker.identity ? null : activeSpeaker.identity
                    )
                  }
                  objectFit="contain"
                />
              </div>

              {/* Strip of Other Attendees */}
              <div className="w-full lg:w-64 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto shrink-0 max-h-48 lg:max-h-full">
                {participants
                  .filter((p) => p.identity !== activeSpeaker.identity)
                  .map((p) => (
                    <div key={p.identity} className="w-44 lg:w-full h-28 lg:h-36 shrink-0">
                      <VideoTile
                        participant={p}
                        isActiveSpeaker={p.identity === activeSpeakerId}
                        isPinned={p.identity === pinnedParticipantId}
                        onPin={() =>
                          setPinnedParticipantId(
                            pinnedParticipantId === p.identity ? null : p.identity
                          )
                        }
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* C. ADAPTIVE RESPONSIVE GRID LAYOUT */
            <div
              className={`flex-1 grid gap-3 sm:gap-4 h-full w-full ${
                participants.length === 1
                  ? "grid-cols-1 max-w-4xl mx-auto"
                  : participants.length === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : participants.length <= 4
                  ? "grid-cols-1 sm:grid-cols-2"
                  : participants.length <= 6
                  ? "grid-cols-2 md:grid-cols-3"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {participants.map((p) => (
                <div key={p.identity} className="w-full h-full min-h-[180px]">
                  <VideoTile
                    participant={p}
                    isActiveSpeaker={p.identity === activeSpeakerId}
                    isPinned={p.identity === pinnedParticipantId}
                    onPin={() =>
                      setPinnedParticipantId(
                        pinnedParticipantId === p.identity ? null : p.identity
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Realtime Live Captions Overlay */}
          {captionsEnabled && currentCaption && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 z-20 pointer-events-none">
              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 text-center shadow-2xl">
                <span className="text-emerald-400 font-bold text-xs mr-2">Captions:</span>
                <span className="text-sm font-medium text-slate-100">{currentCaption}</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. COLLAPSIBLE RIGHT DRAWERS */}

        {/* A. In-Meeting Chat Drawer */}
        {activePanel === "chat" && (
          <aside className="w-80 sm:w-96 bg-[#0F172A] border-l border-[#253047] flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-[#253047] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Meeting Chat</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs font-semibold">No messages yet</p>
                  <p className="text-[11px] text-slate-500">Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-[#151D2E] border border-[#253047]">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-bold text-emerald-400">{m.senderName || m.sender}</span>
                      <span className="text-[10px] text-slate-500">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : m.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{m.messageText || m.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#253047] flex gap-2 bg-[#151D2E]/60">
              <Input
                placeholder="Send a message to everyone..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="bg-[#0F172A] border-[#253047] text-xs text-white"
              />
              <Button type="submit" size="icon" className="bg-[#10B981] hover:bg-emerald-600 shrink-0 text-white">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </aside>
        )}

        {/* B. Participants & Waiting Room Drawer */}
        {activePanel === "participants" && (
          <aside className="w-80 sm:w-96 bg-[#0F172A] border-l border-[#253047] flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-[#253047] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Participants ({participants.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={() => setAddMembersModalOpen(true)}
                  className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1 rounded-lg"
                  title="Add Members to Meeting"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </Button>
                <button onClick={() => setActivePanel("none")} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Meeting Code & Invite Bar */}
            <div className="p-3 mx-4 mt-3 rounded-2xl bg-[#151D2E] border border-[#253047] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Meeting Code</span>
                <span className="text-xs font-mono font-bold text-emerald-400 select-all">{meeting.joinCode}</span>
              </div>
              <Button
                onClick={() => setAddMembersModalOpen(true)}
                size="sm"
                variant="outline"
                className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 text-[11px] gap-1 font-semibold rounded-lg"
              >
                <UserPlus className="w-3 h-3 text-emerald-400" />
                <span>Invite</span>
              </Button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Waiting Room Queue (if host) */}
              {canModerate && waitingQueue.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>Waiting to Join ({waitingQueue.length})</span>
                    <button
                      onClick={() => handleModeration("admit_all")}
                      className="text-[11px] underline hover:text-amber-300"
                    >
                      Admit All
                    </button>
                  </div>

                  {waitingQueue.map((wp) => (
                    <div
                      key={wp.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={wp.avatar} />
                          <AvatarFallback>{wp.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-slate-200">{wp.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleModeration("admit", wp.id)}
                          className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]"
                        >
                          Admit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModeration("reject", wp.id)}
                          className="h-7 px-2 bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400 text-[11px]"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Participants List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  In This Meeting ({participants.length})
                </div>

                {participants.map((p) => (
                  <div
                    key={p.identity}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#151D2E] border border-[#253047]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={p.avatar} />
                        <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                          {p.name} {p.isLocal && <span className="text-slate-400 font-normal">(You)</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">{p.role}</div>
                      </div>
                    </div>

                    {/* Participant media status & host actions */}
                    <div className="flex items-center gap-1.5">
                      {p.isHandRaised && <span className="text-sm animate-bounce">✋</span>}

                      {p.isMicrophoneEnabled ? (
                        <Mic className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <MicOff className="w-4 h-4 text-red-400" />
                      )}

                      {/* Host Moderation Menu */}
                      {canModerate && !p.isLocal && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => {
                              muteRemoteParticipant(p.identity);
                              handleModeration("mute", p.identity);
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                            title="Mute participant"
                          >
                            <MicOff className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              kickParticipant(p.identity);
                              handleModeration("remove", p.identity);
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                            title="Remove participant"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Moderation Quick Buttons */}
            {canModerate && (
              <div className="p-4 border-t border-[#253047] space-y-2">
                <Button
                  onClick={() => {
                    muteAllParticipants();
                    handleModeration("mute_all");
                  }}
                  variant="outline"
                  className="w-full h-8 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                >
                  Mute All Participants
                </Button>
              </div>
            )}
          </aside>
        )}

        {/* C. Dedicated Security Drawer */}
        {activePanel === "security" && (
          <SecurityPanel
            isOpen={true}
            onClose={() => setActivePanel("none")}
            isLocked={Boolean(meeting.isLocked)}
            onToggleLock={() => handleUpdateSecuritySetting("isLocked", !meeting.isLocked)}
            waitingRoomEnabled={Boolean(meeting.waitingRoomEnabled)}
            onToggleWaitingRoom={() =>
              handleUpdateSecuritySetting("waitingRoomEnabled", !meeting.waitingRoomEnabled)
            }
            chatEnabled={Boolean(meeting.chatEnabled ?? true)}
            onToggleChat={() => handleUpdateSecuritySetting("chatEnabled", !meeting.chatEnabled)}
            screenShareEnabled={Boolean(meeting.screenShareEnabled ?? true)}
            onToggleScreenShare={() =>
              handleUpdateSecuritySetting("screenShareEnabled", !meeting.screenShareEnabled)
            }
            allowReactions={Boolean(meeting.allowReactions ?? true)}
            onToggleReactions={() =>
              handleUpdateSecuritySetting("allowReactions", !meeting.allowReactions)
            }
            allowAiCopilot={Boolean(meeting.allowAiCopilot ?? true)}
            onToggleAiCopilot={() =>
              handleUpdateSecuritySetting("allowAiCopilot", !meeting.allowAiCopilot)
            }
            passcode={meeting.passcode}
          />
        )}

        {/* D. In-Meeting AI Copilot Drawer */}
        {activePanel === "copilot" && (
          <aside className="w-80 sm:w-96 bg-[#0F172A] border-l border-[#253047] flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-[#253047] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-white">AI Meeting Copilot</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="p-3 border-b border-[#253047] bg-[#151D2E]/40">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Meeting Intelligence Questions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "What have we decided?",
                  "What are my action items?",
                  "What risks were mentioned?",
                  "Summarize the discussion so far",
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

            {/* Q&A Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {copilotAnswers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <Sparkles className="w-8 h-8 text-purple-400/60 animate-pulse" />
                  <p className="text-xs font-medium text-slate-300">Ask the Copilot anything</p>
                  <p className="text-[11px] text-slate-500">
                    Answers are strictly grounded in this meeting's live transcript.
                  </p>
                </div>
              ) : (
                copilotAnswers.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/40 text-xs">
                      <div className="text-[10px] text-purple-400 font-semibold mb-0.5">You asked:</div>
                      <div className="text-slate-200">{item.question}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#151D2E] border border-[#253047] text-xs text-slate-200 space-y-1">
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
                <div className="p-3 rounded-xl bg-[#151D2E] border border-[#253047] flex items-center gap-2 text-xs text-purple-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing transcript data...</span>
                </div>
              )}
            </div>

            {/* Query Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskCopilot(copilotQuery);
                setCopilotQuery("");
              }}
              className="p-3 border-t border-[#253047] flex gap-2 bg-[#151D2E]/60"
            >
              <Input
                placeholder="Ask about decisions, deliverables..."
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                disabled={copilotLoading}
                className="bg-[#0F172A] border-[#253047] text-xs text-white"
              />
              <Button
                type="submit"
                size="icon"
                disabled={copilotLoading || !copilotQuery.trim()}
                className="bg-purple-600 hover:bg-purple-700 shrink-0 text-white"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </form>
          </aside>
        )}

        {/* E. Whiteboard & Call Notes Drawer */}
        {activePanel === "whiteboard" && (
          <aside className="w-80 md:w-96 border-l border-[#253047] bg-[#0F172A] flex flex-col z-20 shrink-0">
            <div className="h-14 border-b border-[#253047] px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">Whiteboard & Scratchpad</h3>
              </div>
              <button onClick={() => setActivePanel("none")} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              {/* Palette */}
              <div className="flex items-center justify-between bg-[#151D2E] p-2 rounded-xl border border-[#253047]">
                <div className="flex items-center gap-1.5">
                  {["#6366F1", "#10B981", "#EF4444", "#F59E0B", "#FFFFFF"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setWbColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        wbColor === c ? "scale-125 border-white shadow-sm" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
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
                        ctx.fillStyle = "#070A12";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 text-xs"
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
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 text-xs"
                    title="Download Sketch"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="h-48 sm:h-56 bg-[#070A12] rounded-xl border border-[#253047] overflow-hidden relative shadow-inner">
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
              </div>

              {/* Collaborative Notes */}
              <div className="flex-1 flex flex-col min-h-[140px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Pen className="w-3.5 h-3.5 text-indigo-400" />
                    Call Takeaways & Notes
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Auto-saved</span>
                </div>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Record immediate discussion items..."
                  className="flex-1 w-full bg-[#151D2E]/80 border border-[#253047] rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-mono leading-relaxed"
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 4. BOTTOM MEETING CONTROL BAR */}
      <footer className="h-20 bg-[#070A12]/95 backdrop-blur-md border-t border-[#253047] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Captions & Settings */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`h-11 px-3.5 rounded-2xl text-xs gap-2 border transition-all ${
              captionsEnabled
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span>Captions: {captionsEnabled ? "ON" : "OFF"}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setDeviceSettingsOpen(true)}
            className="h-11 px-3 rounded-2xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 gap-1.5"
            title="Audio & Video Settings"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden xl:inline">Devices</span>
          </Button>
        </div>

        {/* Center: Primary Media Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 mx-auto md:mx-0">
          {/* Microphone */}
          <button
            onClick={toggleMicrophone}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              localParticipant.isMicrophoneEnabled
                ? "bg-[#151D2E] hover:bg-slate-700 text-white border border-[#253047]"
                : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30"
            }`}
            title={localParticipant.isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {localParticipant.isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              localParticipant.isCameraEnabled
                ? "bg-[#151D2E] hover:bg-slate-700 text-white border border-[#253047]"
                : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30"
            }`}
            title={localParticipant.isCameraEnabled ? "Stop Camera" : "Start Camera"}
          >
            {localParticipant.isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              localParticipant.isScreenShareEnabled
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-[#151D2E] hover:bg-slate-700 text-white border border-[#253047]"
            }`}
            title={localParticipant.isScreenShareEnabled ? "Stop Sharing Screen" : "Share Screen"}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHandRaise}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isHandRaised
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                : "bg-[#151D2E] hover:bg-slate-700 text-white border border-[#253047]"
            }`}
            title={isHandRaised ? "Lower Hand" : "Raise Hand"}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Ephemeral Reaction Picker */}
          <div className="relative group">
            <button
              onClick={() => sendReaction("👍")}
              className="w-12 h-12 rounded-2xl bg-[#151D2E] hover:bg-slate-700 text-white border border-[#253047] flex items-center justify-center transition-all"
              title="Send Reaction"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Reaction popup */}
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-[#0F172A] border border-[#253047] p-1.5 rounded-2xl shadow-2xl z-40">
              {["👍", "❤️", "😂", "👏", "🎉", "😮", "😢", "❓"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-base hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Server-Side Recording (Host/Co-host) */}
          {canModerate && (
            <button
              onClick={handleToggleRecording}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-[#151D2E] hover:bg-slate-700 text-slate-300 border border-[#253047]"
              }`}
              title={isRecording ? "Stop Recording" : "Start Server Recording"}
            >
              <Disc className="w-5 h-5" />
            </button>
          )}

          {/* Whiteboard */}
          <button
            onClick={() => setActivePanel(activePanel === "whiteboard" ? "none" : "whiteboard")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activePanel === "whiteboard"
                ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/30"
                : "bg-[#151D2E] hover:bg-slate-700 text-white border border-[#253047]"
            }`}
            title="Whiteboard & Notes"
          >
            <Paintbrush className="w-5 h-5" />
          </button>

          {/* AI Copilot */}
          <button
            onClick={() => setActivePanel(activePanel === "copilot" ? "none" : "copilot")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activePanel === "copilot"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                : "bg-[#151D2E] hover:bg-slate-700 text-purple-300 border border-[#253047]"
            }`}
            title="AI Meeting Copilot"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Sidebars, Security & Leave Meeting */}
        <div className="flex items-center gap-2">
          {/* Security panel button (Host/Co-Host) */}
          {canModerate && (
            <button
              onClick={() => setActivePanel(activePanel === "security" ? "none" : "security")}
              className={`p-3 rounded-2xl border transition-all ${
                activePanel === "security"
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-[#151D2E] text-slate-300 hover:text-white border-[#253047]"
              }`}
              title="Security Controls"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}

          {/* Chat */}
          <button
            onClick={() => {
              setActivePanel(activePanel === "chat" ? "none" : "chat");
              setUnreadChatCount(0);
            }}
            className={`p-3 rounded-2xl border transition-all relative ${
              activePanel === "chat"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-[#151D2E] text-slate-300 hover:text-white border-[#253047]"
            }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants */}
          <button
            onClick={() => setActivePanel(activePanel === "participants" ? "none" : "participants")}
            className={`p-3 rounded-2xl border transition-all relative ${
              activePanel === "participants"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-[#151D2E] text-slate-300 hover:text-white border-[#253047]"
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
            {waitingQueue.length > 0 && canModerate && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center animate-bounce">
                {waitingQueue.length}
              </span>
            )}
          </button>

          {/* Leave / End Meeting Button (Visually Separated) */}
          <Button
            onClick={() => {
              if (isHost) {
                setLeaveModalOpen(true);
              } else {
                handleLeaveMeeting();
              }
            }}
            className="h-12 px-5 sm:px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 shadow-lg shadow-red-600/30 shrink-0 ml-1 sm:ml-2"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </Button>
        </div>
      </footer>

      {/* MODALS */}

      {/* Leave / End Meeting Confirmation Modal for Host */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0F172A] border border-[#253047] rounded-3xl w-full max-w-sm p-6 text-slate-100 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold">Leave or End Meeting</h3>
            <p className="text-xs text-slate-400">
              As host, you can end this meeting for everyone or just leave and let participants continue.
            </p>
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleEndMeetingForAll}
                className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
              >
                End Meeting for All
              </Button>
              <Button
                onClick={handleLeaveMeeting}
                variant="outline"
                className="w-full h-10 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs"
              >
                Leave Meeting
              </Button>
              <Button
                onClick={() => setLeaveModalOpen(false)}
                variant="ghost"
                className="w-full h-9 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={deviceSettingsOpen}
        onClose={() => setDeviceSettingsOpen(false)}
        onCameraChange={switchCameraDevice}
        onMicrophoneChange={switchMicrophoneDevice}
        onSpeakerChange={switchAudioOutputDevice}
      />

      {/* WebRTC Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        diagnostics={diagnostics}
      />

      {/* Breakout Rooms Modal */}
      <BreakoutRoomsModal
        isOpen={breakoutRoomsOpen}
        onClose={() => setBreakoutRoomsOpen(false)}
        meetingId={meetingId}
        participants={participants}
        isHost={canModerate}
      />

      {/* Share / Invite QR Modal */}
      <ShareQrModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        meetingId={meetingId}
        meetingTitle={meeting.title}
        joinCode={meeting.joinCode}
      />

      {/* Add Members & Meeting Code Modal */}
      <AddMembersModal
        isOpen={addMembersModalOpen}
        onClose={() => setAddMembersModalOpen(false)}
        meetingId={meetingId}
        joinCode={meeting.joinCode || meetingId}
        meetingTitle={meeting.title}
        isHost={canModerate}
        onCodeRegenerated={(newCode) => {
          setMeeting((prev: any) => ({ ...prev, joinCode: newCode }));
        }}
        activeParticipantUserIds={participants.map((p) => p.identity)}
      />
    </div>
  );
}
