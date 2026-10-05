"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  Plus,
  Send,
  Sparkles,
  Smile,
  Paperclip,
  Video,
  Search,
  Users,
  MoreVertical,
  CornerDownRight,
  Check,
  Loader2,
  Wand2,
} from "lucide-react";

export default function ChatPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannelId, setActiveChannelId] = useState("channel_general");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);

  // AI Drafting & Catch Up modal states
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiTone, setAiTone] = useState<"professional" | "friendly" | "concise" | "detailed">("professional");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);

  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const [catchUpSummary, setCatchUpSummary] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load channels and contacts
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        if (d.channels && d.channels.length > 0) {
          setChannels(d.channels);
        }
      })
      .catch(() => {});

    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => {
        if (d.contacts) setContacts(d.contacts);
      })
      .catch(() => {});
  }, []);

  // Load and live-poll messages for active channel in real-time
  useEffect(() => {
    setLoadingMessages(true);
    const fetchMessages = (isPolling = false) => {
      fetch(`/api/chat/${activeChannelId}/messages`)
        .then((r) => r.json())
        .then((d) => {
          if (d.messages) setMessages(d.messages);
          if (!isPolling) setLoadingMessages(false);
        })
        .catch(() => {
          if (!isPolling) setLoadingMessages(false);
        });
    };

    fetchMessages(false);
    const pollInterval = setInterval(() => fetchMessages(true), 2500);

    return () => clearInterval(pollInterval);
  }, [activeChannelId]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0] || { id: activeChannelId || "channel_general", name: "general" };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    try {
      const res = await fetch(`/api/chat/${activeChannelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (e) {
      console.error(e);
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
    } catch {
      //
    } finally {
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
        {/* Left: Channels & DMs List (Hidden on mobile unless toggled) */}
        <div className={`w-64 border-r border-slate-200/80 bg-slate-50/60 flex flex-col justify-between shrink-0 ${mobileChannelsOpen ? "flex fixed inset-y-0 left-0 z-40 bg-white w-72 shadow-2xl" : "hidden md:flex"}`}>
          <div>
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">Channels</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCatchUp}
                  className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 h-7 rounded-lg border border-emerald-200/60 transition-colors shrink-0"
                  title="Catch up with AI"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Catch up</span>
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

            <div className="p-2 space-y-1">
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

          {/* Direct Messages Quick View */}
          <div className="p-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              <span>Direct Messages</span>
              <Link href="/contacts" className="text-emerald-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-1">
              {contacts.length === 0 ? (
                <Link
                  href="/contacts"
                  className="block p-2 rounded-lg text-xs text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 text-center border border-dashed border-slate-200"
                >
                  + Add Contacts
                </Link>
              ) : (
                contacts.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{c.contactName}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Message Stream */}
        <div className="flex-1 flex flex-col justify-between min-w-0 bg-white">
          {/* Channel Header */}
          <div className="h-14 px-3 sm:px-6 border-b border-slate-200 flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMobileChannelsOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
                title="Switch channel"
              >
                <Hash className="w-4 h-4 text-emerald-600" />
              </button>
              <Hash className="hidden md:inline-block w-5 h-5 text-slate-400 shrink-0" />
              <h2 className="font-bold text-sm text-slate-900 truncate">{activeChannel.name}</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live synced</span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/meeting/new" className="inline-flex shrink-0">
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold gap-1.5 shadow-none border border-emerald-200/60 inline-flex items-center justify-center"
                >
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Start Call in Channel</span>
                  <span className="sm:hidden">Call</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No messages in #{activeChannel.name} yet. Send the first message below!
              </div>
            ) : (
              messages.map((m) => (
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
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                      {m.messageText}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box with AI Draft Button */}
          <div className="p-4 border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Message #{activeChannel.name}</span>
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
                  placeholder={`Write your message in #${activeChannel.name}...`}
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
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                What would you like to say?
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Ask David for the WebRTC latency benchmark results and suggest syncing tomorrow"
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tone of Voice</label>
              <div className="grid grid-cols-4 gap-2">
                {(["professional", "friendly", "concise", "detailed"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAiTone(t)}
                    className={`py-1.5 rounded-xl text-xs font-medium capitalize border transition-all ${
                      aiTone === t
                        ? "bg-[#10B981] text-white border-transparent shadow-xs shadow-emerald-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleDraftWithAI}
              disabled={draftLoading || !draftPrompt.trim()}
              className="w-full h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              {draftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span>Generate Draft</span>
            </Button>
          </div>
        </div>
      )}

      {/* Catch Up Modal */}
      {catchUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Catch up with AI</h3>
              </div>
              <button onClick={() => setCatchUpOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {catchUpSummary || "Analyzing workspace chat history..."}
            </div>

            <Button
              onClick={() => setCatchUpOpen(false)}
              className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
