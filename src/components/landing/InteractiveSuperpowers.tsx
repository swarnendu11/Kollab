"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  Sparkles,
  MessageSquare,
  Paintbrush,
  Calendar,
  Mic,
  MicOff,
  VideoOff,
  CheckCircle2,
  Users,
  Send,
  Wand2,
  ArrowRight,
  Plus,
  Play,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function InteractiveSuperpowers() {
  const [activeTab, setActiveTab] = useState<"video" | "ai" | "whiteboard" | "chat">("video");

  // Video Tab State
  const [videoTimer, setVideoTimer] = useState(874); // 14:34
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [reactionBurst, setReactionBurst] = useState<string | null>(null);

  // AI Tab State
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({
    act_1: true,
  });

  // Whiteboard Tab State
  const [stickyColor, setStickyColor] = useState<string>("bg-amber-100 border-amber-300 text-amber-950");
  const [stickyNotes, setStickyNotes] = useState([
    { id: 1, text: "Optimize WebRTC adaptive bitrate for mobile clients 🚀", color: "bg-indigo-100 border-indigo-300 text-indigo-950" },
    { id: 2, text: "Standardize on 3-color palette (Indigo, Emerald, Coral) 🎨", color: "bg-emerald-100 border-emerald-300 text-emerald-950" },
    { id: 3, text: "PGlite persistent storage initialized with zero locks ⚡", color: "bg-rose-100 border-rose-300 text-rose-950" },
  ]);
  const [newStickyText, setNewStickyText] = useState("");

  // Chat Tab State
  const [chatChannel, setChatChannel] = useState("engineering");
  const [chatTone, setChatTone] = useState<"professional" | "friendly" | "concise">("professional");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, author: "Sarah Chen", role: "Design Lead", text: "New colorful landing page looks stunning! The live telemetry and audio diagnostic are huge.", time: "10:14 AM", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
    { id: 2, author: "Alex Rivera", role: "Host", text: "Sub-25ms WebRTC latency confirmed across US and EU nodes.", time: "10:16 AM", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" },
  ]);

  // Video timer ticking
  useEffect(() => {
    const timer = setInterval(() => setVideoTimer((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatVideoTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const triggerReaction = (emoji: string) => {
    setReactionBurst(emoji);
    setTimeout(() => setReactionBurst(null), 1400);
  };

  const handleAddSticky = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyText.trim()) return;
    setStickyNotes((prev) => [
      ...prev,
      { id: Date.now(), text: newStickyText.trim(), color: stickyColor },
    ]);
    setNewStickyText("");
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: "You (Demo)",
        role: "Workspace Host",
        text: chatInput.trim(),
        time: "Just now",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      },
    ]);
    setChatInput("");
  };

  const applyAiTone = (tone: "professional" | "friendly" | "concise") => {
    setChatTone(tone);
    if (tone === "professional") {
      setChatInput("Confirming that latency benchmarks and AI action items are verified for the release.");
    } else if (tone === "friendly") {
      setChatInput("Awesome job everyone! The new UI and sound effects are feeling super snappy 🎉");
    } else {
      setChatInput("WebRTC 60 FPS verified. Ready for launch.");
    }
  };

  return (
    <div className="mt-16 max-w-6xl mx-auto">
      {/* Superpowers Navigation Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
        <button
          onClick={() => setActiveTab("video")}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
            activeTab === "video"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 scale-105"
              : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
          }`}
        >
          <Video className={`w-4 h-4 ${activeTab === "video" ? "text-indigo-200" : "text-indigo-600"}`} />
          <span>HD Video Meetings</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
            activeTab === "ai"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-105"
              : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeTab === "ai" ? "text-emerald-200" : "text-emerald-600"}`} />
          <span>Autonomous AI Notes</span>
        </button>

        <button
          onClick={() => setActiveTab("whiteboard")}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
            activeTab === "whiteboard"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 scale-105"
              : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
          }`}
        >
          <Paintbrush className={`w-4 h-4 ${activeTab === "whiteboard" ? "text-purple-200" : "text-purple-600"}`} />
          <span>Infinite Whiteboard</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
            activeTab === "chat"
              ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/30 scale-105"
              : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${activeTab === "chat" ? "text-rose-200" : "text-rose-600"}`} />
          <span>Slack-Style Chat</span>
        </button>
      </div>

      {/* Main Interactive Display Container */}
      <div className="relative rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden min-h-[500px]">
        {/* Top Window Header */}
        <div className="h-12 bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs" />
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-1 rounded-lg border border-slate-200/80 text-xs font-mono font-semibold text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {activeTab === "video" && "kollab.io/meeting/klb-design-q4 • 60 FPS"}
              {activeTab === "ai" && "kollab.io/ai/meeting-intelligence • Live Diarization"}
              {activeTab === "whiteboard" && "kollab.io/whiteboard/wb-architecture • Multi-Cursor"}
              {activeTab === "chat" && "kollab.io/chat#engineering • Live Sync"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
            <span className="hidden sm:inline">LIVE DEMO</span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[10px] font-mono uppercase">
              Interactive
            </span>
          </div>
        </div>

        {/* TAB 1: VIDEO MEETINGS */}
        {activeTab === "video" && (
          <div className="p-6 sm:p-8 bg-[#091D17] text-white flex flex-col justify-between min-h-[460px] relative overflow-hidden animate-in fade-in duration-300">
            {/* Reaction particle floating */}
            {reactionBurst && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl animate-bounce z-40">
                {reactionBurst}
              </div>
            )}

            {/* Room Info Bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-emerald-900/60 gap-3">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-base sm:text-lg text-white">
                  Weekly Product Design Sync
                </span>
                <span className="text-xs bg-emerald-950 text-emerald-300 font-mono px-3 py-1 rounded-full border border-emerald-800 font-bold">
                  ⏱ {formatVideoTime(videoTimer)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-emerald-900/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-700/50 font-mono font-semibold">
                  WebRTC P2P • 16ms RTT
                </span>
                <span className="hidden sm:inline-block bg-indigo-950 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-800 font-mono font-semibold">
                  1,480 kbps • Opus Stereo
                </span>
              </div>
            </div>

            {/* Video Streams Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              {/* Tile 1: You */}
              <div className="relative aspect-video rounded-2xl bg-slate-900 border-2 border-emerald-400 overflow-hidden shadow-lg shadow-emerald-500/25">
                {camOn ? (
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"
                    alt="Meeting Host"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 text-xs">
                    <VideoOff className="w-6 h-6 mb-1 text-slate-600" />
                    <span>Camera Paused</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-[#091D17]/90 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-900">
                  {micOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-rose-400" />}
                  <span>Alex Rivera (You)</span>
                </div>
                {micOn && (
                  <span className="absolute top-2 right-2 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow-xs uppercase">
                    Speaking
                  </span>
                )}
              </div>

              {/* Tile 2 */}
              <div className="relative aspect-video rounded-2xl bg-slate-900 border border-emerald-950 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500"
                  alt="Sarah Chen"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-[#091D17]/90 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-900">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  <span>Sarah Chen • Design</span>
                </div>
              </div>

              {/* Tile 3 */}
              <div className="relative aspect-video rounded-2xl bg-slate-900 border border-emerald-950 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
                  alt="Marcus Vance"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-[#091D17]/90 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-900">
                  <Mic className="w-3 h-3 text-slate-400" />
                  <span>Marcus Vance • Eng</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-emerald-900/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    micOn ? "bg-emerald-900/80 hover:bg-emerald-800 text-white" : "bg-rose-600 text-white"
                  }`}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span>{micOn ? "Mute" : "Unmuted"}</span>
                </button>

                <button
                  onClick={() => setCamOn(!camOn)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    camOn ? "bg-emerald-900/80 hover:bg-emerald-800 text-white" : "bg-rose-600 text-white"
                  }`}
                >
                  {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span>{camOn ? "Stop Cam" : "Start Cam"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Reactions:</span>
                {(["🎉", "❤️", "🔥", "🚀"] as const).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => triggerReaction(emoji)}
                    className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-base flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <Link href="/dashboard">
                <Button className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold text-xs px-5 shadow-lg shadow-emerald-500/30">
                  Open Live Meeting Room
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* TAB 2: AUTONOMOUS AI INTELLIGENCE */}
        {activeTab === "ai" && (
          <div className="p-6 sm:p-8 bg-[#04160F] text-white min-h-[460px] flex flex-col justify-between animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Autonomous AI Takeaways & Diarization</h4>
                    <p className="text-xs text-emerald-300/70">Generated automatically as you speak with 99.4% speaker precision.</p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-800">
                  Model: Kollab Neural v2
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Executive Summary & Decisions */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/20">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Executive Meeting Summary</span>
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      The team ratified the new vibrant 3-color design system (Electric Indigo, Vivid Emerald, Sunset Coral) for Kollab 2.0. PGlite database persistence is operational across all workspaces with auto-recovering locks.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/20">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                      Key Consensus & Decisions
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Standardize on Web Audio synthetic audio diagnostic chimes for instant hardware checks.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Deploy in-meeting whiteboard drawer directly alongside HD video stream.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Extracted Action Items */}
                <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Extracted Action Items
                    </h5>
                    <span className="text-[10px] text-slate-400">Click to check off</span>
                  </div>

                  {[
                    { id: "act_1", task: "Deploy Web Audio speaker chime test into meeting rooms", owner: "David Kim", badge: "Engineering" },
                    { id: "act_2", task: "Add color palette swatches to collaborative whiteboard canvas", owner: "Sarah Chen", badge: "Design" },
                    { id: "act_3", task: "Audit PGlite database singleton against concurrent API writes", owner: "Alex Rivera", badge: "Architecture" },
                  ].map((act) => {
                    const isDone = !!checkedActions[act.id];
                    return (
                      <div
                        key={act.id}
                        onClick={() => setCheckedActions((prev) => ({ ...prev, [act.id]: !prev[act.id] }))}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isDone
                            ? "bg-emerald-950/40 border-emerald-500/40 opacity-80"
                            : "bg-white/5 border-white/10 hover:border-emerald-400/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${isDone ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold" : "border-slate-500"}`}>
                            {isDone && "✓"}
                          </div>
                          <span className={`text-xs ${isDone ? "line-through text-slate-400" : "text-white font-medium"}`}>
                            {act.task}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 shrink-0 font-mono">
                          {act.owner}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-400">
              <span>Automatic sync to Calendar, Chat & Documents</span>
              <Link href="/dashboard#ai-assistant" className="font-bold underline hover:text-white">
                Try Ask Kollab AI →
              </Link>
            </div>
          </div>
        )}

        {/* TAB 3: COLLABORATIVE WHITEBOARD */}
        {activeTab === "whiteboard" && (
          <div className="p-6 sm:p-8 bg-slate-50 min-h-[460px] flex flex-col justify-between animate-in fade-in duration-300">
            <div>
              {/* Whiteboard Toolbar */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Add Sticky Note:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { class: "bg-indigo-100 border-indigo-300 text-indigo-950", name: "Indigo" },
                      { class: "bg-emerald-100 border-emerald-300 text-emerald-950", name: "Emerald" },
                      { class: "bg-rose-100 border-rose-300 text-rose-950", name: "Coral" },
                      { class: "bg-amber-100 border-amber-300 text-amber-950", name: "Amber" },
                      { class: "bg-purple-100 border-purple-300 text-purple-950", name: "Violet" },
                    ].map((swatch) => (
                      <button
                        key={swatch.name}
                        type="button"
                        onClick={() => setStickyColor(swatch.class)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          stickyColor === swatch.class ? "scale-125 border-slate-900 shadow-xs" : "border-transparent hover:scale-110"
                        } ${swatch.class.split(" ")[0]}`}
                        title={swatch.name}
                      />
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddSticky} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type idea & hit enter..."
                    value={newStickyText}
                    onChange={(e) => setNewStickyText(e.target.value)}
                    className="h-9 px-3 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 outline-none w-48 sm:w-64"
                  />
                  <Button type="submit" size="sm" className="h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </Button>
                </form>
              </div>

              {/* Canvas Area */}
              <div className="h-64 sm:h-72 rounded-2xl bg-white border-2 border-dashed border-slate-300/80 p-6 relative overflow-hidden flex flex-wrap content-start gap-4 shadow-inner">
                {/* Floating sticky notes */}
                {stickyNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-2xl border shadow-sm max-w-xs text-xs font-semibold leading-relaxed animate-in fade-in zoom-in-95 duration-200 hover:-translate-y-1 transition-transform cursor-pointer ${note.color}`}
                  >
                    {note.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Multi-user real-time canvas • Auto-persisted to database</span>
              </span>
              <Link href="/whiteboards" className="font-bold text-purple-600 hover:underline">
                Open Full Whiteboard App →
              </Link>
            </div>
          </div>
        )}

        {/* TAB 4: SLACK-GRADE TEAM CHAT */}
        {activeTab === "chat" && (
          <div className="p-6 sm:p-8 bg-white min-h-[460px] flex flex-col justify-between animate-in fade-in duration-300">
            <div>
              {/* Channel Selector */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  {(["general", "engineering", "design", "product"] as const).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setChatChannel(ch)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors ${
                        chatChannel === ch
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      #{ch}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">2.5s Auto-sync</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="space-y-4 max-h-56 overflow-y-auto pr-2">
                {chatMessages.map((m) => (
                  <div key={m.id} className="flex items-start gap-3">
                    <img src={m.avatar} alt={m.author} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{m.author}</span>
                        <span className="text-[10px] text-slate-400">{m.role} • {m.time}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input with AI Tone drafting chips */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI Drafting Tones:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {(["professional", "friendly", "concise"] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => applyAiTone(tone)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize border transition-all ${
                        chatTone === tone
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendChat} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Send a message to #${chatChannel}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 h-11 px-4 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
                <Button type="submit" disabled={!chatInput.trim()} className="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
