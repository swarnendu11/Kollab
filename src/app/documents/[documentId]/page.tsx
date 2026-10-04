"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Save,
  Check,
  Sparkles,
  ArrowLeft,
  Share2,
  Download,
  Loader2,
  Wand2,
} from "lucide-react";

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [aiPolishing, setAiPolishing] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${documentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.document) {
          setDocument(d.document);
          setTitle(d.document.title);
          setContent(d.document.content);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [documentId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIPolish = async () => {
    setAiPolishing(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Enhance and polish this document with clean markdown formatting:\n\n${content}`,
          mode: "draft",
          tone: "professional",
        }),
      });
      const data = await res.json();
      if (data.response) {
        setContent(data.response);
      }
    } catch {
      //
    } finally {
      setAiPolishing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.md`;
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

  return (
    <AppShell>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl sm:text-2xl font-extrabold text-slate-900 bg-transparent outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1"
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
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save</span>
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Auto-save enabled</span>
          {lastSaved && <span>Last saved at {lastSaved}</span>}
        </div>

        {/* Live Document Editor */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[500px]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full h-full bg-transparent text-slate-800 text-sm leading-relaxed outline-none resize-none font-mono"
            placeholder="Type your notes or markdown here..."
          />
        </div>
      </div>
    </AppShell>
  );
}
