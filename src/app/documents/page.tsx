"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import {
  FileText,
  Plus,
  Search,
  ArrowRight,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<
    "general" | "meeting_notes" | "agenda" | "project_brief"
  >("general");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ documents: any[] }>("/api/documents");
      setDocs(data.documents || []);
    } catch (err: any) {
      console.error("[Documents] Load error:", err);
      setError(err?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && createModalOpen) {
        setCreateModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createModalOpen]);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    setModalError(null);
    try {
      const data = await fetchJsonWithTimeout<{ success: boolean; document: any }>("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          templateType: selectedTemplate,
        }),
      });
      if (data.document?.id) {
        router.push(`/documents/${data.document.id}`);
      } else {
        throw new Error("Document created but no ID returned.");
      }
    } catch (err: any) {
      console.error("[Documents] Create error:", err);
      setModalError(err?.message || "Failed to create document.");
    } finally {
      setCreating(false);
    }
  };

  const filteredDocs = search.trim() === ""
    ? docs
    : docs.filter((d) => d.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Collaborative Documents
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, share, and edit meeting notes, agendas, and technical specs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setModalError(null);
                setNewTitle("");
                setCreateModalOpen(true);
              }}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Document</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search documents by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Documents Content States: Loading | Error | Success */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load documents"
            message={error}
            onRetry={loadDocuments}
          />
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No documents found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {search.trim() ? "No documents match your query." : "Click New Document above to create your first page."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#059669] transition-colors line-clamp-1">
                    {doc.title || "Untitled Document"}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mt-1 capitalize">
                    <span>{doc.templateType?.replace("_", " ") || "General"} template</span>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate max-w-[140px]">By {doc.authorName || "Team Member"}</span>
                  <span className="font-semibold text-[#059669] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
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
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Create Document</h3>
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

            <form onSubmit={handleCreateDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title
                </label>
                <Input
                  placeholder="e.g. Q4 Technical Roadmap"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Template
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "general", label: "Blank Document" },
                    { id: "meeting_notes", label: "Meeting Notes" },
                    { id: "agenda", label: "Meeting Agenda" },
                    { id: "project_brief", label: "Project Brief" },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tpl.id as any)}
                      className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                        selectedTemplate === tpl.id
                          ? "border-[#10B981] bg-emerald-50 text-[#059669]"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={!newTitle.trim() || creating}
                className="w-full h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs mt-2 shadow-sm shadow-emerald-500/20"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create & Open Document"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
