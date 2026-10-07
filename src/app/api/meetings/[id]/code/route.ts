import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, or } from "drizzle-orm";
import { generateJoinCode } from "@/lib/utils";
import { realtimeHub } from "@/lib/realtime";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const db = await getDb();

    // Find meeting by ID or current join code
    const meetingQuery = await db
      .select()
      .from(meetings)
      .where(or(eq(meetings.id, id), eq(meetings.joinCode, id)))
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];

    // Enforce workspace tenancy
    if (meeting.organizationId && meeting.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only host, admin, or workspace owner can regenerate the code
    if (meeting.hostId !== user.id && user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json(
        { error: "Only the meeting host or workspace administrator can regenerate the meeting code" },
        { status: 403 }
      );
    }

    // Allow custom code if provided in body, otherwise generate clean Google Meet style code
    let newCode: string;
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.customCode && typeof body.customCode === "string" && body.customCode.trim().length >= 6) {
        newCode = body.customCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      } else {
        newCode = generateJoinCode();
      }
    } catch {
      newCode = generateJoinCode();
    }

    // Update meeting join code
    await db
      .update(meetings)
      .set({ joinCode: newCode })
      .where(eq(meetings.id, meeting.id));

    // Broadcast realtime event to all peers in call and workspace
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "meeting.code_updated",
      organizationId: user.organizationId,
      timestamp: new Date().toISOString(),
      payload: {
        meetingId: meeting.id,
        joinCode: newCode,
        updatedBy: user.fullName,
      },
    });

    // Log audit event
    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "meeting.code_updated",
      resourceType: "meeting",
      resourceId: meeting.id,
      metadata: { oldCode: meeting.joinCode, newCode },
    });

    return NextResponse.json({
      success: true,
      meetingId: meeting.id,
      joinCode: newCode,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
