"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, LogOut, User as UserIcon, LayoutDashboard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavbarAuthProps {
  className?: string;
}

export function NavbarAuth({ className }: NavbarAuthProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signout" }),
    });
    setCurrentUser(null);
    setMenuOpen(false);
    window.location.reload();
  };

  // If user is authenticated: HIDE Sign In and Sign Up completely, show ONLY Name & Accounts!
  if (currentUser) {
    return (
      <div className={`relative flex items-center gap-3 ${className || ""}`}>
        <Link href="/dashboard" className="hidden sm:inline-flex shrink-0">
          <Button
            size="sm"
            className="h-9 px-3.5 bg-emerald-50 text-[#047857] hover:bg-emerald-100 border border-emerald-200 font-bold rounded-xl text-xs gap-1.5 inline-flex items-center justify-center shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span>Workspace</span>
          </Button>
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-9 inline-flex items-center gap-2 pl-3 pr-1.5 rounded-full hover:bg-emerald-50 transition-colors border border-emerald-200/90 shadow-2xs group shrink-0"
          >
            <span className="text-xs font-bold text-emerald-950 max-w-[120px] truncate leading-none">
              {currentUser.fullName}
            </span>
            <Avatar className="w-7 h-7 ring-2 ring-[#10B981]/30 shrink-0">
              <AvatarImage src={currentUser.avatarUrl} />
              <AvatarFallback className="text-xs font-bold">{currentUser.fullName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-slate-100">
                  <div className="font-semibold text-sm text-slate-900">{currentUser.fullName}</div>
                  <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                  <div className="mt-1 text-[11px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-100">
                    {currentUser.role || "Member"}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                    <span>Go to Dashboard</span>
                  </Link>
                  <Link
                    href="/settings/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // If user is unauthenticated: SHOW Sign In and Sign Up buttons!
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Link href="/sign-in" className="inline-flex shrink-0">
        <Button
          variant="ghost"
          className="font-semibold text-slate-700 hover:text-emerald-950 hover:bg-emerald-50 rounded-xl px-3.5 h-9 text-xs inline-flex items-center justify-center gap-1.5 shrink-0"
        >
          <LogIn className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Sign In</span>
        </Button>
      </Link>
      <Link href="/sign-up" className="inline-flex shrink-0">
        <Button className="bg-[#10B981] hover:bg-[#059669] text-white shadow-md shadow-emerald-600/25 rounded-xl px-4 h-9 text-xs font-bold gap-1.5 inline-flex items-center justify-center shrink-0">
          <UserPlus className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Up</span>
        </Button>
      </Link>
    </div>
  );
}

export default NavbarAuth;
