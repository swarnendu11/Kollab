"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Do guests need an account or software download to join a meeting?",
      a: "No! Guests can join any Kollab video meeting with a single click in their browser on desktop or mobile. No downloads, extensions, or account creations are required.",
    },
    {
      q: "How does the autonomous AI generate meeting summaries and action items?",
      a: "Our background audio diarization pipeline transcribes speakers in real-time. Immediately upon meeting wrap-up, Kollab AI structures the conversation into an executive brief, consensus decisions, and assigns action items to recognized team members.",
    },
    {
      q: "Is WebRTC communication encrypted and secure?",
      a: "Yes. All media streams are encrypted using DTLS-SRTP protocols directly end-to-end. Room tokens and database permissions are strictly verified server-side.",
    },
    {
      q: "Can I use collaborative whiteboards and chat during a live video call?",
      a: "Yes! Kollab features an in-meeting slide-out drawer that lets you brainstorm on the canvas or chat with participants without ever leaving your call or switching tabs.",
    },
    {
      q: "What database powers Kollab data persistence?",
      a: "Kollab uses an embedded PostgreSQL engine (PGlite) with multi-process concurrency locks and automatic fallback, persisting all organizations, meetings, transcripts, and chat history reliably.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden transition-all"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors"
            >
              <span>{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-indigo-600" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-50 animate-in fade-in duration-200">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
