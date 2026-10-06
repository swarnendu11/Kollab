import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  meetingSummaries,
  meetingActionItems,
  transcripts,
  transcriptSegments,
  meetings,
  tasks,
  workspaceUsage,
} from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { extractMeetingIntelligence } from "@/lib/ai";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const db = await getDb();

    const summary = await db
      .select()
      .from(meetingSummaries)
      .where(eq(meetingSummaries.meetingId, id))
      .limit(1);

    const actionItems = await db
      .select()
      .from(meetingActionItems)
      .where(eq(meetingActionItems.meetingId, id));

    const meetingTranscript = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, id))
      .limit(1);

    let segments: any[] = [];
    if (meetingTranscript.length > 0) {
      segments = await db
        .select()
        .from(transcriptSegments)
        .where(eq(transcriptSegments.transcriptId, meetingTranscript[0].id));
    }

    return NextResponse.json({
      summary: summary[0] || null,
      actionItems,
      transcript: meetingTranscript[0] || null,
      segments,
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
    const { notes, capturedTranscript, segments = [] } = body;

    const db = await getDb();

    // Verify meeting exists
    const meetingQuery = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];
    const transcriptText = capturedTranscript?.trim() || notes?.trim();

    if (!transcriptText) {
      return NextResponse.json(
        {
          error: "No audible transcript or session notes were provided. Cannot generate AI summary.",
        },
        { status: 400 }
      );
    }

    // Run real AI structured extraction
    const intelligence = await extractMeetingIntelligence(transcriptText, meeting.title);

    // Save or update meeting summary
    const summaryId = createId("sum");
    const existingSummary = await db
      .select()
      .from(meetingSummaries)
      .where(eq(meetingSummaries.meetingId, id))
      .limit(1);

    if (existingSummary.length > 0) {
      await db
        .update(meetingSummaries)
        .set({
          summaryText: intelligence.summary,
          keyDecisions: intelligence.decisions,
          topics: intelligence.topics,
          importantMoments: intelligence.importantMoments.map((m) => ({
            time: `${Math.floor(m.timestamp / 60).toString().padStart(2, "0")}:${(m.timestamp % 60).toString().padStart(2, "0")}`,
            title: m.title,
            note: m.description,
          })),
        })
        .where(eq(meetingSummaries.id, existingSummary[0].id));
    } else {
      await db.insert(meetingSummaries).values({
        id: summaryId,
        meetingId: id,
        summaryText: intelligence.summary,
        keyDecisions: intelligence.decisions,
        topics: intelligence.topics,
        importantMoments: intelligence.importantMoments.map((m) => ({
          time: `${Math.floor(m.timestamp / 60).toString().padStart(2, "0")}:${(m.timestamp % 60).toString().padStart(2, "0")}`,
          title: m.title,
          note: m.description,
        })),
        createdAt: new Date(),
      });
    }

    // Store real action items extracted by AI
    await db.delete(meetingActionItems).where(eq(meetingActionItems.meetingId, id));

    const insertedActionItems: any[] = [];
    for (const item of intelligence.actionItems) {
      const actionItemId = createId("ai");
      const actionItemRecord = {
        id: actionItemId,
        meetingId: id,
        task: item.task,
        ownerName: item.ownerName || user.fullName,
        ownerId: item.ownerId || user.id,
        dueDate: item.dueDate || "Next week",
        status: "todo",
        createdAt: new Date(),
      };
      await db.insert(meetingActionItems).values(actionItemRecord);
      insertedActionItems.push(actionItemRecord);

      // Also create persistent task in tasks table for real task tracking
      await db.insert(tasks).values({
        id: createId("task"),
        organizationId: user.organizationId,
        meetingId: id,
        title: item.task,
        description: `Extracted from meeting "${meeting.title}"`,
        ownerId: user.id,
        ownerName: item.ownerName || user.fullName,
        creatorId: user.id,
        dueDate: item.dueDate || "Next week",
        priority: "medium",
        status: "todo",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Save transcript and segments
    const trId = createId("tr");
    await db.delete(transcripts).where(eq(transcripts.meetingId, id));
    await db.insert(transcripts).values({
      id: trId,
      meetingId: id,
      fullText: transcriptText,
      language: "en",
      createdAt: new Date(),
    });

    if (Array.isArray(segments) && segments.length > 0) {
      for (const seg of segments) {
        await db.insert(transcriptSegments).values({
          id: createId("tseg"),
          transcriptId: trId,
          speakerName: seg.speakerName || "Speaker",
          speakerId: seg.speakerId || null,
          startTimeSeconds: Number(seg.startTimeSeconds || 0),
          endTimeSeconds: Number(seg.endTimeSeconds || 0),
          text: seg.text || "",
        });
      }
    }

    // Increment workspace AI usage count
    try {
      await db
        .insert(workspaceUsage)
        .values({
          id: createId("wu"),
          organizationId: user.organizationId,
          storageBytes: 0,
          recordingMinutes: 0,
          meetingMinutes: 0,
          aiUsageCount: 1,
          transcriptMinutes: 1,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: workspaceUsage.organizationId,
          set: {
            aiUsageCount: sql`${workspaceUsage.aiUsageCount} + 1`,
            updatedAt: new Date(),
          },
        });
    } catch {}

    // Broadcast realtime event
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "summary.ready",
      organizationId: user.organizationId,
      timestamp: new Date().toISOString(),
      payload: {
        meetingId: id,
        meetingTitle: meeting.title,
        actionItemsCount: insertedActionItems.length,
      },
    });

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "meeting.summary_generated",
      resourceType: "meeting",
      resourceId: id,
      metadata: { decisionsCount: intelligence.decisions.length, tasksCount: insertedActionItems.length },
    });

    return NextResponse.json({
      success: true,
      summary: {
        summaryText: intelligence.summary,
        keyDecisions: intelligence.decisions,
        topics: intelligence.topics,
      },
      actionItems: insertedActionItems,
      questions: intelligence.questions,
      risks: intelligence.risks,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
