import React from "react";
import Link from "next/link";
import {
  Video,
  Sparkles,
  ShieldCheck,
  Globe,
  Heart,
  MessageSquare,
  FileText,
  Calendar,
  Paintbrush,
} from "lucide-react";
import { KollabLogo } from "@/components/ui/kollab-logo";

export function Footer() {
  return (
    <footer className="bg-slate-950/90 text-slate-300 border-t border-white/10 text-xs select-none backdrop-blur-2xl">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <KollabLogo size={36} />
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                KOLLAB
              </span>
            </Link>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm">
              Unified communication and collaboration platform. Crystal-clear video meetings, team chat, shared documents, whiteboards, and intelligent workspace summaries.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational • 99.99% Uptime</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Workspace
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/meetings"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Video Meetings</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Team Chat</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/calendar"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Smart Calendar</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/documents"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Live Documents</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/whiteboards"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Paintbrush className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Whiteboards</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/features" className="hover:text-white transition-colors">
                  Platform Overview
                </Link>
              </li>
              <li>
                <Link href="/recordings" className="hover:text-white transition-colors">
                  Cloud Recordings
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-white transition-colors">
                  Contact Directory
                </Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-white transition-colors">
                  Team Members
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Company */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Company & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Kollab
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Security & Isolation</span>
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition-colors">
                  Settings
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-white transition-colors text-emerald-400 font-semibold">
                  Get Started Free
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Kollab, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/security" className="hover:text-cyan-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/security" className="hover:text-cyan-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/security" className="hover:text-cyan-300 transition-colors">
              Security Compliance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
