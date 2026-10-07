import { describe, it, expect } from "vitest";

describe("Recording & Transcription Pipeline", () => {
  it("tracks recording lifecycle states properly", () => {
    type RecordingStatus = "recording" | "processing" | "ready" | "failed";

    interface RecordingState {
      id: string;
      status: RecordingStatus;
      durationSeconds: number;
      fileUrl: string | null;
      storagePath: string | null;
    }

    const rec: RecordingState = {
      id: "rec_123",
      status: "recording",
      durationSeconds: 0,
      fileUrl: null,
      storagePath: null,
    };

    // Transition to processing upon stop
    const stopRecording = (item: RecordingState, duration: number, storagePath: string) => {
      item.status = "processing";
      item.durationSeconds = duration;
      item.storagePath = storagePath;
    };

    stopRecording(rec, 1845, "recordings/org_1/meeting_1/rec_123.mp4");
    expect(rec.status).toBe("processing");
    expect(rec.durationSeconds).toBe(1845);
    expect(rec.storagePath).toBe("recordings/org_1/meeting_1/rec_123.mp4");

    // Transition to ready once file is finalized
    const finalizeRecording = (item: RecordingState, signedUrl: string) => {
      item.status = "ready";
      item.fileUrl = signedUrl;
    };

    finalizeRecording(rec, "https://storage.kollab.internal/download?token=abc");
    expect(rec.status).toBe("ready");
    expect(rec.fileUrl).toContain("https://");
  });

  it("filters and searches transcript segments by keyword and speaker", () => {
    interface TranscriptSegment {
      id: string;
      speakerName: string;
      startTimeSeconds: number;
      endTimeSeconds: number;
      text: string;
    }

    const segments: TranscriptSegment[] = [
      {
        id: "seg_1",
        speakerName: "Sarah Chen",
        startTimeSeconds: 12.5,
        endTimeSeconds: 18.0,
        text: "We should launch the Pro plan next month with a 20% discount.",
      },
      {
        id: "seg_2",
        speakerName: "Alex Rivera",
        startTimeSeconds: 19.2,
        endTimeSeconds: 24.5,
        text: "Agreed. The billing gateway integration is already passing QA.",
      },
      {
        id: "seg_3",
        speakerName: "Sarah Chen",
        startTimeSeconds: 25.0,
        endTimeSeconds: 31.0,
        text: "Let us schedule a follow-up test with enterprise customers on Friday.",
      },
    ];

    // Search by keyword
    const searchKeyword = (q: string) =>
      segments.filter((s) => s.text.toLowerCase().includes(q.toLowerCase()));

    const proResults = searchKeyword("pro plan");
    expect(proResults.length).toBe(1);
    expect(proResults[0].speakerName).toBe("Sarah Chen");

    const billingResults = searchKeyword("billing");
    expect(billingResults.length).toBe(1);
    expect(billingResults[0].speakerName).toBe("Alex Rivera");

    // Filter by speaker
    const filterSpeaker = (speaker: string) =>
      segments.filter((s) => s.speakerName.toLowerCase().includes(speaker.toLowerCase()));

    const sarahSegments = filterSpeaker("Sarah Chen");
    expect(sarahSegments.length).toBe(2);
    expect(sarahSegments[0].startTimeSeconds).toBe(12.5);
    expect(sarahSegments[1].startTimeSeconds).toBe(25.0);
  });
});
