import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Key, Server, FileCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KollabLogo } from "@/components/ui/kollab-logo";

import { NavbarAuth } from "@/components/layout/NavbarAuth";

export default function SecurityPage() {
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Trust & Compliance</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">
            Security Architecture
          </h1>
          <p className="mt-4 text-base text-slate-600">
            How Kollab protects your media streams, organization workspaces, private messages, and meeting data.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-1">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Signed Media Access Tokens</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                LiveKit room tokens are generated and signed strictly server-side using secure HMAC-SHA256 signatures with ephemeral lifetimes. No secrets are ever provided to client code.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0 mt-1">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Server-Side Authorization & RBAC</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                All meeting actions (muting participants, admitting from waiting room, accessing recordings, querying AI) verify organization and user permissions on the server before execution.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0 mt-1">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Isolated PostgreSQL Database Storage</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Normalized database tables with relational foreign keys and organization scopes ensure strict workspace tenant isolation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
