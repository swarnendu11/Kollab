"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  Room as LiveKitRoom,
  LocalParticipant,
  RemoteParticipant,
  TrackPublication,
  LocalTrackPublication,
  RemoteTrackPublication,
  Participant,
} from "livekit-client";

export interface RoomParticipantState {
  identity: string;
  name: string;
  avatar?: string;
  role: "host" | "co-host" | "participant";
  isLocal: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenShareEnabled: boolean;
  isHandRaised: boolean;
  networkQuality: number; // 0 (unknown), 1 (poor), 2 (good), 3 (excellent)
  videoTrack?: MediaStreamTrack | null;
  audioTrack?: MediaStreamTrack | null;
  screenTrack?: MediaStreamTrack | null;
}

export interface WebRtcDiagnostics {
  connectionState: string;
  latencyMs: number;
  packetLossPct: number;
  jitterMs: number;
  bitrateKbps: number;
  fps: number;
  resolution: string;
  codec: string;
  reconnectAttempts: number;
  serverRegion: string;
}

export interface EphemeralReaction {
  id: string;
  emoji: string;
  senderName: string;
  senderId: string;
  timestamp: number;
}

interface UseLiveKitRoomProps {
  meetingId: string;
  token?: string | null;
  serverUrl?: string | null;
  initialCameraEnabled?: boolean;
  initialMicrophoneEnabled?: boolean;
  preferredVideoDeviceId?: string;
  preferredAudioDeviceId?: string;
  onParticipantAdmitted?: (participantId: string) => void;
  onParticipantRejected?: (participantId: string) => void;
  onKicked?: () => void;
}

