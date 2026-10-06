"use client";

import React from "react";
import { Check, X, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StackComparison() {
  const comparisonItems = [
    {
      feature: "HD Video & Audio Meetings",
      kollab: "Sub-30ms WebRTC, 60 FPS, No 40-min limits",
      legacy: "Zoom Pro ($15.99/mo) with 40-min cutoffs on free",
      kollabGood: true,
    },
    {
      feature: "Real-Time Team Channels & DMs",
      kollab: "Unlimited history, threads & AI tone drafts",
      legacy: "Slack Pro ($8.75/mo) hides messages after 90 days",
      kollabGood: true,
    },
    {
      feature: "Autonomous AI Meeting Notes",
      kollab: "Included natively: summaries, diarization & tasks",
      legacy: "Otter.ai / Fireflies ($18.00/mo extra bot)",
      kollabGood: true,
    },
    {
      feature: "Interactive Infinite Whiteboard",
      kollab: "In-meeting and stand-alone collaborative canvas",
      legacy: "Miro / Mural ($16.00/mo) in separate tab",
      kollabGood: true,
    },
    {
      feature: "Collaborative Documents & Specs",
      kollab: "Built-in rich markdown & meeting agenda templates",
      legacy: "Notion ($10.00/mo) disconnected from call logs",
      kollabGood: true,
    },
    {
      feature: "Total Cost per User / Month",
      kollab: "$0 / user (Free tier with unlimited rooms)",
      legacy: "$68.74+ per user / month across 5 tools",
      kollabGood: true,
      highlight: true,
    },
  ];

  return (
    <div className="rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Modern Workspace ROI</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Stop Paying for 5 Disconnected Subscriptions
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Fragmented tools cause missed context, tab fatigue, and exorbitant monthly invoices. Kollab consolidates your entire team workflow into one coherent experience.
          </p>
        </div>

        <Link href="/dashboard" className="shrink-0">
          <Button className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold text-xs h-11 px-5 shadow-lg shadow-emerald-500/30">
            <span>Upgrade to Kollab</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Comparison Grid */}
      <div className="divide-y divide-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 bg-white/[0.04] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
          <div className="md:col-span-4">Capability</div>
          <div className="md:col-span-4 text-emerald-400 font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Kollab All-In-One</span>
          </div>
          <div className="md:col-span-4 text-slate-400">Legacy 5-Tool Stack</div>
        </div>

        {comparisonItems.map((item, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 md:grid-cols-12 px-6 py-4 items-center text-xs gap-2 sm:gap-4 transition-colors ${
              item.highlight
                ? "bg-emerald-500/10 font-bold border-l-4 border-emerald-400"
                : "hover:bg-white/[0.04]"
            }`}
          >
            <div className="md:col-span-4 font-bold text-white flex items-center gap-2">
              <span>{item.feature}</span>
            </div>

            <div className="md:col-span-4 font-semibold text-emerald-300 flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>{item.kollab}</span>
            </div>

            <div className="md:col-span-4 text-slate-400 flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <X className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="line-through decoration-rose-400/60 text-slate-400">{item.legacy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
