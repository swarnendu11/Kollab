"use client";

import React, { ReactNode, useState, useEffect } from "react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize and persist sidebar collapse preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kollab_sidebar_collapsed");
      if (stored !== null) {
        setSidebarCollapsed(stored === "true");
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        // Default collapsed on tablet screens for better content visibility
        setSidebarCollapsed(true);
      }
    } catch {
      // In SSR or restricted storage
    }
  }, []);

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kollab_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // If in meeting room full screen, don't show standard shell
  if (pathname.startsWith("/meeting/") && !pathname.endsWith("/summary")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F4FAF6]">
      {/* Desktop / Tablet Sidebar (Collapsible) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      {/* Mobile Drawer (Slide-out Sidebar for Smartphones and Tablets) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-50 animate-in slide-in-from-left duration-250">
            <Sidebar
              collapsed={false}
              isMobileDrawer={true}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <Topbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Quick thumb access for Smartphones) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-emerald-100 z-40 flex items-center justify-around px-2 shadow-lg">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2.5 rounded-xl transition-colors",
            pathname === "/dashboard"
              ? "text-[#059669] font-bold"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        <Link
          href="/meetings"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2.5 rounded-xl transition-colors",
            pathname.startsWith("/meetings")
              ? "text-[#059669] font-bold"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Video className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Meet</span>
        </Link>

        <Link
          href="/calendar"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2.5 rounded-xl transition-colors",
            pathname.startsWith("/calendar")
              ? "text-[#059669] font-bold"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Calendar</span>
        </Link>

        <Link
          href="/chat"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2.5 rounded-xl transition-colors",
            pathname.startsWith("/chat")
              ? "text-[#059669] font-bold"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Chat</span>
        </Link>

        <Link
          href="/documents"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2.5 rounded-xl transition-colors",
            pathname.startsWith("/documents")
              ? "text-[#059669] font-bold"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Docs</span>
        </Link>

        <Link
          href="/recordings"
          className={cn(
            "flex flex-col items-center justify-center text-xs py-1 px-2.5 rounded-xl transition-colors",
            pathname.startsWith("/recordings")
              ? "text-[#059669] font-bold"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Rec</span>
        </Link>
      </div>
    </div>
  );
}
