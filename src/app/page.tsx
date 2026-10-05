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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-indigo-500/20 selection:text-indigo-700">
      {/* Navigation Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <KollabLogo size={36} />
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-emerald-600 to-rose-600 bg-clip-text text-transparent">
              KOLLAB
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#superpowers" className="hover:text-indigo-600 transition-colors">
              Platform Demo
            </a>
            <a href="#pillars" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#audio-test" className="hover:text-indigo-600 transition-colors">
              Audio Test
            </a>
            <a href="#comparison" className="hover:text-indigo-600 transition-colors">
              Why Kollab
            </a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">
              Security
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHardwareModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 h-9 rounded-xl border-slate-200 text-indigo-700 hover:bg-indigo-50/50 text-xs font-semibold"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test AV</span>
            </Button>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Multi-Color Ambient Mesh Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-indigo-500/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-emerald-500/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-rose-500/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-indigo-200/80 text-indigo-800 text-xs font-bold mb-8 shadow-xs hover:border-indigo-400 transition-all">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Kollab 2.0 • Ultra-HD Video, Live Chat, Infinite Canvas & Autonomous AI Takeaways</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.08]">
            The modern workspace for <br />
            <span className="bg-gradient-to-r from-indigo-600 via-emerald-500 to-rose-500 bg-clip-text text-transparent">
              high-velocity teams.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Experience sub-30ms WebRTC video calling, Slack-style channels, collaborative whiteboards, smart calendar scheduling, and autonomous AI meeting minutes — united in one vibrant, beautiful workspace.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/dashboard" className="w-full sm:w-auto inline-flex justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xl shadow-indigo-600/30 rounded-2xl h-12 sm:h-14 px-8 text-sm sm:text-base font-bold gap-2 cursor-pointer"
              >
                <span>Launch Workspace Free</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/meeting/new" className="w-full sm:w-auto inline-flex justify-center">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-emerald-300 bg-white/95 backdrop-blur hover:bg-emerald-50/70 rounded-2xl h-12 sm:h-14 px-8 text-sm sm:text-base font-bold text-emerald-800 gap-2 shadow-xs cursor-pointer"
              >
                <Video className="w-5 h-5 text-emerald-600" />
                <span>Start Instant Meeting</span>
              </Button>
            </Link>

            <Button
              size="lg"
              variant="outline"
              onClick={() => setHardwareModalOpen(true)}
              className="w-full sm:w-auto border-slate-200 bg-white/95 backdrop-blur hover:bg-slate-50 rounded-2xl h-12 sm:h-14 px-6 text-sm sm:text-base font-semibold text-slate-700 gap-2 shadow-xs cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Test Audio & Video</span>
            </Button>
          </div>

          {/* Social Proof Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span>Zero Downloads Required</span>
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700">
              <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />
              <span>Sub-30ms Global Latency</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <Check className="w-4 h-4 text-rose-600 stroke-[3]" />
              <span>100% Free Forever Tier</span>
            </span>
          </div>

          {/* Interactive Multi-Tab Superpowers Showcase */}
          <div id="superpowers">
            <InteractiveSuperpowers />
          </div>
        </div>
      </section>

      {/* Vibrant Metrics & Live Performance Strip */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Metric 1: Latency */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">Global RTT</span>
                <Radio className="w-4 h-4 text-indigo-500 animate-pulse" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-950 font-mono">
                &lt; 28ms
              </div>
              <p className="text-xs text-slate-500 mt-1">Peer-to-peer and SFU direct routing</p>
            </div>

            {/* Metric 2: Video Bitrate */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Visual Quality</span>
                <Video className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-mono">
                60 FPS
              </div>
              <p className="text-xs text-slate-500 mt-1">Adaptive bitrate HD video & screen share</p>
            </div>

            {/* Metric 3: AI Speed */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">AI Summaries</span>
                <Sparkles className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-rose-950 font-mono">
                Instant
              </div>
              <p className="text-xs text-slate-500 mt-1">Action items extracted right at wrap-up</p>
            </div>

            {/* Metric 4: Uptime */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">SLA Uptime</span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-950 font-mono">
                99.99%
              </div>
              <p className="text-xs text-slate-500 mt-1">Embedded PostgreSQL persistent data</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Audio & Hardware Playground */}
      <section id="audio-test" className="py-16 bg-[#F4FAF6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AudioPlayground />
        </div>
      </section>

      {/* The 6 Feature Pillars of Kollab */}
      <section id="pillars" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unified Workspace Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Built for high-velocity teams who value focus
            </h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              Every tool works together out of the box. No integrations to configure, no separate account logins, and zero context switching.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Pillar 1: HD Video (Electric Indigo) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-50/60 to-white border border-indigo-200/80 shadow-xs hover:shadow-xl hover:border-indigo-400 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                HD Video & Web Audio Meetings
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hardware-accelerated Web Audio filters, adaptive bitrate WebRTC streams, screen sharing, virtual backgrounds, and celebratory reactions.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Sub-30ms global media pipeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Real-time speech level indicators</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>One-click instant guest access</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Autonomous AI (Vivid Emerald) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-200/80 shadow-xs hover:shadow-xl hover:border-emerald-400 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Autonomous AI Meeting Intelligence
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Automatic diarized transcripts, instant executive takeaways, consensus decisions, and auto-assigned action items synchronized to your workspace.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Speaker identification & timestamps</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Automatic action items with owners</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Interactive &ldquo;Ask Kollab AI&rdquo; query bar</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Team Chat (Warm Sunset Coral) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-rose-50/60 to-white border border-rose-200/80 shadow-xs hover:shadow-xl hover:border-rose-400 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-6 shadow-md shadow-rose-600/30 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                Slack-Grade Real-Time Messaging
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Dedicated department channels, direct messages, rich message formatting, AI message drafting in multiple tones, and 1-click meeting launches.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  <span>Live 2.5s PostgreSQL message polling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  <span>AI Drafting (Professional, Friendly, Concise)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  <span>In-channel 1-click video call triggers</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4: Whiteboard (Royal Violet) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-50/60 to-white border border-purple-200/80 shadow-xs hover:shadow-xl hover:border-purple-400 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-md shadow-purple-600/30 group-hover:scale-110 transition-transform">
                <Paintbrush className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Infinite Collaborative Whiteboard
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Draw diagrams, brainstorm architectural flows, drop color-coded sticky notes, and collaborate in real-time right alongside your live video sync.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Multi-color sticky note palettes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>In-meeting slide-out drawer integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Instant PNG / SVG canvas export</span>
                </li>
              </ul>
            </div>

            {/* Pillar 5: Smart Calendar (Warm Amber) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-50/60 to-white border border-amber-200/80 shadow-xs hover:shadow-xl hover:border-amber-400 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-6 shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Smart Calendar & Meeting Invites
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Organize team syncs across Month, Week, Day, and Agenda views. Generates automatic secure join codes and notifies invitees seamlessly.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Automatic meeting join code generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Agenda, Day, Week & Month switchers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Auto-syncs with upcoming dashboard tiles</span>
                </li>
              </ul>
            </div>

            {/* Pillar 6: AV Diagnostic Suite (Luminous Cyan) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-cyan-50/60 to-white border border-cyan-200/80 shadow-xs hover:shadow-xl hover:border-cyan-400 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center mb-6 shadow-md shadow-cyan-600/30 group-hover:scale-110 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                Device Diagnostics & QR Code Share
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Verify camera feed, test microphone gain meters, play audio output chime tests, and generate instant mobile QR codes for 1-second phone access.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>Synthetic Web Audio speaker check</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>Instant mobile room entry with QR code</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>Pre-join hardware testing suite</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Stack Comparison Section */}
      <section id="comparison" className="py-20 bg-[#F4FAF6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              One unified platform. Zero subscription chaos.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              See why teams are replacing bloated multi-app stacks with Kollab&apos;s all-in-one collaboration engine.
            </p>
          </div>

          <StackComparison />
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section id="security" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Enterprise Grade Security</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Complete isolation, encryption, and data governance
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed text-sm sm:text-base">
                Media streams are end-to-end encrypted with DTLS-SRTP protocols. All database operations are normalized in PostgreSQL with strict server-side authorization checks.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">DTLS-SRTP Media Encryption</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Every video frame and audio packet is encrypted directly between peers or signed SFU instances.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Zero-Trust Role Permissions</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Host moderation, participant muting, waiting rooms, and token expirations enforced server-side.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Embedded PostgreSQL Resilient Engine</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Multi-process lock recovery and automated in-memory failover guarantee 100% platform availability.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Security Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-indigo-500/20 relative overflow-hidden">
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
      <section id="faq" className="py-20 bg-[#F4FAF6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600">
              Everything you need to know about Kollab&apos;s meetings, chat, whiteboard, and AI capabilities.
            </p>
          </div>

          <LandingFaq />
        </div>
      </section>

      {/* High-Impact Colorful Aurora Call To Action */}
      <section className="py-24 bg-gradient-to-tr from-[#051C13] via-[#09291E] to-[#04160F] text-white relative overflow-hidden">
        {/* Ambient Aurora Glow spots */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-6 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ready for Next-Gen Collaboration?</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Supercharge your team&apos;s workflow today.
          </h2>

          <p className="mt-5 text-emerald-200/80 max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed">
            Join modern teams collaborating with crystal-clear video meetings, real-time team chat, infinite whiteboards, and autonomous AI meeting takeaways.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto inline-flex justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white shadow-xl shadow-emerald-500/40 rounded-2xl h-14 px-9 text-base font-extrabold inline-flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/meeting/new" className="w-full sm:w-auto inline-flex justify-center">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-emerald-400/40 bg-white/10 hover:bg-white/20 text-white rounded-2xl h-14 px-8 text-base font-bold gap-2 cursor-pointer backdrop-blur"
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
