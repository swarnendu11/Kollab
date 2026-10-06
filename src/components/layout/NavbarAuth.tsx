"use client";

import React from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarAuthProps {
  className?: string;
}

export function NavbarAuth({ className }: NavbarAuthProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className || ""}`}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-xl px-4 h-9 text-xs font-bold gap-1.5 inline-flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="text-white font-extrabold">Sign In</span>
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/40 rounded-xl px-4 h-9 text-xs font-black gap-1.5 inline-flex items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="font-black text-slate-950">Sign Up</span>
          </button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        <Link href="/dashboard" className="inline-flex shrink-0">
          <Button
            size="sm"
            className="h-9 px-3.5 bg-emerald-50 text-[#047857] hover:bg-emerald-100 border border-emerald-200 font-bold rounded-xl text-xs gap-1.5 inline-flex items-center justify-center shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span>Workspace</span>
          </Button>
        </Link>
        <div className="flex items-center pl-1">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 ring-2 ring-emerald-500/40",
              },
            }}
          />
        </div>
      </Show>
    </div>
  );
}

export default NavbarAuth;
