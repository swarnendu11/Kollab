"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewMeetingPage() {
  const router = useRouter();

  useEffect(() => {
    async function create() {
      try {
        const res = await fetch("/api/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Instant Meeting - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            isInstant: true,
          }),
        });
        const data = await res.json();
        if (data.meeting?.id) {
          router.replace(`/meeting/${data.meeting.id}/prejoin`);
        } else {
          router.replace("/meetings");
        }
      } catch {
        router.replace("/meetings");
      }
    }
    create();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <Loader2 className="w-8 h-8 text-[#10B981] animate-spin mb-4" />
      <p className="text-sm font-semibold tracking-wide">Initializing secure Kollab meeting room...</p>
    </div>
  );
}
