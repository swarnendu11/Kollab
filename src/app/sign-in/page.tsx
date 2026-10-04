"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmationResult } from "firebase/auth";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

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
];

type AuthMethod = "email" | "google" | "phone";

export default function SignInPage() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, sendPhoneCode, verifyPhoneCode, user } = useFirebaseAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("user_alex");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Handle Firebase Email/Password Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Firebase email login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password. You can also sign up or use 1-click Demo Sign In below.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Access to this account has been temporarily disabled due to many failed login attempts.");
      } else {
        setError(err.message || "Failed to sign in. Please verify your Firebase configuration.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Firebase Google Sign-In (Popup)
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Firebase Google login error:", err);
      if (err.code === "auth/unauthorized-domain") {
        setError(
          "Firebase Auth: This domain (localhost) is not in your Firebase authorized domains list. Add 'localhost' in Firebase Console > Authentication > Settings > Authorized domains."
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in popup was closed before finishing.");
      } else {
        setError(err.message || "Google sign-in failed. Please check Firebase settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone Auth: Step 1 - Send SMS OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError("Please enter a valid phone number with country code (e.g. +1234567890).");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const confirmation = await sendPhoneCode(phoneNumber.trim(), "recaptcha-container");
      setConfirmationResult(confirmation);
      setSuccessMessage(`SMS verification code sent to ${phoneNumber}`);
    } catch (err: any) {
      console.error("Firebase Phone auth send error:", err);
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Please include country code, e.g. +14155552671");
      } else if (err.code === "auth/quota-exceeded") {
        setError("SMS quota exceeded. Please configure testing phone numbers in the Firebase Console.");
      } else {
        setError(err.message || "Failed to send SMS code. Make sure Phone Auth is enabled in Firebase Console.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone Auth: Step 2 - Verify OTP
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !otpCode.trim()) {
      setError("Please enter the 6-digit SMS verification code.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await verifyPhoneCode(confirmationResult, otpCode.trim());
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Firebase Phone auth verify error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid SMS verification code. Please check the code and try again.");
      } else {
        setError(err.message || "Phone verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo Persona Quick Sign-In for Local Testing
  const handleDemoSignIn = async (userIdToUse: string) => {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdToUse }),
      });
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setError("Demo login failed.");
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
          Powered by Firebase Authentication & Firestore (Project: <span className="font-mono text-emerald-700 font-semibold">kollab-9699a</span>)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-950/5 border border-emerald-100 rounded-3xl sm:px-10">
          
          {/* Auth Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-emerald-50/70 p-1 rounded-2xl mb-6 border border-emerald-100/60">
            <button
              type="button"
              onClick={() => { setAuthMethod("email"); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                authMethod === "email"
                  ? "bg-white text-[#047857] shadow-sm shadow-emerald-500/10 font-bold"
                  : "text-slate-600 hover:text-emerald-900"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>

            <button
              type="button"
              onClick={() => { setAuthMethod("google"); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                authMethod === "google"
                  ? "bg-white text-[#047857] shadow-sm shadow-emerald-500/10 font-bold"
                  : "text-slate-600 hover:text-emerald-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => { setAuthMethod("phone"); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                authMethod === "phone"
                  ? "bg-white text-[#047857] shadow-sm shadow-emerald-500/10 font-bold"
                  : "text-slate-600 hover:text-emerald-900"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              Phone OTP
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Hidden reCAPTCHA container for Phone Auth */}
          <div id="recaptcha-container" />

          {/* 1. EMAIL / PASSWORD AUTH */}
          {authMethod === "email" && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
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
                    placeholder="alex@kollab.io"
                    className="pl-9 rounded-xl border-emerald-100 focus:border-[#10B981] focus:ring-[#10B981]/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <a href="#reset" onClick={(e) => { e.preventDefault(); alert("Password reset link will be sent to your email."); }} className="text-xs text-[#059669] hover:underline font-medium">
                    Forgot password?
                  </a>
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
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-11 font-semibold shadow-md shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign In with Email
              </Button>
            </form>
          )}

          {/* 2. GOOGLE SIGN-IN */}
          {authMethod === "google" && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-500 text-center">
                Fast and secure 1-click authentication using your Google Account.
              </p>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-3 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </Button>
            </div>
          )}

          {/* 3. PHONE NUMBER & OTP AUTH */}
          {authMethod === "phone" && (
            <div className="space-y-4">
              {!confirmationResult ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (with Country Code)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 555 123 4567"
                        className="pl-9 rounded-xl border-emerald-100 focus:border-[#10B981] focus:ring-[#10B981]/20 font-mono"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Include country prefix (e.g. +1 for USA, +44 for UK, +91 for India)
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-11 font-semibold shadow-md shadow-emerald-500/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send Verification SMS
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Enter 6-Digit SMS Code
                      </label>
                      <button
                        type="button"
                        onClick={() => { setConfirmationResult(null); setOtpCode(""); }}
                        className="text-xs text-[#059669] hover:underline"
                      >
                        Change Number
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="pl-9 rounded-xl border-emerald-100 focus:border-[#10B981] focus:ring-[#10B981]/20 font-mono text-center tracking-widest text-lg font-bold"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-11 font-semibold shadow-md shadow-emerald-500/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify Code & Sign In
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Workspace Switcher */}
          <div className="mt-8 pt-6 border-t border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Demo Profiles
              </span>
              <span className="text-[10px] font-semibold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Local Preview
              </span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleDemoSignIn(acc.id)}
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

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link href="/sign-up" className="font-semibold text-[#059669] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
