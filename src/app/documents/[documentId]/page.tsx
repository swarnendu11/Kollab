"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import {
  FileText,
  Save,
  ArrowLeft,
  Download,
  Loader2,
  Wand2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [aiPolishing, setAiPolishing] = useState(false);

  const loadDocument = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ document: any }>(`/api/documents/${documentId}`);
      if (data.document) {
        setDocument(data.document);
        setTitle(data.document.title || "");
        setContent(data.document.content || "");
      } else {
        throw new Error("Document not found or you do not have permission to view it.");
      }
    } catch (err: any) {
      console.error("[DocumentEditor] Load error:", err);
      setError(err?.message || "Document not found or unable to load.");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await fetchJsonWithTimeout(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "Untitled Document", content }),
      });
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      console.error("[DocumentEditor] Save error:", e);
      setSaveError(e?.message || "Failed to save document changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIPolish = async () => {
    setAiPolishing(true);
    setSaveError(null);
    try {
      const data = await fetchJsonWithTimeout<{ response?: string }>("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Enhance and polish this document with clean markdown formatting:\n\n${content}`,
          mode: "draft",
          tone: "professional",
        }),
      });
      if (data?.response) {
        setContent(data.response);
      }
    } catch (err: any) {
      console.error("[DocumentEditor] AI error:", err);
      setSaveError("AI polish service temporarily unavailable.");
    } finally {
      setAiPolishing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${(title || "document").replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="h-64 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error || !document) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-12">
          <ErrorState
            title="Document Unavailable"
            message={error || "This document does not exist or you don't have access."}
            onRetry={loadDocument}
          />
          <div className="text-center mt-4">
            <Link href="/documents">
              <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Documents</span>
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Back to all documents"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title"
              className="text-xl sm:text-2xl font-extrabold text-slate-900 bg-transparent outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 w-full max-w-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIPolish}
              disabled={aiPolishing}
              className="h-9 rounded-xl text-xs gap-1.5 text-emerald-700 border-emerald-200/60 hover:bg-emerald-50"
            >
              {aiPolishing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Wand2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="hidden sm:inline">AI Polish</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-9 rounded-xl text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export .md</span>
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? "Saved!" : "Save"}</span>
            </Button>
          </div>
        </div>

        {saveError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Markdown format supported</span>
          {lastSaved && <span>Last saved at {lastSaved}</span>}
        </div>

        {/* Live Document Editor */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[500px]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={22}
            className="w-full h-full bg-transparent text-slate-800 text-sm leading-relaxed outline-none resize-none font-mono"
            placeholder="Type your notes or markdown here..."
          />
        </div>
      </div>
    </AppShell>
  );
}
