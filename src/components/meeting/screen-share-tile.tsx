"use client";

import React, { useEffect, useRef, useState } from "react";
import { Monitor, Maximize2, Minimize2 } from "lucide-react";

interface ScreenShareTileProps {
  screenTrack: MediaStreamTrack | null;
  presenterName: string;
  isLocal: boolean;
  onStopSharing?: () => void;
}

export function ScreenShareTile({
  screenTrack,
  presenterName,
  isLocal,
  onStopSharing,
}: ScreenShareTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !screenTrack) return;

    const stream = new MediaStream([screenTrack]);
    el.srcObject = stream;
    el.play().catch(() => {});

    return () => {
      if (el) el.srcObject = null;
    };
  }, [screenTrack]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl bg-black border border-[#253047] overflow-hidden flex items-center justify-center group"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />

      {/* Presenter Banner */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-200 shadow-xl">
        <Monitor className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold">
          {isLocal ? "You are sharing your screen" : `${presenterName}'s Screen`}
        </span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isLocal && onStopSharing && (
          <button
            onClick={onStopSharing}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-lg transition-colors"
          >
            Stop Sharing
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 backdrop-blur-md transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
