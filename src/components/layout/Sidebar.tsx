"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  Calendar,
  MessageSquare,
  Users,
  Building2,
  FileText,
  Paintbrush,
  HardDrive,
  Film,
  Settings,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KollabLogo } from "@/components/ui/kollab-logo";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  subItems?: { name: string; href: string }[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Meetings",
    href: "/meetings",
    icon: Video,
    subItems: [
      { name: "Upcoming", href: "/meetings/upcoming" },
      { name: "History", href: "/meetings/history" },
    ],
  },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Chat", href: "/chat", icon: MessageSquare, badge: "3" },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Teams", href: "/teams", icon: Building2 },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Whiteboards", href: "/whiteboards", icon: Paintbrush },
  { name: "Files", href: "/files", icon: HardDrive },
  { name: "Recordings", href: "/recordings", icon: Film },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-emerald-100/80 bg-white flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-emerald-100/80 gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <KollabLogo size={36} />
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-950 via-[#047857] to-[#10B981] bg-clip-text text-transparent">
                KOLLAB
              </span>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/80">
                Workspace
              </div>
            </div>
          </Link>
        </div>

        {/* Workspace Org Selector */}
        <div className="px-4 py-3 border-b border-emerald-50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#10B981] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                K
              </div>
              <div className="text-xs font-semibold text-emerald-950">Kollab Core Team</div>
            </div>
            <span className="text-[10px] font-bold text-[#059669] bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
              PRO
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-[#10B981]/15 text-[#047857] font-bold"
                      : "text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-[#10B981]"
                          : "text-slate-400 group-hover:text-emerald-700"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-xs bg-[#10B981] text-white px-2 py-0.5 rounded-full font-bold shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Subitems if active */}
                {item.subItems && isActive && (
                  <div className="ml-7 pl-3 border-l-2 border-emerald-200 my-1 space-y-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "block text-xs py-1.5 px-2 rounded-lg transition-colors",
                            isSubActive
                              ? "text-[#047857] font-bold bg-emerald-50"
                              : "text-slate-500 hover:text-emerald-950"
                          )}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Kollab AI Assistant Quick Launch */}
      <div className="p-4 border-t border-emerald-100/80">
        <Link
          href="/dashboard#ai-assistant"
          className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-[#10B981]/25 hover:border-[#10B981]/50 transition-all group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
              Ask Kollab AI
              <ChevronRight className="w-3 h-3 text-[#10B981] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-emerald-700/80">Autonomous meeting intelligence</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
