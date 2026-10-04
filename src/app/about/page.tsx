import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KollabLogo } from "@/components/ui/kollab-logo";

import { NavbarAuth } from "@/components/layout/NavbarAuth";

export default function AboutPage() {
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">
            About Kollab
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Meet. Collaborate. Get things done.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <p>
            Kollab was built with a single guiding mission: to remove the friction of modern remote teamwork by unifying video conferencing, team communication, and autonomous artificial intelligence into one cohesive platform.
          </p>
          <p>
            Instead of fragmenting meetings, messages, whiteboards, notes, and task management across separate siloed apps, Kollab provides a centralized workspace where your conversation flows effortlessly into structured decisions and action items.
          </p>
          <div className="pt-4 flex justify-center">
            <Link href="/dashboard">
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-xl text-xs gap-2 shadow-sm shadow-emerald-500/20">
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
