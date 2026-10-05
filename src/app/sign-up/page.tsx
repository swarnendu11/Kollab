"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Loader2,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Database,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  useEffect(() => {
    setSupabaseActive(isSupabaseConfigured());
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const clientSupabase = getSupabaseClient();

      // If client Supabase is configured, use official Supabase Auth SDK
      if (clientSupabase) {
        const { data, error: sbError } = await clientSupabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (sbError) {
          throw new Error(sbError.message);
        }

        // If email confirmation is required by Supabase project
        if (data.user && !data.session) {
          setEmailConfirmationSent(true);
          setLoading(false);
          return;
        }

        // Auto-signed in, synchronize session with workspace database
        if (data.user) {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sync_supabase_session",
              supabaseUser: {
                id: data.user.id,
                email: data.user.email,
                fullName: fullName.trim(),
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
          action: "signup",
          fullName: fullName.trim(),
          email: normalizedEmail,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      if (data.requiresEmailConfirmation) {
        setEmailConfirmationSent(true);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registration.");
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
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Sign up with your email and password to access the workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-950/5 border border-emerald-100 rounded-3xl sm:px-10">
          {/* Supabase Status Pill & Config Helper */}
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

          {/* Email Confirmation Screen */}
          {emailConfirmationSent ? (
            <div className="p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Check your inbox</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  We sent a confirmation link to <span className="font-semibold text-slate-900">{email}</span>. Click the link in the email to complete your Supabase registration.
                </p>
              </div>
              <Link href="/sign-in" className="inline-block mt-4">
                <Button className="rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-6">
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <Input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#10B981] focus:ring-[#10B981]/20 text-sm"
                    />
                  </div>
                </div>

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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#10B981] focus:ring-[#10B981]/20 text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Must be at least 6 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-11 text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Sign Up with Supabase</span>
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <span>Already have an account?</span>
                <Link
                  href="/sign-in"
                  className="font-bold text-[#059669] hover:underline flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in instead</span>
                </Link>
              </div>
            </>
          )}
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
