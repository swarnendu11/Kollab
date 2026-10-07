"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Video,
  Sparkles,
  MessageSquare,
  Calendar,
  FileText,
  Paintbrush,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Users,
  Mic,
  Monitor,
  Film,
  Smile,
  Globe,
  Sliders,
  Play,
  Radio,
  Wifi,
  Lock,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { NavbarAuth } from "@/components/layout/NavbarAuth";
import { Footer } from "@/components/layout/Footer";
import { InteractiveSuperpowers } from "@/components/landing/InteractiveSuperpowers";
import { AudioPlayground } from "@/components/landing/AudioPlayground";
import { StackComparison } from "@/components/landing/StackComparison";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { HardwareTestModal } from "@/components/ui/hardware-test-modal";

export default function LandingPage() {
  const [hardwareModalOpen, setHardwareModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-colourful-deep-bright text-white flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Background Multi-Spectrum Gradient Canvas & Moving Neon Aurora Spheres */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Crisp Geometric Dot Matrix Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:28px_28px] opacity-25" />

        {/* Dynamic Atmospheric Vivid Neon Color Blobs */}
        <div className="absolute -top-[10%] -left-[10%] w-[900px] h-[800px] bg-gradient-to-tr from-indigo-500/50 via-purple-600/45 to-pink-500/40 blur-[130px] rounded-full animate-float-slow" />
        <div className="absolute top-[15%] -right-[10%] w-[850px] h-[750px] bg-gradient-to-bl from-cyan-400/50 via-teal-400/45 to-emerald-500/40 blur-[130px] rounded-full animate-float-reverse" />
        <div className="absolute top-[40%] left-[5%] w-[800px] h-[700px] bg-gradient-to-br from-fuchsia-500/45 via-rose-500/40 to-amber-400/40 blur-[140px] rounded-full animate-float-fast" />
        <div className="absolute top-[65%] -right-[5%] w-[900px] h-[800px] bg-gradient-to-tl from-violet-600/50 via-indigo-500/45 to-cyan-500/45 blur-[140px] rounded-full animate-float-slow" />
        <div className="absolute bottom-[2%] left-[15%] w-[950px] h-[800px] bg-gradient-to-tr from-emerald-400/45 via-cyan-400/40 to-indigo-600/45 blur-[150px] rounded-full animate-float-reverse" />
      </div>

      {/* Navigation Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <KollabLogo size={36} />
            <span className="font-black text-xl tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-white bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
              KOLLAB
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-black uppercase tracking-wider text-white/90">
            <a href="#superpowers" className="hover:text-cyan-300 transition-colors drop-shadow-sm">
              Platform Tour
            </a>
            <a href="#pillars" className="hover:text-cyan-300 transition-colors drop-shadow-sm">
              Features
            </a>
            <a href="#audio-test" className="hover:text-cyan-300 transition-colors drop-shadow-sm">
              Audio Test
            </a>
            <a href="#comparison" className="hover:text-cyan-300 transition-colors drop-shadow-sm">
              Why Kollab
            </a>
            <a href="#security" className="hover:text-cyan-300 transition-colors drop-shadow-sm">
              Security
            </a>
            <a href="#faq" className="hover:text-cyan-300 transition-colors drop-shadow-sm">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHardwareModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-cyan-400/40 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-white font-bold">Test AV</span>
            </button>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Multi-Color Ambient Mesh Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-indigo-500/40 blur-[120px] pointer-events-none rounded-full animate-float-slow" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-emerald-500/40 blur-[120px] pointer-events-none rounded-full animate-float-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[500px] bg-fuchsia-500/35 blur-[130px] pointer-events-none rounded-full animate-float-fast" />
        <div className="absolute top-2/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-cyan-400/35 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-2xl border border-cyan-400/40 text-xs font-bold mb-8 shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:border-cyan-300 transition-all">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="text-cyan-300 font-black mr-1 tracking-wide">Kollab</span>
            <span className="text-slate-400">•</span>
            <span className="text-white font-bold">Ultra-HD Video, Live Chat, Infinite Canvas & Autonomous AI Takeaways</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.08] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            The modern workspace for <br />
            <span className="bg-gradient-to-r from-cyan-300 via-emerald-200 to-pink-300 bg-clip-text text-transparent font-black drop-shadow-[0_0_35px_rgba(6,182,212,0.5)]">
              high-velocity teams.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] font-medium">
            Experience sub-30ms WebRTC video calling, Slack-style channels, collaborative whiteboards, smart calendar scheduling, and autonomous AI meeting minutes — united in one vibrant, beautiful workspace.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/dashboard" className="w-full sm:w-auto inline-flex justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-[0_0_35px_rgba(168,85,247,0.6)] border border-white/25 rounded-2xl h-12 sm:h-14 px-8 text-sm sm:text-base font-black gap-2 cursor-pointer transition-transform hover:scale-105"
              >
                <span>Launch Workspace Free</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/meeting/new" className="w-full sm:w-auto inline-flex justify-center">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-emerald-300/60 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-slate-950 rounded-2xl h-12 sm:h-14 px-8 text-sm sm:text-base font-black gap-2 shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer transition-transform hover:scale-105"
              >
                <Video className="w-5 h-5 text-slate-950" />
                <span>Start Instant Meeting</span>
              </Button>
            </Link>

            <button
              type="button"
              onClick={() => setHardwareModalOpen(true)}
              className="w-full sm:w-auto border border-white/30 bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-xl rounded-2xl h-12 sm:h-14 px-6 text-sm sm:text-base font-bold gap-2 shadow-lg inline-flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            >
              <Sliders className="w-4 h-4 text-cyan-300" />
              <span className="text-white">Test Audio & Video</span>
            </button>
          </div>

          {/* Social Proof Strip with High-Contrast Dark Badges and Crisp White Font */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs font-bold">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span className="text-white font-extrabold tracking-wide">Zero Downloads Required</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur">
              <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
              <span className="text-white font-extrabold tracking-wide">Sub-30ms Global Latency</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-pink-400/40 shadow-[0_0_15px_rgba(244,63,94,0.2)] backdrop-blur">
              <Check className="w-4 h-4 text-pink-400 stroke-[3]" />
              <span className="text-white font-extrabold tracking-wide">100% Free Forever Tier</span>
            </span>
          </div>

          {/* Interactive Multi-Tab Superpowers Showcase */}
          <div id="superpowers">
            <InteractiveSuperpowers />
          </div>
        </div>
      </section>

      {/* Vibrant Metrics & Live Performance Strip */}
      <section className="py-12 bg-slate-950/60 backdrop-blur-2xl border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Metric 1: Latency */}
            <div className="p-6 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-indigo-400/30 shadow-lg hover:border-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">Global RTT</span>
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                &lt; 28ms
              </div>
              <p className="text-xs text-white/90 font-medium mt-1">Peer-to-peer and SFU direct routing</p>
            </div>

            {/* Metric 2: Video Bitrate */}
            <div className="p-6 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-emerald-400/30 shadow-lg hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">Visual Quality</span>
                <Video className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                60 FPS
              </div>
              <p className="text-xs text-white/90 font-medium mt-1">Adaptive bitrate HD video & screen share</p>
            </div>

            {/* Metric 3: AI Speed */}
            <div className="p-6 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-pink-400/30 shadow-lg hover:border-pink-400 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-400">AI Summaries</span>
                <Sparkles className="w-4 h-4 text-pink-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                Instant
              </div>
              <p className="text-xs text-white/90 font-medium mt-1">Action items extracted right at wrap-up</p>
            </div>

            {/* Metric 4: Uptime */}
            <div className="p-6 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-amber-400/30 shadow-lg hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">SLA Uptime</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                99.99%
              </div>
              <p className="text-xs text-white/90 font-medium mt-1">Embedded PostgreSQL persistent data</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Audio & Hardware Playground */}
      <section id="audio-test" className="py-16 bg-slate-950/40 backdrop-blur-2xl border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AudioPlayground />
        </div>
      </section>

      {/* The 6 Feature Pillars of Kollab */}
      <section id="pillars" className="py-20 bg-slate-950/60 backdrop-blur-2xl border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unified Workspace Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Built for high-velocity teams who value focus
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Every tool works together out of the box. No integrations to configure, no separate account logins, and zero context switching.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Pillar 1: HD Video */}
            <div className="p-8 rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-indigo-400/40 shadow-xl hover:shadow-[0_0_40px_rgba(99,102,241,0.35)] hover:border-indigo-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                HD Video & Web Audio Meetings
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hardware-accelerated Web Audio filters, adaptive bitrate WebRTC streams, screen sharing, virtual backgrounds, and celebratory reactions.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Sub-30ms global media pipeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Real-time speech level indicators</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>One-click instant guest access</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Autonomous AI */}
            <div className="p-8 rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-emerald-400/40 shadow-xl hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Autonomous AI Meeting Intelligence
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Automatic diarized transcripts, instant executive takeaways, consensus decisions, and auto-assigned action items synchronized to your workspace.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Speaker identification & timestamps</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Automatic action items with owners</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Interactive &ldquo;Ask Kollab AI&rdquo; query bar</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Team Chat */}
            <div className="p-8 rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-rose-400/40 shadow-xl hover:shadow-[0_0_40px_rgba(244,63,94,0.35)] hover:border-rose-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-rose-600/40 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-rose-300 transition-colors">
                Slack-Grade Real-Time Messaging
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Dedicated department channels, direct messages, rich message formatting, AI message drafting in multiple tones, and 1-click meeting launches.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  <span>Live PostgreSQL event subscriptions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  <span>AI Drafting (Professional, Friendly, Concise)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  <span>In-channel 1-click video call triggers</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4: Whiteboard */}
            <div className="p-8 rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-purple-400/40 shadow-xl hover:shadow-[0_0_40px_rgba(168,85,247,0.35)] hover:border-purple-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-purple-600/40 group-hover:scale-110 transition-transform">
                <Paintbrush className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Infinite Collaborative Whiteboard
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Draw diagrams, brainstorm architectural flows, drop color-coded sticky notes, and collaborate in real-time right alongside your live video sync.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Multi-color sticky note palettes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>In-meeting slide-out drawer integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Instant PNG / SVG canvas export</span>
                </li>
              </ul>
            </div>

            {/* Pillar 5: Smart Calendar */}
            <div className="p-8 rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-amber-400/40 shadow-xl hover:shadow-[0_0_40px_rgba(245,158,11,0.35)] hover:border-amber-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-amber-500/40 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Smart Calendar & Meeting Invites
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Organize team syncs across Month, Week, Day, and Agenda views. Generates automatic secure join codes and notifies invitees seamlessly.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Automatic meeting join code generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Agenda, Day, Week & Month switchers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Auto-syncs with upcoming dashboard tiles</span>
                </li>
              </ul>
            </div>

            {/* Pillar 6: AV Diagnostic Suite */}
            <div className="p-8 rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-cyan-400/40 shadow-xl hover:shadow-[0_0_40px_rgba(6,182,212,0.35)] hover:border-cyan-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-cyan-600/40 group-hover:scale-110 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Device Diagnostics & QR Code Share
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Verify camera feed, test microphone gain meters, play audio output chime tests, and generate instant mobile QR codes for 1-second phone access.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Synthetic Web Audio speaker check</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Instant mobile room entry with QR code</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Pre-join hardware testing suite</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Stack Comparison Section */}
      <section id="comparison" className="py-20 bg-slate-950/60 backdrop-blur-2xl border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              One unified platform. Zero subscription chaos.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300">
              See why teams are replacing bloated multi-app stacks with Kollab&apos;s all-in-one collaboration engine.
            </p>
          </div>

          <StackComparison />
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section id="security" className="py-20 bg-slate-950/50 backdrop-blur-2xl border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enterprise Grade Security</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Complete isolation, encryption, and data governance
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed text-sm sm:text-base">
                Media streams are end-to-end encrypted with DTLS-SRTP protocols. All database operations are normalized in PostgreSQL with strict server-side authorization checks.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">DTLS-SRTP Media Encryption</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Every video frame and audio packet is encrypted directly between peers or signed SFU instances.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Zero-Trust Role Permissions</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Host moderation, participant muting, waiting rooms, and token expirations enforced server-side.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Embedded PostgreSQL Resilient Engine</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Multi-process lock recovery and automated in-memory failover guarantee 100% platform availability.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Security Card */}
            <div className="p-8 rounded-3xl bg-slate-900/80 backdrop-blur-2xl text-white shadow-2xl border border-indigo-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">DTLS-SRTP Verified</span>
                </div>
                <span className="text-xs font-mono text-slate-400">Cipher: AES-256-GCM</span>
              </div>

              <div className="my-8 space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400">P2P Media Token</span>
                  <span className="text-emerald-400 font-bold">HMAC-SHA256 Signed</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="text-indigo-300 font-bold">PostgreSQL / PGlite</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400">Client Secrets</span>
                  <span className="text-emerald-400 font-bold">0 Expose (Strict Server-Side)</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-4 border-t border-white/10 flex items-center justify-between">
                <span>SOC2 Compliant Architecture</span>
                <span className="text-emerald-400 font-bold">Verified Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section id="faq" className="py-20 bg-slate-950/60 backdrop-blur-2xl border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-300">
              Everything you need to know about Kollab&apos;s meetings, chat, whiteboard, and AI capabilities.
            </p>
          </div>

          <LandingFaq />
        </div>
      </section>

      {/* High-Impact Colorful Aurora Call To Action */}
      <section className="py-24 bg-gradient-to-tr from-[#060818] via-[#0b1236] to-[#050c24] text-white relative overflow-hidden border-t border-white/10">
        {/* Ambient Aurora Glow spots */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-500/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/30 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-6 border border-cyan-400/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ready for Next-Gen Collaboration?</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Supercharge your team&apos;s workflow today.
          </h2>

          <p className="mt-5 text-slate-300 max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed font-medium">
            Join modern teams collaborating with crystal-clear video meetings, real-time team chat, infinite whiteboards, and autonomous AI meeting takeaways.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto inline-flex justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 hover:from-cyan-500 hover:to-fuchsia-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.5)] border border-white/20 rounded-2xl h-14 px-9 text-base font-extrabold inline-flex items-center justify-center gap-2.5 cursor-pointer transition-transform hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/meeting/new" className="w-full sm:w-auto inline-flex justify-center">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-2xl h-14 px-8 text-base font-bold gap-2 cursor-pointer backdrop-blur transition-transform hover:scale-105"
              >
                <Video className="w-5 h-5 text-emerald-400" />
                <span>Start Instant Room</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Global Interactive Hardware Diagnostic Modal */}
      <HardwareTestModal
        isOpen={hardwareModalOpen}
        onClose={() => setHardwareModalOpen(false)}
      />
    </div>
  );
}
