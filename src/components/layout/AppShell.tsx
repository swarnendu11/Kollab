"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import {
  LayoutDashboard,
  Video,
  Calendar,
  MessageSquare,
  FileText,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // If in meeting room full screen, don't show standard shell
  if (pathname.startsWith("/meeting/") && !pathname.endsWith("/summary")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F4FAF6]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-emerald-100 z-40 flex items-center justify-around px-2">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2 rounded-lg transition-colors",
            pathname === "/dashboard" ? "text-[#059669] font-bold" : "text-slate-500"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        <Link
          href="/meetings"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2 rounded-lg transition-colors",
            pathname.startsWith("/meetings") ? "text-[#059669] font-bold" : "text-slate-500"
          )}
        >
          <Video className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Meet</span>
        </Link>

        <Link
          href="/calendar"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2 rounded-lg transition-colors",
            pathname.startsWith("/calendar") ? "text-[#059669] font-bold" : "text-slate-500"
          )}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Calendar</span>
        </Link>

        <Link
          href="/chat"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2 rounded-lg transition-colors",
            pathname.startsWith("/chat") ? "text-[#059669] font-bold" : "text-slate-500"
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Chat</span>
        </Link>

        <Link
          href="/documents"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2 rounded-lg transition-colors",
            pathname.startsWith("/documents") ? "text-[#059669] font-bold" : "text-slate-500"
          )}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Docs</span>
        </Link>

        <Link
          href="/recordings"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2 rounded-lg transition-colors",
            pathname.startsWith("/recordings") ? "text-[#059669] font-bold" : "text-slate-500"
          )}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Rec</span>
        </Link>
      </div>
    </div>
  );
}
