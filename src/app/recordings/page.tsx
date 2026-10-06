"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import {
  Film,
  Play,
  Download,
  Trash2,
  Search,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [playingRecording, setPlayingRecording] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadRecordings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ recordings: any[] }>("/api/recordings");
      setRecordings(data.recordings || []);
    } catch (err: any) {
      console.error("[Recordings] Load error:", err);
      setError(err?.message || "Failed to load meeting recordings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this recording?")) {
      return;
    }
    setDeletingId(id);
    setActionError(null);
    try {
      await fetchJsonWithTimeout(`/api/recordings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      if (playingRecording?.id === id) setPlayingRecording(null);
    } catch (e: any) {
      console.error("[Recordings] Delete error:", e);
      setActionError(e?.message || "Failed to delete recording.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = search.trim() === ""
    ? recordings
    : recordings.filter((r) =>
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.meetingTitle?.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Meeting Recordings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Playback recorded video sessions, download media, and inspect session archives.
            </p>
          </div>
        </div>

        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-400 hover:text-rose-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search recordings by title..."
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
                  Duration: {formatDuration(playingRecording.durationSeconds || 0)}
                </span>
              </div>
              <button
                onClick={() => setPlayingRecording(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
                aria-label="Close player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
              {playingRecording.fileUrl ? (
                <video
                  src={playingRecording.fileUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <Film className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">Video file is still processing or unavailable.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content States: Loading | Error | Success */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load recordings"
            message={error}
            onRetry={loadRecordings}
          />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Film className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No recordings found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {search.trim() ? "No recordings match your search criteria." : "Start a meeting and hit Record to save your first session."}
            </p>
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
                    {formatDuration(rec.durationSeconds || 0)}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#059669] transition-colors line-clamp-1">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Recorded on {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
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
                      {rec.fileUrl && (
                        <a
                          href={rec.fileUrl}
                          download
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Download MP4"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(rec.id)}
                        disabled={deletingId === rec.id}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete recording"
                      >
                        {deletingId === rec.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
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
