"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Film,
  Play,
  Clock,
  Download,
  Trash2,
  Share2,
  Sparkles,
  Search,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [playingRecording, setPlayingRecording] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/recordings")
      .then((r) => r.json())
      .then((d) => {
        if (d.recordings) setRecordings(d.recordings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/recordings?id=${id}`, { method: "DELETE" });
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      if (playingRecording?.id === id) setPlayingRecording(null);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = search.trim() === ""
    ? recordings
    : recordings.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Meeting Recordings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Playback recorded video sessions, download media, and inspect AI transcripts.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search recordings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl bg-white border border-slate-200 outline-none w-full focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Video Player Modal */}
        {playingRecording && (
          <div className="p-6 bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{playingRecording.title}</h3>
                <span className="text-xs text-slate-400">
                  Duration: {formatDuration(playingRecording.durationSeconds)}
                </span>
              </div>
              <button
                onClick={() => setPlayingRecording(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                src={playingRecording.fileUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Recordings Grid */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Film className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No recordings found</h3>
            <p className="text-xs text-slate-500 mt-1">Start a meeting and hit Record to save your first session.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* Thumbnail with duration badge */}
                <div
                  onClick={() => setPlayingRecording(rec)}
                  className="aspect-video bg-slate-900 relative cursor-pointer overflow-hidden group/thumb"
                >
                  <img
                    src={rec.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600"}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center group-hover/thumb:bg-slate-950/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform shadow-emerald-500/30">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[11px] font-mono font-medium text-white">
                    {formatDuration(rec.durationSeconds)}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#059669] transition-colors line-clamp-1">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Recorded on {new Date(rec.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setPlayingRecording(rec)}
                      className="font-semibold text-[#059669] hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={rec.fileUrl}
                        download
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Download MP4"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
