"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Hash,
  Plus,
  Send,
  Sparkles,
  Video,
  Search,
  Users,
  CornerDownRight,
  Check,
  Loader2,
  Wand2,
  Trash2,
  X,
  MessageSquare,
  Calendar,
  Smile,
} from "lucide-react";
import { useRealtime } from "@/lib/use-realtime";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        </AppShell>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [channels, setChannels] = useState<any[]>([]);
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [activeChannelId, setActiveChannelId] = useState("channel_general");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);

  // Message Reply State
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  // New Channel Modal
  const [newChannelModalOpen, setNewChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);

  // AI Drafting & Catch Up modal states
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiTone, setAiTone] = useState<"professional" | "friendly" | "concise" | "detailed">("professional");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);

  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const [catchUpSummary, setCatchUpSummary] = useState<string | null>(null);

  // Schedule Modal from Chat
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load channels, direct messages, and contacts
  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/chat");
      const d = await res.json();
      if (d.channels) setChannels(d.channels);
      if (d.directMessages) setDirectMessages(d.directMessages);
    } catch {}

    try {
      const res = await fetch("/api/contacts");
      const d = await res.json();
      if (d.contacts) setContacts(d.contacts);
    } catch {}
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Handle URL query parameters (?channel=... or ?dm=...)
  useEffect(() => {
    const channelParam = searchParams.get("channel");
    const dmParam = searchParams.get("dm");

    if (channelParam) {
      setActiveChannelId(channelParam);
    } else if (dmParam) {
      // Find or create direct room for this recipient user
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDirect: true, recipientId: dmParam }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.channel?.id) {
            setActiveChannelId(d.channel.id);
            fetchRooms();
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  // Load messages initially on channel switch
  useEffect(() => {
    setLoadingMessages(true);
    setReplyingTo(null);
    fetch(`/api/chat/${activeChannelId}/messages`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) setMessages(d.messages);
        setLoadingMessages(false);
      })
      .catch(() => {
        setLoadingMessages(false);
      });
  }, [activeChannelId]);

  // Real-time SSE subscription
  useRealtime({
    channelId: activeChannelId,
    onEvent: (event) => {
      if (event.type === "message.created") {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.payload.message.id)) return prev;
          return [...prev, event.payload.message];
        });
      } else if (event.type === "message.updated") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.payload.messageId
              ? { ...m, messageText: event.payload.messageText, updatedAt: event.payload.updatedAt }
              : m
          )
        );
      } else if (event.type === "message.deleted") {
        setMessages((prev) => prev.filter((m) => m.id !== event.payload.messageId));
      } else if (event.type === "reaction.created" || event.type === "reaction.deleted") {
        fetch(`/api/chat/${activeChannelId}/messages`)
          .then((r) => r.json())
          .then((d) => {
            if (d.messages) setMessages(d.messages);
          });
      } else if (event.type === "channel.created") {
        fetchRooms();
      }
    },
  });

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/chat/${activeChannelId}/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch {}
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/chat/${activeChannelId}/messages?messageId=${messageId}`, {
        method: "DELETE",
      });
    } catch {}
  };

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Active room metadata
  const activeChannel =
    channels.find((c) => c.id === activeChannelId) ||
    directMessages.find((dm) => dm.id === activeChannelId) ||
    { id: activeChannelId, name: activeChannelId.replace("channel_", "").replace("dm_", "direct-chat") };

  const isDirectRoom = activeChannelId.startsWith("dm_") || Boolean(activeChannel.isDirect);

  // Send message (supporting replies)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    const parentId = replyingTo?.id || null;

    setInputText("");
    setReplyingTo(null);

    try {
      const res = await fetch(`/api/chat/${activeChannelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          parentMessageId: parentId,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Switch or create DM room with a contact
  const handleOpenDmWithContact = async (contact: any) => {
    setMobileChannelsOpen(false);
    if (contact.contactUserId) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isDirect: true,
            recipientId: contact.contactUserId,
            name: contact.contactName,
          }),
        });
        const data = await res.json();
        if (data.channel?.id) {
          setActiveChannelId(data.channel.id);
          fetchRooms();
          return;
        }
      } catch {}
    }
  };

  // Create new channel
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    setCreatingChannel(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName.trim() }),
      });
      const data = await res.json();
      if (data.channel?.id) {
        setChannels((prev) => [...prev, data.channel]);
        setActiveChannelId(data.channel.id);
        setNewChannelModalOpen(false);
        setNewChannelName("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingChannel(false);
    }
  };

  // Start Instant Video Call in this room
  const handleStartRoomCall = async () => {
    try {
      const roomTitle = isDirectRoom
        ? `Call in ${activeChannel.recipientName || activeChannel.name}`
        : `Meeting in #${activeChannel.name}`;

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: roomTitle,
          isInstant: true,
        }),
      });
      const data = await res.json();
      if (data.meeting?.id) {
        // Send meeting join link into the chat
        fetch(`/api/chat/${activeChannelId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `📞 Started a live video call! Join here: /meeting/${data.meeting.id}/prejoin (Join Code: ${data.meeting.joinCode})`,
          }),
        });

        router.push(`/meeting/${data.meeting.id}/prejoin`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Schedule meeting for room
  const handleScheduleForRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    setSchedulingMeeting(true);
    try {
      const startTime = new Date(`${meetingDate}T${meetingTime}:00`);
      const endTime = new Date(startTime.getTime() + parseInt(meetingDuration) * 60000);

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle.trim(),
          description: `Scheduled meeting for ${activeChannel.name}`,
          scheduledStart: startTime,
          scheduledEnd: endTime,
        }),
      });
      const data = await res.json();

      await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle.trim(),
          description: `Meeting in ${activeChannel.name}`,
          startTime,
          endTime,
          meetingId: data.meeting?.id,
        }),
      });

      // Post in chat
      fetch(`/api/chat/${activeChannelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📅 Scheduled meeting "${meetingTitle}" for ${new Date(startTime).toLocaleString()}. Join Code: ${data.meeting?.joinCode}`,
        }),
      });

      setScheduleModalOpen(false);
      setMeetingTitle("");
    } catch (e) {
      console.error(e);
    } finally {
      setSchedulingMeeting(false);
    }
  };

  // Draft with AI
  const handleDraftWithAI = async () => {
    if (!draftPrompt.trim()) return;
    setDraftLoading(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: draftPrompt,
          mode: "draft",
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (data.response) {
        setInputText(data.response);
        setAiDraftOpen(false);
        setDraftPrompt("");
      }
    } catch {} finally {
      setDraftLoading(false);
    }
  };

  // Catch up with AI
  const handleCatchUp = async () => {
    setCatchUpOpen(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Catch up with unread messages and highlight decisions",
          mode: "query",
        }),
      });
      const data = await res.json();
      setCatchUpSummary(data.response || "You are caught up on all messages!");
    } catch {
      setCatchUpSummary("Failed to fetch message summary.");
    }
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200/80 shadow-md flex overflow-hidden">
        {/* Left: Channels & DMs List */}
        <div
          className={`w-64 border-r border-slate-200/80 bg-slate-50/70 flex flex-col justify-between shrink-0 ${
            mobileChannelsOpen ? "flex fixed inset-y-0 left-0 z-40 bg-white w-72 shadow-2xl" : "hidden md:flex"
          }`}
        >
          <div className="flex-1 overflow-y-auto">
            {/* Header with Catch Up */}
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">Kollab Chat</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCatchUp}
                  className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 h-7 rounded-lg border border-emerald-200/60 transition-colors shrink-0"
                  title="Catch up with AI"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>AI Catch up</span>
                </button>
                {mobileChannelsOpen && (
                  <button
                    onClick={() => setMobileChannelsOpen(false)}
                    className="md:hidden text-xs text-slate-400 p-1 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Channels List */}
            <div className="p-3">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                <span>Channels</span>
                <button
                  onClick={() => setNewChannelModalOpen(true)}
                  className="text-slate-400 hover:text-emerald-600 p-0.5 rounded"
                  title="Create Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                {channels.map((c) => {
                  const isActive = c.id === activeChannelId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChannelId(c.id);
                        setMobileChannelsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                        isActive
                          ? "bg-[#10B981] text-white font-semibold shadow-xs shadow-emerald-500/20"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Hash className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Messages List */}
            <div className="p-3 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                <span>Direct Messages</span>
                <Link href="/contacts" className="text-emerald-600 hover:underline text-[11px]">
                  Find Users
                </Link>
              </div>

              <div className="space-y-1">
                {/* Active DM Rooms */}
                {directMessages.map((dm) => {
                  const isActive = dm.id === activeChannelId;
                  const displayName = dm.recipientName || dm.name;
                  return (
                    <button
                      key={dm.id}
                      onClick={() => {
                        setActiveChannelId(dm.id);
                        setMobileChannelsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left ${
                        isActive
                          ? "bg-[#10B981] text-white font-semibold shadow-xs shadow-emerald-500/20"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={dm.recipientAvatar} />
                          <AvatarFallback className="text-[10px]">{displayName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                      </div>
                      <span className="truncate">{displayName}</span>
                    </button>
                  );
                })}

                {/* Saved Contacts */}
                {contacts
                  .filter((c) => !directMessages.some((dm) => dm.id.includes(c.contactUserId)))
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleOpenDmWithContact(c)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 text-left transition-colors"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={c.contactAvatar} />
                          <AvatarFallback className="text-[10px]">{c.contactName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
                      </div>
                      <span className="truncate">{c.contactName}</span>
                    </button>
                  ))}

                {contacts.length === 0 && directMessages.length === 0 && (
                  <Link
                    href="/contacts"
                    className="block p-2 rounded-lg text-xs text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 text-center border border-dashed border-slate-200"
                  >
                    + Find contacts to message
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Message Stream */}
        <div className="flex-1 flex flex-col justify-between min-w-0 bg-white">
          {/* Channel Header */}
          <div className="h-14 px-3 sm:px-6 border-b border-slate-200 flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileChannelsOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
                title="Switch channel"
              >
                <Hash className="w-4 h-4 text-emerald-600" />
              </button>

              {isDirectRoom ? (
                <div className="relative shrink-0">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={activeChannel.recipientAvatar} />
                    <AvatarFallback>{(activeChannel.recipientName || activeChannel.name)[0]}</AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                </div>
              ) : (
                <Hash className="hidden md:inline-block w-5 h-5 text-slate-400 shrink-0" />
              )}

              <div className="min-w-0">
                <h2 className="font-bold text-sm text-slate-900 truncate">
                  {isDirectRoom ? activeChannel.recipientName || activeChannel.name : activeChannel.name}
                </h2>
                <p className="text-[10px] text-slate-400 truncate">
                  {isDirectRoom ? "Direct Conversation" : "Workspace Channel"}
                </p>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 font-medium ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live synced</span>
              </span>
            </div>

            {/* Quick Actions: Call & Schedule */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMeetingTitle(
                    isDirectRoom
                      ? `Meeting with ${activeChannel.recipientName || activeChannel.name}`
                      : `Meeting for #${activeChannel.name}`
                  );
                  setScheduleModalOpen(true);
                }}
                className="h-8 px-2.5 rounded-xl border-slate-200 text-slate-700 text-xs font-semibold gap-1.5 hover:bg-slate-50 inline-flex items-center"
                title="Schedule Meeting"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Schedule</span>
              </Button>

              <Button
                size="sm"
                onClick={handleStartRoomCall}
                className="h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold gap-1.5 shadow-none border border-emerald-200/60 inline-flex items-center justify-center"
              >
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Video Call</span>
                <span className="sm:hidden">Call</span>
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No messages in this conversation yet. Send the first message below!
              </div>
            ) : (
              messages.map((m) => {
                // Find parent message if this is a reply
                const parentMsg = m.parentMessageId
                  ? messages.find((p) => p.id === m.parentMessageId)
                  : null;

                return (
                  <div key={m.id} className="flex items-start gap-3 group">
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={m.senderAvatar} />
                      <AvatarFallback>{m.senderName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{m.senderName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Replied Parent Message Quote Preview */}
                      {m.parentMessageId && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-lg mt-1 mb-1 border-l-2 border-emerald-500 w-fit max-w-full">
                          <CornerDownRight className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-700">
                            {parentMsg ? parentMsg.senderName : "Replied message"}:
                          </span>
                          <span className="truncate max-w-[240px] text-slate-600">
                            {parentMsg ? parentMsg.messageText : "..."}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                        {m.messageText}
                      </p>

                      {/* Reactions display and quick action bar */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {m.reactions &&
                          m.reactions.length > 0 &&
                          m.reactions.map((r: any, ri: number) => (
                            <button
                              key={ri}
                              type="button"
                              onClick={() => handleToggleReaction(m.id, r.emoji)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 border border-slate-200/60 transition-colors"
                            >
                              <span>{r.emoji}</span>
                              <span className="font-semibold text-[10px]">{r.count}</span>
                            </button>
                          ))}

                        {/* Message Actions on Hover: Reply, Reactions, Delete */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => setReplyingTo(m)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Reply to message"
                          >
                            <CornerDownRight className="w-3 h-3 text-emerald-600" />
                            <span>Reply</span>
                          </button>

                          {["👍", "❤️", "🚀", "🎉"].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(m.id, emoji)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 text-xs transition-colors"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-1"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box with Reply Banner and AI Draft */}
          <div className="p-4 border-t border-slate-200">
            {/* Active Reply Banner */}
            {replyingTo && (
              <div className="mb-2 p-2 px-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-500">Replying to</span>
                  <span className="font-bold text-slate-900 truncate">{replyingTo.senderName}:</span>
                  <span className="text-slate-600 truncate max-w-xs">&quot;{replyingTo.messageText}&quot;</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Message {isDirectRoom ? activeChannel.recipientName || activeChannel.name : `#${activeChannel.name}`}
                </span>
                <button
                  type="button"
                  onClick={() => setAiDraftOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                >
                  <Wand2 className="w-3 h-3 text-emerald-600" />
                  <span>Draft with AI</span>
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                <input
                  type="text"
                  placeholder={
                    replyingTo
                      ? `Type your reply to ${replyingTo.senderName}...`
                      : `Write your message in ${
                          isDirectRoom ? activeChannel.recipientName || activeChannel.name : `#${activeChannel.name}`
                        }...`
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-transparent px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 py-1"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputText.trim()}
                  className="h-8 px-3.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs gap-1.5 shrink-0 shadow-sm shadow-emerald-500/20 inline-flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>Send</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      {newChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Create New Channel</h3>
              <button onClick={() => setNewChannelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateChannel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Name</label>
                <Input
                  placeholder="e.g. general, marketing, project-launch"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!newChannelName.trim() || creatingChannel}
                className="w-full h-9 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold"
              >
                {creatingChannel ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Create Channel
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal from Chat */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Schedule Meeting</h3>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleScheduleForRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={!meetingTitle.trim() || schedulingMeeting}
                className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                {schedulingMeeting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Schedule & Share in Chat
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* AI Draft Modal */}
      {aiDraftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Draft with Kollab AI</h3>
              </div>
              <button onClick={() => setAiDraftOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">What would you like to say?</label>
                <textarea
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  placeholder="e.g. Ask Marcus for the API credentials update by 3pm today..."
                  className="w-full h-24 p-3 rounded-2xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tone</label>
                <div className="flex gap-2">
                  {(["professional", "friendly", "concise", "detailed"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiTone(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition-all ${
                        aiTone === t
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setAiDraftOpen(false)} className="rounded-xl h-9">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDraftWithAI}
                  disabled={!draftPrompt.trim() || draftLoading}
                  className="rounded-xl h-9 bg-[#10B981] hover:bg-[#059669] text-white gap-1.5"
                >
                  {draftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>Generate Draft</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Catch Up Modal */}
      {catchUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">AI Catch Up Summary</h3>
              </div>
              <button onClick={() => setCatchUpOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed max-h-60 overflow-y-auto">
              {catchUpSummary ? (
                <div className="whitespace-pre-wrap">{catchUpSummary}</div>
              ) : (
                <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Summarizing unread workspace messages...</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setCatchUpOpen(false)} className="rounded-xl h-9 bg-emerald-600 text-white">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
