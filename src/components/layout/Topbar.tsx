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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearchModal } from "@/components/ui/global-search";
import { KollabLogo } from "@/components/ui/kollab-logo";

export function Topbar() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "notif_1",
      title: "Weekly Product Design Sync",
      message: "Meeting starting in 1 hour. Prejoin is open.",
      read: false,
      link: "/meeting/meet_product_sync/prejoin",
    },
    {
      id: "notif_2",
      title: "Recording Ready",
      message: "Kollab 2.0 Launch Strategy session is ready.",
      read: false,
      link: "/recordings",
    },
    {
      id: "notif_3",
      title: "New message in #general",
      message: "Sarah: Loving the new green UI palette!",
      read: true,
      link: "/chat",
    },
  ]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
        if (data.availableUsers) setAvailableUsers(data.availableUsers);
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  const switchUser = async (userId: string) => {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setProfileOpen(false);
    window.location.reload();
  };

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="h-16 border-b border-emerald-100/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Global Search trigger & Mobile Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="lg:hidden flex items-center gap-1.5 shrink-0 mr-1">
            <KollabLogo size={30} />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-950 to-[#10B981] bg-clip-text text-transparent hidden xs:inline">
              KOLLAB
            </span>
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm text-slate-500 bg-emerald-50/50 hover:bg-emerald-100/60 rounded-xl transition-colors border border-emerald-200/60 w-52 sm:w-72"
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span className="truncate">Search or press</span>
            <kbd className="ml-auto text-xs bg-white text-emerald-800 font-mono px-1.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Action icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Create Dropdown */}
          <div className="relative">
            <Button
              onClick={() => setCreateOpen(!createOpen)}
              className="gap-1.5 rounded-xl h-9 px-3.5 bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] hover:opacity-95 text-white shadow-sm shadow-emerald-600/25"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5" />
            </Button>

            {createOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCreateOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-emerald-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    href="/meeting/new"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#047857] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Start Instant Meeting</div>
                      <div className="text-xs text-slate-400">Launch a live room</div>
                    </div>
                  </Link>

                  <Link
                    href="/calendar"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#047857] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Schedule Meeting</div>
                      <div className="text-xs text-slate-400">Set date & invites</div>
                    </div>
                  </Link>

                  <Link
                    href="/chat"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#047857] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">New Chat</div>
                      <div className="text-xs text-slate-400">Direct or channel</div>
                    </div>
                  </Link>

                  <Link
                    href="/documents"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#047857] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">New Document</div>
                      <div className="text-xs text-slate-400">Notes & agenda</div>
                    </div>
                  </Link>

                  <Link
                    href="/whiteboards"
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#047857] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center">
                      <Paintbrush className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">New Whiteboard</div>
                      <div className="text-xs text-slate-400">Collaborative canvas</div>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Notifications button & popover */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-emerald-950 hover:bg-emerald-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#10B981] rounded-full ring-2 ring-white animate-pulse shadow-sm" />
              )}
            </button>

            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-emerald-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900">Notifications</span>
                    <button
                      onClick={() => {
                        setNotifications(notifications.map((n) => ({ ...n, read: true })));
                      }}
                      className="text-xs text-[#059669] font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => setNotificationsOpen(false)}
                        className={`block p-3.5 hover:bg-emerald-50/50 transition-colors ${
                          !notif.read ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-900">{notif.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{notif.message}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dynamic Authentication Navbar Display */}
          {currentUser ? (
            /* WHEN SIGNED IN: Totally hide Sign In & Sign Up, show ONLY Name and Accounts */
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-full hover:bg-emerald-50 transition-colors border border-emerald-200/90 shadow-2xs group"
              >
                <span className="text-xs font-bold text-emerald-950 max-w-[120px] truncate">
                  {currentUser.fullName}
                </span>
                <Avatar className="w-8 h-8 ring-2 ring-[#10B981]/30">
                  <AvatarImage src={currentUser.avatarUrl} />
                  <AvatarFallback>{currentUser.fullName?.[0] || "U"}</AvatarFallback>
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
                      <div className="font-semibold text-sm text-slate-900">{currentUser.fullName}</div>
                      <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                      <div className="mt-1 text-[11px] font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block border border-emerald-100">
                        {currentUser.role || "Member"}
                      </div>
                    </div>

                    {/* Switch user demo selector */}
                    <div className="py-2 border-b border-slate-100">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Switch Active User
                      </div>
                      {availableUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => switchUser(u.id)}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={u.avatarUrl} />
                              <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <span className={u.id === currentUser.id ? "font-bold text-[#059669]" : "text-slate-700"}>
                              {u.fullName}
                            </span>
                          </div>
                          {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                        </button>
                      ))}
                    </div>

                    <Link
                      href="/settings/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* WHEN NOT SIGNED IN: Show Sign In and Sign Up buttons */
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-xs font-semibold text-slate-700 hover:text-emerald-950 hover:bg-emerald-50 rounded-xl flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-emerald-600" />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="h-9 px-3.5 text-xs bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-sm shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
