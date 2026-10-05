import React from "react";
import { cn } from "@/lib/utils";

interface KollabLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: "mark" | "full";
}

/**
 * KOLLAB Collaborating Camera Logo
 * Inspired by Google Meet's geometric camera design, reimagined with
 * interlocking collaboration segments in an emerald, mint & deep forest green palette.
 */
export function KollabLogo({
  size = 36,
  className,
  showText = false,
  textClassName,
  variant = "mark",
}: KollabLogoProps) {
  const pixelSize = typeof size === "number" ? `${size}px` : size;

  const LogoMark = (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={cn("relative flex items-center justify-center shrink-0 select-none", className)}
    >
      <svg
        viewBox="0 0 192 192"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-105"
      >
        <defs>
          {/* Gradients for smooth modern 3-color depth: Indigo, Emerald, Coral */}
          <linearGradient id="kollab-indigo-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          <linearGradient id="kollab-emerald-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <linearGradient id="kollab-indigo-deep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>

          <linearGradient id="kollab-bottom-curve" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>

          <linearGradient id="kollab-lens-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="50%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>

          <linearGradient id="kollab-lens-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>
        </defs>

        {/* 1. Top Rounded Camera Cap (Electric Indigo Bar) */}
        <path
          d="M 35.5 47.5 C 35.5 35 45.5 25 58 25 L 129 25 L 129 47.5 L 35.5 47.5 Z"
          fill="url(#kollab-indigo-top)"
        />

        {/* 2. Upper-Left Collaboration Segment */}
        <path
          d="M 35.5 47.5 L 84 47.5 L 84 96 L 35.5 96 Z"
          fill="url(#kollab-emerald-main)"
        />

        {/* 3. Upper-Right Center Camera Hub */}
        <path
          d="M 84 47.5 L 129 47.5 L 129 96 L 84 96 Z"
          fill="#10B981"
        />

        {/* 4. Lower Collaborative Body */}
        <path
          d="M 35.5 96 L 129 96 L 129 144.5 L 35.5 144.5 Z"
          fill="url(#kollab-indigo-deep)"
        />

        {/* 5. Bottom Rounded Camera Base */}
        <path
          d="M 35.5 144.5 C 35.5 157 45.5 167 58 167 L 129 167 L 129 144.5 L 35.5 144.5 Z"
          fill="url(#kollab-bottom-curve)"
        />

        {/* 6. Upper Lens Projection Facet */}
        <path
          d="M 129 96 L 156.5 68.5 L 156.5 47.5 L 129 69 L 129 96 Z"
          fill="url(#kollab-lens-dark)"
        />

        {/* 7. Camera Projection Lens Cone (Warm Sunset Coral) */}
        <path
          d="M 156.5 47.5 L 129 69 L 129 96 L 156.5 117.5 L 176.5 102 C 180 99.5 182 95.5 182 91 L 182 61 C 182 56.5 180 52.5 176.5 50 L 156.5 47.5 Z"
          fill="url(#kollab-lens-grad)"
        />

        {/* 8. Collaborative Focal Core */}
        <circle cx="84" cy="96" r="10" fill="#FFFFFF" opacity="0.95" />
        <circle cx="84" cy="96" r="6" fill="#4F46E5" />
        <path
          d="M 80 96 C 80 93.8 81.8 92 84 92 C 86.2 92 88 93.8 88 96"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  if (variant === "mark" && !showText) {
    return LogoMark;
  }

  return (
    <div className="flex items-center gap-2.5">
      {LogoMark}
      {(showText || variant === "full") && (
        <span
          className={cn(
            "font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-emerald-600 to-rose-600 bg-clip-text text-transparent",
            textClassName
          )}
        >
          KOLLAB
        </span>
      )}
    </div>
  );
}

export default KollabLogo;
