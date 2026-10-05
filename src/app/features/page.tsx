import React from "react";
import Link from "next/link";
import {
  Video,
  Sparkles,
  MessageSquare,
  Calendar,
  FileText,
  Paintbrush,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { KollabLogo } from "@/components/ui/kollab-logo";
import { NavbarAuth } from "@/components/layout/NavbarAuth";
import { Footer } from "@/components/layout/Footer";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#F4FAF6] text-slate-900 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <KollabLogo size={32} />
            <span className="font-extrabold text-xl tracking-tight text-slate-950">
              KOLLAB
            </span>
          </Link>

          <NavbarAuth />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">
            Comprehensive Collaboration Suite
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Discover the unified tools that power real-time communication, visual teamwork, and autonomous meeting intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <Video className="w-8 h-8 text-[#10B981] mb-4" />
            <h3 className="text-lg font-bold">HD WebRTC Video Meetings</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Crystal-clear audio and video with adaptive quality, hardware noise suppression, and virtual background filters.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <Sparkles className="w-8 h-8 text-[#3B82F6] mb-4" />
            <h3 className="text-lg font-bold">Autonomous AI Intelligence</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Instant meeting summaries, action items with assigned owners, timestamped transcripts, and message drafting.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <MessageSquare className="w-8 h-8 text-[#10B981] mb-4" />
            <h3 className="text-lg font-bold">Team Chat & Channels</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Slack-style department channels, direct messages, file attachments, and 1-click meeting calls.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <Paintbrush className="w-8 h-8 text-[#EC4899] mb-4" />
            <h3 className="text-lg font-bold">Realtime Whiteboards</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Collaborative canvas with pen tools, geometric shapes, highlighters, sticky notes, and instant PNG export.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <FileText className="w-8 h-8 text-[#F97316] mb-4" />
            <h3 className="text-lg font-bold">Collaborative Documents</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Pre-built meeting templates, real-time autosave, AI polish assistant, and markdown export.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-[#10B981] mb-4" />
            <h3 className="text-lg font-bold">Enterprise Security</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Server-side authorization, signed media tokens, end-to-end meeting isolation, and robust session encryption.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
