import { describe, it, expect } from "vitest";

describe("WebRTC Telemetry & Active Speaker Logic", () => {
  it("computes connection quality rating accurately from WebRTC metrics", () => {
    const calculateQualityRating = (rttMs: number, packetLossPct: number, jitterMs: number): "Excellent" | "Good" | "Poor" => {
      if (rttMs < 100 && packetLossPct < 2 && jitterMs < 20) {
        return "Excellent";
      }
      if (rttMs < 300 && packetLossPct < 6 && jitterMs < 50) {
        return "Good";
      }
      return "Poor";
    };

    expect(calculateQualityRating(25, 0.1, 4)).toBe("Excellent");
    expect(calculateQualityRating(180, 3.5, 30)).toBe("Good");
    expect(calculateQualityRating(450, 12, 85)).toBe("Poor");
  });

  it("prioritizes active speakers and pinned participants in grid layout", () => {
    interface Participant {
      id: string;
      name: string;
      isSpeaking: boolean;
      isPinned: boolean;
      isLocal: boolean;
    }

    const participants: Participant[] = [
      { id: "1", name: "Guest 1", isSpeaking: false, isPinned: false, isLocal: false },
      { id: "2", name: "Speaker Bob", isSpeaking: true, isPinned: false, isLocal: false },
      { id: "3", name: "Pinned Alice", isSpeaking: false, isPinned: true, isLocal: false },
      { id: "4", name: "Local Me", isSpeaking: false, isPinned: false, isLocal: true },
    ];

    const sortParticipants = (list: Participant[]) => {
      return [...list].sort((a, b) => {
        // Pinned comes first
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        // Active speaker comes next
        if (a.isSpeaking !== b.isSpeaking) return a.isSpeaking ? -1 : 1;
        // Local participant comes next
        if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    };

    const sorted = sortParticipants(participants);
    expect(sorted[0].id).toBe("3"); // Pinned Alice
    expect(sorted[1].id).toBe("2"); // Speaker Bob
    expect(sorted[2].id).toBe("4"); // Local Me
    expect(sorted[3].id).toBe("1"); // Guest 1
  });
});