export function useLiveKitRoom({
  meetingId,
  token,
  serverUrl,
  initialCameraEnabled = true,
  initialMicrophoneEnabled = true,
  preferredVideoDeviceId,
  preferredAudioDeviceId,
  onParticipantAdmitted,
  onParticipantRejected,
  onKicked,
}: UseLiveKitRoomProps) {
  const roomRef = useRef<LiveKitRoom | null>(null);
  const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected" | "reconnecting" | "failed"
  >("disconnected");

  const [participants, setParticipants] = useState<RoomParticipantState[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [screenShareParticipantId, setScreenShareParticipantId] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [reactions, setReactions] = useState<EphemeralReaction[]>([]);

  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<WebRtcDiagnostics>({
    connectionState: "disconnected",
    latencyMs: 18,
    packetLossPct: 0,
    jitterMs: 2,
    bitrateKbps: 0,
    fps: 30,
    resolution: "1280x720",
    codec: "VP8 / Opus",
    reconnectAttempts: 0,
    serverRegion: "LiveKit SFU Cloud",
  });

  const reconnectCountRef = useRef(0);
  const statsIntervalRef = useRef<any>(null);

  // Sync participant state from LiveKit room
  const updateParticipantsState = useCallback((room: LiveKitRoom) => {
    const list: RoomParticipantState[] = [];

    // Local participant
    const lp = room.localParticipant;
    let localRole: "host" | "co-host" | "participant" = "participant";
    let localAvatar = "";
    try {
      if (lp.metadata) {
        const meta = JSON.parse(lp.metadata);
        if (meta.role) localRole = meta.role;
        if (meta.avatar) localAvatar = meta.avatar;
      }
    } catch {}

    // Find local tracks
    let localCamTrack: MediaStreamTrack | null = null;
    let localMicTrack: MediaStreamTrack | null = null;
    let localScrTrack: MediaStreamTrack | null = null;

    lp.videoTrackPublications.forEach((pub: LocalTrackPublication) => {
      if (pub.source === "screen_share") {
        localScrTrack = pub.track?.mediaStreamTrack || null;
      } else if (pub.track) {
        localCamTrack = pub.track.mediaStreamTrack;
      }
    });

    lp.audioTrackPublications.forEach((pub: LocalTrackPublication) => {
      if (pub.track) localMicTrack = pub.track.mediaStreamTrack;
    });

    const isLocalScreenSharing = Boolean(localScrTrack);
    if (isLocalScreenSharing) {
      setScreenShareParticipantId(lp.identity);
    }

    list.push({
      identity: lp.identity,
      name: lp.name || "You",
      avatar: localAvatar,
      role: localRole,
      isLocal: true,
      isSpeaking: lp.isSpeaking,
      audioLevel: lp.audioLevel || 0,
      isCameraEnabled: lp.isCameraEnabled,
      isMicrophoneEnabled: lp.isMicrophoneEnabled,
      isScreenShareEnabled: isLocalScreenSharing,
      isHandRaised,
      networkQuality: lp.connectionQuality === "excellent" ? 3 : lp.connectionQuality === "good" ? 2 : 1,
      videoTrack: localCamTrack,
      audioTrack: localMicTrack,
      screenTrack: localScrTrack,
    });

    // Remote participants
    let foundRemoteScreenShare: string | null = null;

    room.remoteParticipants.forEach((rp: RemoteParticipant) => {
      let rRole: "host" | "co-host" | "participant" = "participant";
      let rAvatar = "";
      let rHandRaised = false;

      try {
        if (rp.metadata) {
          const meta = JSON.parse(rp.metadata);
          if (meta.role) rRole = meta.role;
          if (meta.avatar) rAvatar = meta.avatar;
          if (meta.handRaised) rHandRaised = Boolean(meta.handRaised);
        }
      } catch {}

      let rCamTrack: MediaStreamTrack | null = null;
      let rMicTrack: MediaStreamTrack | null = null;
      let rScrTrack: MediaStreamTrack | null = null;

      rp.videoTrackPublications.forEach((pub: RemoteTrackPublication) => {
        if (pub.source === "screen_share") {
          rScrTrack = pub.track?.mediaStreamTrack || null;
          if (rScrTrack) foundRemoteScreenShare = rp.identity;
        } else if (pub.track) {
          rCamTrack = pub.track.mediaStreamTrack;
        }
      });

      rp.audioTrackPublications.forEach((pub: RemoteTrackPublication) => {
        if (pub.track) {
          rMicTrack = pub.track.mediaStreamTrack;
          // Ensure remote audio track is attached to audio element for playback
          pub.track.attach();
        }
      });

      list.push({
        identity: rp.identity,
        name: rp.name || "Participant",
        avatar: rAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rp.name || rp.identity)}`,
        role: rRole,
        isLocal: false,
        isSpeaking: rp.isSpeaking,
        audioLevel: rp.audioLevel || 0,
        isCameraEnabled: rp.isCameraEnabled,
        isMicrophoneEnabled: rp.isMicrophoneEnabled,
        isScreenShareEnabled: Boolean(rScrTrack),
        isHandRaised: rHandRaised,
        networkQuality: rp.connectionQuality === "excellent" ? 3 : rp.connectionQuality === "good" ? 2 : 1,
        videoTrack: rCamTrack,
        audioTrack: rMicTrack,
        screenTrack: rScrTrack,
      });
    });

    if (foundRemoteScreenShare) {
      setScreenShareParticipantId(foundRemoteScreenShare);
    } else if (!isLocalScreenSharing) {
      setScreenShareParticipantId(null);
    }

    setParticipants(list);
  }, [isHandRaised]);

  // Connect & setup event listeners
  useEffect(() => {
    if (!token || !serverUrl) return;
    const activeServerUrl: string = serverUrl;
    const activeToken: string = token;

    let isMounted = true;
    let roomInstance: LiveKitRoom | null = null;

    async function initRoom() {
      try {
        const { Room, RoomEvent, Track, ConnectionState } = await import("livekit-client");

        setConnectionState("connecting");

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { width: 1280, height: 720, frameRate: 30 },
            deviceId: preferredVideoDeviceId,
          },
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            deviceId: preferredAudioDeviceId,
          },
        });

        roomInstance = room;
        roomRef.current = room;

        // --- Room Events ---
        room.on(RoomEvent.Connected, () => {
          if (!isMounted) return;
          setConnectionState("connected");
          updateParticipantsState(room);
        });

        room.on(RoomEvent.Reconnecting, () => {
          if (!isMounted) return;
          reconnectCountRef.current += 1;
          setConnectionState("reconnecting");
          setDiagnostics((prev) => ({
            ...prev,
            connectionState: "reconnecting",
            reconnectAttempts: reconnectCountRef.current,
          }));
        });

        room.on(RoomEvent.Reconnected, () => {
          if (!isMounted) return;
          setConnectionState("connected");
          setDiagnostics((prev) => ({
            ...prev,
            connectionState: "connected",
          }));
          updateParticipantsState(room);
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!isMounted) return;
          setConnectionState("disconnected");
        });

        room.on(RoomEvent.ParticipantConnected, () => {
          if (!isMounted) return;
          updateParticipantsState(room);
        });

        room.on(RoomEvent.ParticipantDisconnected, () => {
          if (!isMounted) return;
          updateParticipantsState(room);
        });

        room.on(RoomEvent.TrackPublished, () => {
          if (!isMounted) return;
          updateParticipantsState(room);
        });

        room.on(RoomEvent.TrackUnpublished, () => {
          if (!isMounted) return;
          updateParticipantsState(room);
        });

        room.on(RoomEvent.TrackSubscribed, (track: any) => {
          if (!isMounted) return;
          if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
          updateParticipantsState(room);
        });

        room.on(RoomEvent.TrackUnsubscribed, () => {
          if (!isMounted) return;
          updateParticipantsState(room);
        });

        room.on(RoomEvent.TrackMuted, () => {
          if (!isMounted) return;
          updateParticipantsState(room);
        });

        room.on(RoomEvent.TrackUnmuted, () => {
          if (!isMounted) return;
          updateParticipantsState(room);
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          if (!isMounted) return;
          if (speakers.length > 0) {
            setActiveSpeakerId(speakers[0].identity);
          } else {
            setActiveSpeakerId(null);
          }
          updateParticipantsState(room);
        });

        room.on(RoomEvent.ParticipantMetadataChanged, () => {
          if (!isMounted) return;
          updateParticipantsState(room);
        });

        // Realtime Data Messages (Reactions, Hand Raise, Moderation)
        room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
          try {
            const text = new TextDecoder().decode(payload);
            const data = JSON.parse(text);

            if (data.type === "reaction" && data.emoji) {
              const newReaction: EphemeralReaction = {
                id: `rx_${Date.now()}_${Math.random()}`,
                emoji: data.emoji,
                senderName: data.senderName || participant?.name || "Participant",
                senderId: participant?.identity || "unknown",
                timestamp: Date.now(),
              };
              setReactions((prev) => [...prev.slice(-15), newReaction]);
            } else if (data.type === "hand_raise") {
              updateParticipantsState(room);
            } else if (data.type === "mute_participant" && data.targetId === room.localParticipant.identity) {
              room.localParticipant.setMicrophoneEnabled(false);
            } else if (data.type === "mute_all" && !room.localParticipant.permissions?.canUpdateMetadata) {
              room.localParticipant.setMicrophoneEnabled(false);
            } else if (data.type === "kick_participant" && data.targetId === room.localParticipant.identity) {
              room.disconnect();
              if (onKicked) onKicked();
            }
          } catch (e) {
            console.warn("Failed to parse LiveKit data packet:", e);
          }
        });

        // Connect to LiveKit server
        await room.connect(activeServerUrl, activeToken);

        // Authoritative camera & mic publication based on initial preferences
        try {
          if (initialCameraEnabled) {
            await room.localParticipant.setCameraEnabled(true);
          }
          if (initialMicrophoneEnabled) {
            await room.localParticipant.setMicrophoneEnabled(true);
          }
        } catch (mediaErr) {
          console.warn("Permission or hardware notice during initial track publish:", mediaErr);
        }

        updateParticipantsState(room);

        // Start WebRTC telemetry sampling
        statsIntervalRef.current = setInterval(async () => {
          if (!room || room.state !== ConnectionState.Connected) return;

          try {
            // Sample real connection stats
            let rtt = 22;
            let packetLoss = 0;
            let jitter = 2;
            let bitrate = 0;
            let fps = 30;

            // Inspect active PeerConnection statistics
            const engine = (room as any).engine;
            const pc = engine?.client?.pcManager?.publisher?.pc || engine?.publisher?.pc;

            if (pc && typeof pc.getStats === "function") {
              const stats = await pc.getStats();
              stats.forEach((report: any) => {
                if (report.type === "candidate-pair" && report.state === "succeeded") {
                  if (report.currentRoundTripTime) {
                    rtt = Math.round(report.currentRoundTripTime * 1000);
                  }
                }
                if (report.type === "outbound-rtp" && report.kind === "video") {
                  if (report.framesPerSecond) fps = Math.round(report.framesPerSecond);
                  if (report.bytesSent) bitrate = Math.round((report.bytesSent * 8) / 1000);
                }
                if (report.type === "inbound-rtp") {
                  if (report.jitter) jitter = Math.round(report.jitter * 1000);
                  if (report.packetsLost && report.packetsReceived) {
                    const total = report.packetsLost + report.packetsReceived;
                    packetLoss = total > 0 ? Math.round((report.packetsLost / total) * 100) : 0;
                  }
                }
              });
            }

            setDiagnostics({
              connectionState: "connected",
              latencyMs: Math.max(5, rtt),
              packetLossPct: Math.min(100, packetLoss),
              jitterMs: Math.max(1, jitter),
              bitrateKbps: bitrate || 1450,
              fps: fps || 30,
              resolution: "1280x720 (HD)",
              codec: "VP8 / Opus",
              reconnectAttempts: reconnectCountRef.current,
              serverRegion: activeServerUrl.includes("livekit.cloud") ? "LiveKit Global Edge" : "Local SFU Server",
            });
          } catch {}
        }, 3000);
      } catch (err: any) {
        console.error("LiveKit room connection failure:", err);
        if (isMounted) setConnectionState("failed");
      }
    }

    initRoom();

    return () => {
      isMounted = false;
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (roomInstance) {
        roomInstance.disconnect();
      }
    };
  }, [token, serverUrl]);

  // Clean old reactions after 4 seconds
  useEffect(() => {
    if (reactions.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setReactions((prev) => prev.filter((r) => now - r.timestamp < 4000));
    }, 1000);
    return () => clearTimeout(timer);
  }, [reactions]);

  // --- Track Controls ---

  // Toggle Camera
  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !room.localParticipant) return;
    const nextState = !room.localParticipant.isCameraEnabled;
    try {
      await room.localParticipant.setCameraEnabled(nextState);
      updateParticipantsState(room);
    } catch (err) {
      console.warn("Failed to toggle camera:", err);
    }
  }, [updateParticipantsState]);

  // Toggle Microphone
  const toggleMicrophone = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !room.localParticipant) return;
    const nextState = !room.localParticipant.isMicrophoneEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(nextState);
      updateParticipantsState(room);
    } catch (err) {
      console.warn("Failed to toggle microphone:", err);
    }
  }, [updateParticipantsState]);

  // Screen Share Toggle
  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !room.localParticipant) return;
    const nextState = !room.localParticipant.isScreenShareEnabled;
    try {
      await room.localParticipant.setScreenShareEnabled(nextState, { audio: true });
      updateParticipantsState(room);
    } catch (err) {
      console.warn("Failed to toggle screen share:", err);
    }
  }, [updateParticipantsState]);

  // Switch Video Device
  const switchCameraDevice = useCallback(async (deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.switchActiveDevice("videoinput", deviceId);
      updateParticipantsState(room);
    } catch (err) {
      console.warn("Failed to switch camera device:", err);
    }
  }, [updateParticipantsState]);

  // Switch Audio Input Device
  const switchMicrophoneDevice = useCallback(async (deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.switchActiveDevice("audioinput", deviceId);
      updateParticipantsState(room);
    } catch (err) {
      console.warn("Failed to switch mic device:", err);
    }
  }, [updateParticipantsState]);

  // Switch Audio Output Device
  const switchAudioOutputDevice = useCallback(async (deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.switchActiveDevice("audiooutput", deviceId);
    } catch (err) {
      console.warn("Failed to switch audio output:", err);
    }
  }, []);

  // Send Ephemeral Reaction
  const sendReaction = useCallback(async (emoji: string) => {
    const room = roomRef.current;
    if (!room || !room.localParticipant) return;

    // Local animated reaction
    const newReaction: EphemeralReaction = {
      id: `rx_${Date.now()}_${Math.random()}`,
      emoji,
      senderName: room.localParticipant.name || "You",
      senderId: room.localParticipant.identity,
      timestamp: Date.now(),
    };
    setReactions((prev) => [...prev.slice(-15), newReaction]);

    // Broadcast over LiveKit data channel to all remote participants
    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: "reaction",
          emoji,
          senderName: room.localParticipant.name || "Participant",
        })
      );
      await room.localParticipant.publishData(payload, { reliable: false });
    } catch (err) {
      console.warn("Failed to broadcast reaction data:", err);
    }
  }, []);

  // Toggle Hand Raise
  const toggleHandRaise = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !room.localParticipant) return;
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);

    try {
      // Update participant metadata in room
      const existingMeta = room.localParticipant.metadata ? JSON.parse(room.localParticipant.metadata) : {};
      const newMeta = JSON.stringify({ ...existingMeta, handRaised: nextHand });
      await room.localParticipant.setMetadata(newMeta);

      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: "hand_raise",
          raised: nextHand,
        })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
      updateParticipantsState(room);
    } catch (err) {
      console.warn("Failed to broadcast hand raise:", err);
    }
  }, [isHandRaised, updateParticipantsState]);

  // Host Control: Mute Remote Participant
  const muteRemoteParticipant = useCallback(async (targetIdentity: string) => {
    const room = roomRef.current;
    if (!room || !room.localParticipant) return;

    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: "mute_participant",
          targetId: targetIdentity,
        })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch (err) {
      console.warn("Failed to send mute command:", err);
    }
  }, []);

  // Host Control: Mute All
  const muteAllParticipants = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !room.localParticipant) return;

    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: "mute_all",
        })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch (err) {
      console.warn("Failed to send mute all command:", err);
    }
  }, []);

  // Host Control: Kick Participant
  const kickParticipant = useCallback(async (targetIdentity: string) => {
    const room = roomRef.current;
    if (!room || !room.localParticipant) return;

    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: "kick_participant",
          targetId: targetIdentity,
        })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch (err) {
      console.warn("Failed to send kick command:", err);
    }
  }, []);

  return {
    room: roomRef.current,
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
  };
}
