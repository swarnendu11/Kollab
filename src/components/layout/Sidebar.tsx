"use client";

import React, { useState, useEffect } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KollabLogo } from "@/components/ui/kollab-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Teams", href: "/teams", icon: Building2 },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Whiteboards", href: "/whiteboards", icon: Paintbrush },
  { name: "Files", href: "/files", icon: HardDrive },
  { name: "Recordings", href: "/recordings", icon: Film },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  isMobileDrawer?: boolean;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  isMobileDrawer = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const isCollapsed = collapsed && !isMobileDrawer;

  return (
    <aside
      className={cn(
        "border-r border-emerald-100/80 bg-white flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none transition-all duration-300 ease-in-out z-30",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div>
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-emerald-100/80 transition-all",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2.5 group overflow-hidden"
            title="Kollab Workspace"
          >
            <KollabLogo size={isCollapsed ? 32 : 36} />
            {!isCollapsed && (
              <div className="transition-opacity duration-200">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-950 via-[#047857] to-[#10B981] bg-clip-text text-transparent">
                  KOLLAB
                </span>
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/80">
                  Workspace
                </div>
              </div>
            )}
          </Link>

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onNavigate}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className={cn(
                  "p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors",
                  isCollapsed ? "hidden md:block" : ""
                )}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )
          )}
        </div>

        {/* Workspace Org Selector */}
        {!isCollapsed && (
          <div className="px-3.5 py-2.5 border-b border-emerald-50">
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#10B981] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  K
                </div>
                <div className="text-xs font-semibold text-emerald-950 truncate">
                  Kollab Workspace
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#059669] bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs shrink-0">
                PRO
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav
          className={cn(
            "p-2.5 space-y-1 overflow-y-auto",
            isCollapsed
              ? "max-h-[calc(100vh-10rem)]"
              : "max-h-[calc(100vh-14rem)]"
          )}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            if (isCollapsed) {
              return (
                <div key={item.name} className="relative group flex justify-center py-0.5">
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "w-11 h-11 flex items-center justify-center rounded-xl transition-all relative",
                      isActive
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-500 group-hover:text-indigo-600"
                      )}
                    />
                    {item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </Link>

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                    <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                      {item.name}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group min-h-[42px]",
                    isActive
                      ? "bg-gradient-to-r from-indigo-50/90 via-emerald-50/30 to-white text-indigo-950 font-bold border-l-4 border-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-indigo-600"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[11px] bg-gradient-to-r from-indigo-500 to-rose-500 text-white px-2 py-0.5 rounded-full font-bold shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Subitems if active */}
                {item.subItems && isActive && (
                  <div className="ml-7 pl-3 border-l-2 border-indigo-200 my-1 space-y-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={onNavigate}
                          className={cn(
                            "block text-xs py-1.5 px-2 rounded-lg transition-colors",
                            isSubActive
                              ? "text-indigo-700 font-bold bg-indigo-50/80"
                              : "text-slate-500 hover:text-slate-900"
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

      {/* Footer Profile & AI Helper */}
      <div className="p-3 border-t border-emerald-100/80 space-y-2">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/dashboard#ai-assistant"
              onClick={onNavigate}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#047857] text-white flex items-center justify-center shadow-md shadow-emerald-500/20 hover:scale-105 transition-transform"
              title="Ask Kollab AI"
            >
              <Sparkles className="w-4 h-4" />
            </Link>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {currentUser && (
              <Link
                href="/settings/profile"
                onClick={onNavigate}
                title={currentUser.fullName}
              >
                <Avatar className="w-8 h-8 ring-2 ring-emerald-300/40">
                  <AvatarImage src={currentUser.avatarUrl} />
                  <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800 font-bold">
                    {currentUser.fullName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        ) : (
          <>
            <Link
              href="/dashboard#ai-assistant"
              onClick={onNavigate}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-[#10B981]/25 hover:border-[#10B981]/50 transition-all group shadow-2xs"
            >
              <div className="w-7 h-7 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span>Ask Kollab AI</span>
                  <ChevronRight className="w-3 h-3 text-[#10B981] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
                <div className="text-[10px] text-emerald-700/80 truncate">
                  Meeting intelligence
                </div>
              </div>
            </Link>

            {currentUser ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="w-8 h-8 shrink-0 ring-1 ring-emerald-300/60">
                    <AvatarImage src={currentUser.avatarUrl} />
                    <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800 font-bold">
                      {currentUser.fullName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <Link
                  href="/settings"
                  onClick={onNavigate}
                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 text-xs text-slate-500 pt-1">
                <Link
                  href="/sign-in"
                  onClick={onNavigate}
                  className="hover:text-[#059669] font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  href="/sign-up"
                  onClick={onNavigate}
                  className="hover:text-[#059669] font-semibold transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
