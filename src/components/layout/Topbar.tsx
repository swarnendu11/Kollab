"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Bell,
  Video,
  Calendar,
  MessageSquare,
  FileText,
  Paintbrush,
  Check,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Sparkles,
  LogIn,
  UserPlus,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearchModal } from "@/components/ui/global-search";

interface TopbarProps {
  onToggleMobileMenu?: () => void;
}

export function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

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

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      })
      .catch(() => {
        // Notifications fallback
      });
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signout" }),
    });
    setCurrentUser(null);
    setProfileOpen(false);
    window.location.href = "/sign-in";
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="h-16 border-b border-emerald-100/80 bg-white/95 backdrop-blur-md sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none">
        {/* Left Side: Mobile Menu Button & Global Search trigger */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-emerald-950 hover:bg-emerald-50 transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-all w-full max-w-[280px] sm:max-w-xs group shadow-2xs"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-[#10B981] transition-colors shrink-0" />
            <span className="truncate">Search meetings, chat, docs...</span>
            <kbd className="hidden sm:inline-block ml-auto text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Create Dropdown */}
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setCreateOpen(!createOpen)}
              className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl shadow-sm shadow-emerald-500/25 px-2.5 sm:px-3.5 h-9 font-semibold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </Button>

            {createOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCreateOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Create New
                  </div>
                  <Link
                    href="/meeting/new"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#059669] flex items-center justify-center group-hover:bg-[#10B981] group-hover:text-white transition-colors">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Instant Meeting</div>
                      <div className="text-[10px] text-slate-400">Launch a video call</div>
                    </div>
                  </Link>

                  <Link
                    href="/calendar"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Schedule Event</div>
                      <div className="text-[10px] text-slate-400">Add to calendar</div>
                    </div>
                  </Link>

                  <Link
                    href="/documents"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">New Document</div>
                      <div className="text-[10px] text-slate-400">Live notes & brief</div>
                    </div>
                  </Link>

                  <Link
                    href="/whiteboards"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Paintbrush className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Whiteboard</div>
                      <div className="text-[10px] text-slate-400">Collaborative canvas</div>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-emerald-950 hover:bg-emerald-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-emerald-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-[#059669] hover:underline font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="py-2 space-y-1.5 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications right now
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || "#"}
                          onClick={() => setNotificationsOpen(false)}
                          className={`block p-2.5 rounded-xl transition-colors ${
                            n.read
                              ? "hover:bg-slate-50 text-slate-600"
                              : "bg-emerald-50/50 hover:bg-emerald-50 text-slate-900 border border-emerald-100/60"
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>{n.title}</span>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pl-2 sm:pl-3 rounded-full hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all group"
              >
                <span className="hidden md:inline-block text-xs font-bold text-slate-800 max-w-[120px] truncate">
                  {currentUser.fullName}
                </span>
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-1 ring-[#10B981]/40">
                  <AvatarImage src={currentUser.avatarUrl} />
                  <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800 font-bold">
                    {currentUser.fullName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors mr-1" />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-slate-100">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {currentUser.fullName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-1.5 inline-block text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {currentUser.role || "Admin"}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-emerald-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Profile & Preferences</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-emerald-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Workspace Settings</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-semibold text-slate-700"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Global search modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
