import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { NavbarAuth } from "@/components/layout/NavbarAuth";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4FAF6] text-[#081C15] flex flex-col selection:bg-[#10B981]/25 selection:text-[#047857]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <KollabLogo size={36} />
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-950 via-[#047857] to-[#10B981] bg-clip-text text-transparent">
              KOLLAB
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="#features" className="hover:text-[#059669] transition-colors">
              Features
            </Link>
            <Link href="#ai" className="hover:text-[#059669] transition-colors">
              AI Intelligence
            </Link>
            <Link href="#collaboration" className="hover:text-[#059669] transition-colors">
              Teamwork
            </Link>
            <Link href="#security" className="hover:text-[#059669] transition-colors">
              Security
            </Link>
          </nav>

          <NavbarAuth />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Ambient emerald background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#10B981]/20 via-[#059669]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#047857] text-xs font-bold mb-8 animate-in fade-in duration-300 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Meet Kollab 2.0 • Unified AI Meetings & Team Collaboration</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-emerald-950 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            One workspace. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#047857] via-[#10B981] to-[#0D9488] bg-clip-text text-transparent">
              Every conversation.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Kollab brings HD video meetings, team chat, calendar, AI notes, documents, whiteboards, and recordings into one powerful, unified workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white shadow-xl shadow-emerald-600/30 rounded-2xl h-13 px-8 text-base font-bold gap-2"
              >
                <span>Start collaborating</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/meeting/new" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-emerald-200 bg-white/90 backdrop-blur hover:bg-emerald-50 rounded-2xl h-13 px-8 text-base font-semibold text-emerald-950 gap-2 shadow-xs"
              >
                <Video className="w-5 h-5 text-[#10B981]" />
                <span>Start Instant Meeting</span>
              </Button>
            </Link>
          </div>

          {/* Interactive Workspace Preview Graphic */}
          <div className="mt-16 max-w-5xl mx-auto relative rounded-3xl border border-emerald-200/80 bg-white shadow-2xl overflow-hidden group">
            {/* Window bar */}
            <div className="h-11 bg-emerald-50/80 border-b border-emerald-100 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="w-3 h-3 rounded-full bg-teal-400" />
                <span className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <div className="text-xs font-semibold text-emerald-800 bg-white px-6 py-1 rounded-md border border-emerald-100">
                kollab.io/meeting/klb-sync-q4
              </div>
              <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Live HD
              </div>
            </div>

            {/* Simulated Live Meeting Room */}
            <div className="bg-[#081C15] p-6 text-white min-h-[440px] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-950 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white">Weekly Product Design Sync</span>
                  <span className="text-xs bg-emerald-900/60 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                    24:31
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-900 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Noise Suppression: Standard</span>
                </div>
              </div>

              {/* Participant Video Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="relative aspect-video rounded-2xl bg-slate-900 border-2 border-emerald-400 overflow-hidden shadow-lg shadow-emerald-500/25 group">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"
                    alt="Meeting Host"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#081C15]/85 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-900">
                    <Mic className="w-3 h-3 text-emerald-400" />
                    <span>Meeting Host</span>
                  </div>
                  <div className="absolute top-2 right-2 bg-[#10B981] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    SPEAKING
                  </div>
                </div>

                <div className="relative aspect-video rounded-2xl bg-slate-900 border border-emerald-950 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500"
                    alt="Participant"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#081C15]/85 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-900">
                    <Mic className="w-3 h-3 text-emerald-400" />
                    <span>Design Lead</span>
                  </div>
                </div>

                <div className="relative aspect-video rounded-2xl bg-slate-900 border border-emerald-950 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
                    alt="Participant"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#081C15]/85 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-900">
                    <Mic className="w-3 h-3 text-slate-400" />
                    <span>Engineering</span>
                  </div>
                </div>
              </div>

              {/* Realtime Live Caption bar */}
              <div className="bg-[#061812]/90 border border-emerald-900/80 rounded-xl p-3 text-center text-xs sm:text-sm text-emerald-100">
                <span className="text-[#34D399] font-bold mr-2">Speaker:</span>
                &ldquo;Target launch date is confirmed for October 21. Realtime WebRTC and AI meeting summaries are live!&rdquo;
              </div>

              {/* Bottom Meeting Controls Preview */}
              <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-900/60 text-white flex items-center justify-center hover:bg-emerald-800 cursor-pointer">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-900/60 text-white flex items-center justify-center hover:bg-emerald-800 cursor-pointer">
                  <Video className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-900/60 text-white flex items-center justify-center hover:bg-emerald-800 cursor-pointer">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-900/60 text-white flex items-center justify-center hover:bg-emerald-800 cursor-pointer">
                  <Smile className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs px-3">
                  LEAVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Sections */}
      <section id="features" className="py-20 bg-white border-t border-emerald-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#059669]">
              Unified Ecosystem
            </h2>
            <h3 className="mt-3 text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
              Everything teams need to collaborate seamlessly
            </h3>
            <p className="mt-4 text-slate-600 leading-relaxed">
              No more switching between 5 disconnected tools. Kollab unites video calling, realtime messaging, smart calendar, documents, and canvas whiteboards.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Video Meetings */}
            <div className="p-8 rounded-3xl bg-[#F4FAF6] border border-emerald-200/70 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#047857] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-emerald-950">HD Video & Audio Meetings</h4>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Adaptive quality WebRTC media with noise cancellation, automatic camera lighting correction, screen sharing, and virtual backgrounds.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Hardware noise suppression filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Realtime captions & translation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Waiting rooms & host moderation</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: Kollab AI */}
            <div className="p-8 rounded-3xl bg-[#F4FAF6] border border-emerald-200/70 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-[#0D9488] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-emerald-950">Autonomous AI Intelligence</h4>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Automatic post-meeting summaries, timestamped transcripts, actionable task assignments, meeting preparation briefings, and smart message drafting.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Instant summaries & key decisions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Auto-extracted action items with owners</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Catch up with AI for missed chats</span>
                </li>
              </ul>
            </div>

            {/* Feature 3: Team Communication */}
            <div className="p-8 rounded-3xl bg-[#F4FAF6] border border-emerald-200/70 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-emerald-950">Team Chat & Channels</h4>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Slack-style persistent channels, direct messaging, message threading, emoji reactions, file attachments, and 1-click meeting launches.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Organized department channels</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>AI Drafting (Friendly, Concise, Detailed)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Seamless file sharing & previews</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Productivity: Calendar, Docs & Whiteboards */}
      <section id="collaboration" className="py-20 bg-[#F4FAF6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-[#047857] text-xs font-bold mb-4">
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Integrated Productivity</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight leading-tight">
                Live Whiteboards, Collaborative Docs, and Smart Calendar
              </h3>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Brainstorm in realtime on interactive whiteboards with shapes, sticky notes, and freehand drawing. Document ideas with version history and schedule calls directly on your calendar.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-sm">Rich Document Templates</h5>
                    <p className="text-xs text-slate-500 mt-1">Pre-built templates for meeting agendas, project briefs, and technical specifications.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-[#0D9488] flex items-center justify-center shrink-0 mt-0.5">
                    <Paintbrush className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-sm">Realtime Whiteboard Drawing</h5>
                    <p className="text-xs text-slate-500 mt-1">Multi-user sticky notes, geometric shapes, highlighters, and instant export.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-sm">1-Click Meeting Scheduling</h5>
                    <p className="text-xs text-slate-500 mt-1">Month, week, day, and agenda views with automatic participant email invitations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual preview card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                  <span className="text-sm font-bold text-emerald-950">Whiteboard Canvas</span>
                </div>
                <span className="text-xs text-slate-400">Export PNG / SVG</span>
              </div>

              <div className="h-64 rounded-2xl bg-emerald-50/40 border border-dashed border-emerald-200 p-4 relative overflow-hidden flex items-center justify-center">
                <div className="absolute top-4 left-4 bg-emerald-100 border border-emerald-200 p-3 rounded-xl shadow-xs w-40 text-xs text-emerald-950 font-medium">
                  📌 Finalize audio compression benchmarks!
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-md text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#10B981]" />
                  <span>Kollab Green Media Pipeline</span>
                </div>
                <div className="absolute bottom-4 right-4 bg-teal-50 border border-teal-200 p-3 rounded-xl shadow-xs text-xs text-teal-800 font-semibold">
                  ✅ 100% Test Passed
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Realtime multi-cursor collaboration</span>
                <span className="font-bold text-[#059669]">Auto-saved to Cloud</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Enterprise Ready */}
      <section id="security" className="py-20 bg-white border-t border-emerald-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#047857] text-xs font-bold mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Enterprise Security</span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Security and permissions built into every layer
          </h3>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto leading-relaxed">
            All meeting roles, room access, media tokens, and file permissions are validated strictly server-side. Zero sensitive credentials are ever exposed to the client.
          </p>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="text-2xl font-extrabold text-emerald-950">256-bit</div>
              <div className="text-xs text-slate-500 mt-1">WebRTC Media Encryption</div>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="text-2xl font-extrabold text-emerald-950">Zero-Trust</div>
              <div className="text-xs text-slate-500 mt-1">Multi-factor Authentication</div>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="text-2xl font-extrabold text-emerald-950">PostgreSQL</div>
              <div className="text-xs text-slate-500 mt-1">Normalized Isolation</div>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="text-2xl font-extrabold text-emerald-950">LiveKit</div>
              <div className="text-xs text-slate-500 mt-1">Signed Room Tokens</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action footer banner in luxury dark forest green */}
      <section className="py-20 bg-gradient-to-tr from-[#051C13] via-[#08281D] to-[#04160F] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to upgrade your team collaboration?
          </h2>
          <p className="mt-4 text-emerald-200 max-w-xl mx-auto text-base sm:text-lg">
            Join thousands of teams collaborating with video meetings, chat, whiteboards, and autonomous AI notes on Kollab.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-[#10B981] hover:bg-[#059669] text-white shadow-xl shadow-emerald-500/40 rounded-2xl h-13 px-8 text-base font-bold"
              >
                Start Collaborating Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
