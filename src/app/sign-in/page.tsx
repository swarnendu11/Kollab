"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowRight,
  User,
  Check,
  Loader2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KollabLogo } from "@/components/ui/kollab-logo";

const DEMO_ACCOUNTS = [
  {
    id: "user_alex",
    name: "Alex Morgan",
    role: "Engineering Lead (Host / Admin)",
    email: "alex.morgan@kollab.io",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "user_sarah",
    name: "Sarah Chen",
    role: "Product Designer",
    email: "sarah.chen@kollab.io",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  {
    id: "user_david",
    name: "David Kim",
    role: "Systems & WebRTC Engineer",
    email: "david.kim@kollab.io",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  {
    id: "user_elena",
    name: "Elena Rostova",
    role: "AI Research Lead",
    email: "elena.rostova@kollab.io",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
  },
];

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("user_alex");

  const handleSignIn = async (e?: React.FormEvent, customUserId?: string) => {
    if (e) e.preventDefault();
    setLoading(true);

    const userId = customUserId || selectedUser;
    const account = DEMO_ACCOUNTS.find((a) => a.id === userId) || {
      id: `user_${Date.now()}`,
      name: email.split("@")[0] || "Kollab Member",
      email: email || "user@kollab.io",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      role: "Member",
    };

    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: account.id,
          email: account.email,
          name: account.name,
          avatar: account.avatar,
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FAF6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#10B981]/20 selection:text-[#059669]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <KollabLogo size={42} />
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-emerald-950 via-[#047857] to-[#10B981] bg-clip-text text-transparent">
            KOLLAB
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Meet. Collaborate. Get things done.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-950/5 border border-emerald-100 rounded-3xl sm:px-10">
          
          {/* Quick Sign In Form */}
          <form onSubmit={(e) => handleSignIn(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@kollab.io"
                  className="pl-9 rounded-xl border-emerald-100 focus:border-[#10B981] focus:ring-[#10B981]/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-xs text-slate-400">Any password</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 rounded-xl border-emerald-100 focus:border-[#10B981] focus:ring-[#10B981]/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-11 font-semibold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>Sign In</span>
            </Button>
          </form>

          {/* Quick 1-Click Profile Switcher */}
          <div className="mt-8 pt-6 border-t border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Instant Profiles
              </span>
              <span className="text-[10px] font-semibold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Frictionless
              </span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSignIn(undefined, acc.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 rounded-lg border border-emerald-200">
                      <AvatarImage src={acc.avatar} />
                      <AvatarFallback>{acc.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{acc.role}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#10B981] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
            <span>New to Kollab?</span>
            <Link
              href="/sign-up"
              className="font-bold text-[#059669] hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create an account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
