"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  LogIn,
  UserPlus,
  AlertCircle,
  KeyRound,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  useEffect(() => {
    setSupabaseActive(isSupabaseConfigured());

    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setRegisteredUsers(d.users);
      })
      .catch(() => {});
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const clientSupabase = getSupabaseClient();

      // If Supabase client is configured, sign in via Supabase Auth
      if (clientSupabase) {
        const { data, error: sbError } = await clientSupabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (sbError) {
          throw new Error(sbError.message);
        }

        if (data.user) {
          // Synchronize with database and set session cookies
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sync_supabase_session",
              supabaseUser: {
                id: data.user.id,
                email: data.user.email,
                fullName: data.user.user_metadata?.full_name || normalizedEmail.split("@")[0],
              },
            }),
          });

          router.push("/dashboard");
          router.refresh();
          return;
        }
      }

      // Server-side fallback or server Supabase flow
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signin",
          email: normalizedEmail,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your email and password.");
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "demo_login",
          email: demoEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FAF6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#10B981]/20 selection:text-[#059669]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <KollabLogo size={42} />
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-emerald-950 via-[#047857] to-[#10B981] bg-clip-text text-transparent">
            KOLLAB
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and password to access meetings, chat, and docs.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-950/5 border border-emerald-100 rounded-3xl sm:px-10">
          {/* Supabase Status Pill */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${supabaseActive ? "bg-emerald-500 animate-pulse" : "bg-emerald-600"}`} />
                <span className="text-xs font-bold text-slate-800">
                  {supabaseActive ? "Supabase Auth Active" : "Supabase Auth Integrated"}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-emerald-100/80 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                Email & Password
              </span>
            </div>

            {!supabaseActive && (
              <div className="text-[11px] text-slate-500">
                <span>Credentials ready in .env. </span>
                <button
                  type="button"
                  onClick={() => setShowConfigGuide(!showConfigGuide)}
                  className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  <span>{showConfigGuide ? "Hide .env guide" : "View Supabase .env keys"}</span>
                </button>
              </div>
            )}

            {showConfigGuide && !supabaseActive && (
              <div className="mt-2 p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[10px] space-y-1">
                <div className="text-slate-400"># Add to your .env file:</div>
                <div>NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...</div>
              </div>
            )}
          </div>

          {/* Dynamic Registered Workspace Accounts */}
          {registeredUsers.length > 0 && (
            <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>⚡ Quick Workspace Switcher</span>
                <span className="text-emerald-600 font-semibold lowercase">database synced</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {registeredUsers.slice(0, 4).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleDemoSignIn(u.email)}
                    disabled={loading}
                    className="p-2.5 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group shadow-2xs flex items-center gap-2.5 cursor-pointer"
                  >
                    <Avatar className="w-7 h-7 shrink-0 ring-1 ring-emerald-200">
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback className="text-[10px] bg-emerald-100 font-bold">{u.fullName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate leading-tight">{u.fullName}</div>
                      <div className="text-[10px] text-slate-400 capitalize truncate">{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <span className="relative bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">or sign in with password</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#10B981] focus:ring-[#10B981]/20 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#10B981] focus:ring-[#10B981]/20 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-11 text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>Sign In with Supabase</span>
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>Don&apos;t have an account?</span>
            <Link
              href="/sign-up"
              className="font-bold text-[#059669] hover:underline flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create an account</span>
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-emerald-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
