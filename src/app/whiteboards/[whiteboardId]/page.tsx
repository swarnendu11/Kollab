"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import {
  Pen,
  Highlighter,
  Square,
  Circle,
  Eraser,
  Save,
  Download,
  ArrowLeft,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function WhiteboardCanvasPage() {
  const params = useParams();
  const router = useRouter();
  const whiteboardId = params.whiteboardId as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [whiteboard, setWhiteboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<"pen" | "highlighter" | "rect" | "circle" | "eraser">("pen");
  const [color, setColor] = useState("#10B981");
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadWhiteboard = useCallback(async () => {
    if (!whiteboardId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ whiteboard: any }>(`/api/whiteboards/${whiteboardId}`);
      if (data.whiteboard) {
        setWhiteboard(data.whiteboard);
      } else {
        throw new Error("Whiteboard not found or you don't have access.");
      }
    } catch (err: any) {
      console.error("[WhiteboardCanvas] Load error:", err);
      setError(err?.message || "Whiteboard not found or unable to load.");
    } finally {
      setLoading(false);
    }
  }, [whiteboardId]);

  useEffect(() => {
    loadWhiteboard();
  }, [loadWhiteboard]);

  // Canvas resize and restore or initial paint
  useEffect(() => {
    if (loading || !whiteboard) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.parentElement?.clientWidth || 1000;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If canvasData exists and is valid data URL, load it safely
    if (whiteboard.canvasData && typeof whiteboard.canvasData === "string" && whiteboard.canvasData.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => {
        console.warn("[WhiteboardCanvas] Could not decode canvasData image fallback");
      };
      img.src = whiteboard.canvasData;
    } else {
      // Draw initial collaborative starter diagram
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 3;
      ctx.strokeRect(80, 80, 180, 70);
      ctx.fillStyle = "#064E3B";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("Next.js Client", 100, 120);

      ctx.strokeStyle = "#10B981";
      ctx.strokeRect(340, 80, 180, 70);
      ctx.fillStyle = "#064E3B";
      ctx.fillText("PostgreSQL Backend", 355, 120);

      ctx.strokeStyle = "#3B82F6";
      ctx.strokeRect(600, 80, 180, 70);
      ctx.fillStyle = "#1E3A8A";
      ctx.fillText("LiveKit Media Mesh", 615, 120);

      // Connecting lines
      ctx.beginPath();
      ctx.moveTo(260, 115);
      ctx.lineTo(340, 115);
      ctx.strokeStyle = "#94A3B8";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(520, 115);
      ctx.lineTo(600, 115);
      ctx.stroke();
    }
  }, [loading, whiteboard]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen") {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === "highlighter") {
      ctx.strokeStyle = color + "55";
      ctx.lineWidth = lineWidth * 3;
      ctx.lineCap = "square";
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === "eraser") {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = lineWidth * 4;
      ctx.lineCap = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (startPos && snapshot) {
      ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === "rect") {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      } else if (tool === "circle") {
        ctx.beginPath();
        const radius = Math.hypot(x - startPos.x, y - startPos.y);
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL("image/png");
    const a = window.document.createElement("a");
    a.href = image;
    a.download = `${(whiteboard?.title || "whiteboard").replace(/\s+/g, "_")}.png`;
    a.click();
  };

  const saveWhiteboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      await fetchJsonWithTimeout(`/api/whiteboards/${whiteboardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canvasData: dataUrl,
          thumbnailUrl: dataUrl,
        }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      console.error("[WhiteboardCanvas] Save error:", err);
      setSaveError(err?.message || "Failed to save whiteboard.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWhiteboard = async () => {
    if (!confirm("Are you sure you want to permanently delete this whiteboard?")) return;
    setIsDeleting(true);
    setSaveError(null);
    try {
      await fetchJsonWithTimeout(`/api/whiteboards/${whiteboardId}`, {
        method: "DELETE",
      });
      router.push("/whiteboards");
    } catch (err: any) {
      console.error("[WhiteboardCanvas] Delete error:", err);
      setSaveError(err?.message || "Failed to delete whiteboard.");
      setIsDeleting(false);
    }
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

  if (error || !whiteboard) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-12">
          <ErrorState
            title="Whiteboard Unavailable"
            message={error || "This whiteboard does not exist or you don't have access."}
            onRetry={loadWhiteboard}
          />
          <div className="text-center mt-4">
            <Link href="/whiteboards">
              <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Whiteboards</span>
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-8rem)] flex flex-col space-y-3">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/whiteboards"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Back to all whiteboards"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-bold text-slate-900 truncate">{whiteboard?.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              className="h-8 rounded-lg text-xs gap-1 text-slate-600 hover:bg-slate-100 border-slate-200"
            >
              Clear
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportCanvas}
              className="h-8 rounded-lg text-xs gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteWhiteboard}
              disabled={isDeleting}
              className="h-8 rounded-lg text-xs gap-1 text-rose-600 hover:bg-rose-50 border-rose-200 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </Button>

            <Button
              size="sm"
              onClick={saveWhiteboard}
              disabled={isSaving}
              className="h-8 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold gap-1 shadow-sm shadow-emerald-500/20"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isSaved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaved ? "Saved!" : "Save"}</span>
            </Button>
          </div>
        </div>

        {saveError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Toolbar + Canvas Area */}
        <div className="flex-1 flex gap-3 min-h-0">
          {/* Tool Palette */}
          <div className="w-14 bg-white rounded-2xl border border-slate-200/80 p-2 flex flex-col items-center gap-2 shadow-xs shrink-0">
            <button
              onClick={() => setTool("pen")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                tool === "pen" ? "bg-[#10B981] text-white shadow-xs shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Pen"
              aria-label="Pen"
            >
              <Pen className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool("highlighter")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                tool === "highlighter" ? "bg-[#10B981] text-white shadow-xs shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Highlighter"
              aria-label="Highlighter"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool("rect")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                tool === "rect" ? "bg-[#10B981] text-white shadow-xs shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Rectangle"
              aria-label="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool("circle")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                tool === "circle" ? "bg-[#10B981] text-white shadow-xs shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Circle"
              aria-label="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool("eraser")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                tool === "eraser" ? "bg-[#10B981] text-white shadow-xs shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Eraser"
              aria-label="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>

            <div className="w-8 h-px bg-slate-200 my-1" />

            {/* Colors */}
            {[
              "#10B981", // Emerald Primary
              "#047857", // Deep Forest
              "#34D399", // Light Mint
              "#3B82F6", // Blue
              "#EC4899", // Pink
              "#0F172A", // Dark
            ].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === c ? "scale-110 border-slate-900" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              className="w-full h-full cursor-crosshair"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
