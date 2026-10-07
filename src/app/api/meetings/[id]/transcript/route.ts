import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, transcripts, transcriptSegments } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, or, desc, ilike, and } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("query")?.trim() || searchParams.get("q")?.trim() || "";
    const speakerFilter = searchParams.get("speaker")?.trim() || "";

    const db = await getDb();
    const meetingQuery = await db
      .select()
      .from(meetings)
      .where(or(eq(meetings.id, id), eq(meetings.joinCode, id)))
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];

    // Find main transcript for this meeting
    const existingTranscript = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, meeting.id))
      .orderBy(desc(transcripts.createdAt))
      .limit(1);

    if (existingTranscript.length === 0) {
      return NextResponse.json({
        transcript: null,
        segments: [],
        totalSegments: 0,
        matches: [],
      });
    }

    const t = existingTranscript[0];

    // Fetch segments
    let segments = await db
      .select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.transcriptId, t.id))
      .orderBy(transcriptSegments.startTimeSeconds);

    if (speakerFilter) {
      segments = segments.filter((s: any) =>
        s.speakerName.toLowerCase().includes(speakerFilter.toLowerCase())
      );
    }

    let matches = segments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matches = segments.filter(
        (s: any) =>
          s.text.toLowerCase().includes(q) ||
          s.speakerName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      transcript: t,
      segments,
      matches: searchQuery ? matches : [],
      totalSegments: segments.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const {
      speakerId,
      speakerName,
      text,
      startTimeSeconds = 0,
      endTimeSeconds = 0,
    } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const db = await getDb();
    const meetingQuery = await db
      .select()
      .from(meetings)
      .where(or(eq(meetings.id, id), eq(meetings.joinCode, id)))
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];

    // Find or create main transcript record
    let transcriptRecord = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, meeting.id))
      .limit(1);

    let transcriptId: string;
    if (transcriptRecord.length === 0) {
      transcriptId = createId("tr");
      await db.insert(transcripts).values({
        id: transcriptId,
        meetingId: meeting.id,
        fullText: `${speakerName || user.fullName}: ${text.trim()}`,
        language: "en",
        createdAt: new Date(),
      });
    } else {
      transcriptId = transcriptRecord[0].id;
      const updatedFullText = `${transcriptRecord[0].fullText}\n${speakerName || user.fullName}: ${text.trim()}`;
      await db
        .update(transcripts)
        .set({ fullText: updatedFullText })
        .where(eq(transcripts.id, transcriptId));
    }

    // Insert timestamped segment
    const segmentId = createId("ts");
    const newSegment = {
      id: segmentId,
      transcriptId,
      speakerName: speakerName || user.fullName,
      speakerId: speakerId || user.id,
      startTimeSeconds: Number(startTimeSeconds),
      endTimeSeconds: Number(endTimeSeconds || startTimeSeconds + 2),
      text: text.trim(),
    };

    await db.insert(transcriptSegments).values(newSegment);

    // Broadcast realtime live caption / transcript event
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "meeting.caption.created",
      organizationId: user.organizationId,
      timestamp: new Date().toISOString(),
      payload: {
        meetingId: meeting.id,
        segment: newSegment,
      },
    });

    return NextResponse.json({
      success: true,
      segment: newSegment,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
