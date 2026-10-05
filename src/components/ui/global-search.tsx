"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Video,
  MessageSquare,
  FileText,
  Calendar,
  Users,
  HardDrive,
  Film,
  Sparkles,
  X,
  ArrowRight,
  Settings,
  Paintbrush,
} from "lucide-react";

interface SearchResult {
  id: string;
  category: "meeting" | "chat" | "document" | "recording" | "file" | "contact" | "setting";
  title: string;
  subtitle: string;
  url: string;
  icon: any;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const items: SearchResult[] = [
    {
      id: "nav_1",
      category: "meeting",
      title: "Video Meetings",
      subtitle: "Instant calls, scheduled meetings, and room codes",
      url: "/meetings",
      icon: Video,
    },
    {
      id: "nav_2",
      category: "meeting",
      title: "Start Instant Meeting",
      subtitle: "Launch a WebRTC video meeting right now",
      url: "/meeting/new",
      icon: Video,
    },
    {
      id: "nav_3",
      category: "chat",
      title: "Team Chat & Channels",
      subtitle: "#general, #announcements, #engineering, #random",
      url: "/chat",
      icon: MessageSquare,
    },
    {
      id: "nav_4",
      category: "document",
      title: "Collaborative Documents",
      subtitle: "Meeting notes, project briefs, and specifications",
      url: "/documents",
      icon: FileText,
    },
    {
      id: "nav_5",
      category: "document",
      title: "Whiteboards",
      subtitle: "Interactive canvas for diagrams, sketches, and sticky notes",
      url: "/whiteboards",
      icon: Paintbrush,
    },
    {
      id: "nav_6",
      category: "recording",
      title: "Cloud Recordings",
      subtitle: "Video playback, AI summaries, and timestamped transcripts",
      url: "/recordings",
      icon: Film,
    },
    {
      id: "nav_7",
      category: "contact",
      title: "Contacts & Directory",
      subtitle: "Workspace members and email directory",
      url: "/contacts",
      icon: Users,
    },
    {
      id: "nav_8",
      category: "contact",
      title: "Teams & Organization",
      subtitle: "Manage workspace roles and member invitations",
      url: "/teams",
      icon: Users,
    },
    {
      id: "nav_9",
      category: "setting",
      title: "Settings & Audio/Video",
      subtitle: "Microphone noise suppression, camera lighting, profile",
      url: "/settings",
      icon: Settings,
    },
  ];

  const filtered = query.trim() === ""
    ? items
    : items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-emerald-50 gap-3">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            placeholder="Search meetings, messages, files, documents, people, recordings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-base bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ESC
          </span>
        </div>

        {/* Results list */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-slate-400 mt-1">Try searching for meetings, channels, or colleagues</p>
            </div>
          ) : (
            filtered.map((res) => {
              const Icon = res.icon;
              return (
                <button
                  key={res.id}
                  onClick={() => {
                    onClose();
                    router.push(res.url);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50/70 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0 group-hover:bg-[#10B981] group-hover:text-white transition-colors shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-[#047857] transition-colors">
                        {res.title}
                      </div>
                      <div className="text-xs text-slate-500">{res.subtitle}</div>
                    </div>
                  </div>
                  <span className="text-xs uppercase font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 group-hover:bg-[#10B981] group-hover:text-white transition-colors">
                    {res.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Quick hint footer */}
        <div className="p-3 bg-emerald-50/40 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Kollab instant unified search</span>
          </div>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
