import React from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KollabLogo } from "@/components/ui/kollab-logo";

export default function PricingPage() {
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
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-xs font-semibold text-slate-700 hover:bg-emerald-50 rounded-xl">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-500/20">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Choose the plan that fits your team. All plans include HD video meetings and intelligent AI notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Starter</h3>
              <p className="text-xs text-slate-500 mt-1">For individuals and small projects</p>
              <div className="mt-4 text-3xl font-extrabold">$0</div>
              <ul className="mt-6 space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Unlimited 1:1 meetings</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Up to 50 participants per call</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> 5 AI meeting summaries per month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Unlimited team chat & channels</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8">
              <Button variant="outline" className="w-full text-xs font-semibold rounded-xl">Get Started Free</Button>
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-3xl bg-white border-2 border-[#10B981] shadow-xl flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#10B981] text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/30">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pro Team</h3>
              <p className="text-xs text-slate-500 mt-1">For growing startups and remote teams</p>
              <div className="mt-4 text-3xl font-extrabold text-[#059669]">$15 <span className="text-xs text-slate-400 font-normal">/user/mo</span></div>
              <ul className="mt-6 space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Up to 250 participants per call</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Unlimited cloud recordings & storage</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Unlimited autonomous AI meeting notes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Realtime speech translation (10+ languages)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Priority WebRTC routing</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8">
              <Button className="w-full bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/25">Start 14-Day Free Trial</Button>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Enterprise</h3>
              <p className="text-xs text-slate-500 mt-1">For large organizations requiring custom SLAs</p>
              <div className="mt-4 text-3xl font-extrabold">Custom</div>
              <ul className="mt-6 space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Up to 1,000 participants per call</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Dedicated LiveKit media servers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Custom AI provider keys & governance</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> SSO, SAML & Okta authentication</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8">
              <Button variant="outline" className="w-full text-xs font-semibold rounded-xl">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
