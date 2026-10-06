"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import {
  Paintbrush,
  Plus,
  ArrowRight,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function WhiteboardsPage() {
  const router = useRouter();
  const [whiteboards, setWhiteboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadWhiteboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ whiteboards: any[] }>("/api/whiteboards");
      setWhiteboards(data.whiteboards || []);
    } catch (err: any) {
      console.error("[Whiteboards] Load error:", err);
      setError(err?.message || "Failed to load collaborative whiteboards.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWhiteboards();
  }, [loadWhiteboards]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && createModalOpen) {
        setCreateModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createModalOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setModalError(null);
    try {
      const data = await fetchJsonWithTimeout<{ success: boolean; whiteboard: any }>("/api/whiteboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (data.whiteboard?.id) {
        router.push(`/whiteboards/${data.whiteboard.id}`);
      } else {
        throw new Error("Whiteboard created but no ID returned.");
      }
    } catch (err: any) {
      console.error("[Whiteboards] Create error:", err);
      setModalError(err?.message || "Failed to create whiteboard.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Collaborative Whiteboards
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Visual brainstorming, flowcharts, architecture diagrams, and sticky notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setModalError(null);
                setTitle("");
                setCreateModalOpen(true);
              }}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Whiteboard</span>
            </Button>
          </div>
        </div>

        {/* Content States: Loading | Error | Success */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load whiteboards"
            message={error}
            onRetry={loadWhiteboards}
          />
        ) : whiteboards.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Paintbrush className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No whiteboards created</h3>
            <p className="text-xs text-slate-500 mt-1">Create your first collaborative canvas above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whiteboards.map((wb) => (
              <Link
                key={wb.id}
                href={`/whiteboards/${wb.id}`}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#EC4899]/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#EC4899] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Paintbrush className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#EC4899] transition-colors line-clamp-1">
                    {wb.title || "Untitled Whiteboard"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Created by {wb.authorName || "Team Member"}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Collaborative Canvas</span>
                  <span className="font-semibold text-[#EC4899] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#EC4899] flex items-center justify-center">
                  <Paintbrush className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">New Whiteboard</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Whiteboard Title
                </label>
                <Input
                  placeholder="e.g. Kollab Architecture Flowchart"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={!title.trim() || creating}
                className="w-full h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs mt-2 shadow-sm shadow-emerald-500/20"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Canvas"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
