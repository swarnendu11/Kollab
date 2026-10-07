import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, users, meetingParticipants } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { eq, and, or } from "drizzle-orm";
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

    // Look up by ID or by joinCode
    const meetingQuery = await db
      .select({
        id: meetings.id,
        organizationId: meetings.organizationId,
        title: meetings.title,
        description: meetings.description,
        hostId: meetings.hostId,
        hostName: users.fullName,
        hostAvatar: users.avatarUrl,
        scheduledStart: meetings.scheduledStart,
        scheduledEnd: meetings.scheduledEnd,
        actualStart: meetings.actualStart,
        actualEnd: meetings.actualEnd,
        status: meetings.status,
        joinCode: meetings.joinCode,
        roomName: meetings.roomName,
        waitingRoomEnabled: meetings.waitingRoomEnabled,
        recordingEnabled: meetings.recordingEnabled,
        chatEnabled: meetings.chatEnabled,
        screenShareEnabled: meetings.screenShareEnabled,
        isLocked: meetings.isLocked,
        allowReactions: meetings.allowReactions,
        allowAiCopilot: meetings.allowAiCopilot,
        allowFileSharing: meetings.allowFileSharing,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .leftJoin(users, eq(meetings.hostId, users.id))
      .where(
        or(
          eq(meetings.id, id),
          eq(meetings.joinCode, id)
        )
      )
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];

    // Enforce organization tenancy unless user is invited or has matching code in same org
    if (meeting.organizationId && meeting.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Access denied: Meeting belongs to another workspace" }, { status: 403 });
    }

    const allParticipants = await db
      .select({
        id: meetingParticipants.id,
        meetingId: meetingParticipants.meetingId,
        userId: meetingParticipants.userId,
        displayName: meetingParticipants.displayName,
        role: meetingParticipants.role,
        status: meetingParticipants.status,
        isMuted: meetingParticipants.isMuted,
        isCameraOff: meetingParticipants.isCameraOff,
        isHandRaised: meetingParticipants.isHandRaised,
        isScreenSharing: meetingParticipants.isScreenSharing,
        joinedAt: meetingParticipants.joinedAt,
        userAvatar: users.avatarUrl,
      })
      .from(meetingParticipants)
      .leftJoin(users, eq(meetingParticipants.userId, users.id))
      .where(eq(meetingParticipants.meetingId, meeting.id));

    const admitted = allParticipants.filter((p: any) => p.status === "admitted");
    const waiting = allParticipants.filter((p: any) => p.status === "waiting");

    return NextResponse.json({
      meeting,
      participants: admitted,
      waitingRoom: waiting,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const db = await getDb();
    const existing = await db
      .select()
      .from(meetings)
      .where(
        or(
          eq(meetings.id, id),
          eq(meetings.joinCode, id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = existing[0];

    // Authorize: Host, Admin, or Owner
    if (meeting.hostId !== user.id && user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Only the meeting host or workspace admin can modify meeting settings" }, { status: 403 });
    }

    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "live") {
        updateData.actualStart = new Date();
        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.started",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, title: meeting.title },
        });
      }
      if (body.status === "ended") {
        updateData.actualEnd = new Date();
        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.ended",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, title: meeting.title },
        });
      }
    }
    if (body.title) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.waitingRoomEnabled !== undefined) updateData.waitingRoomEnabled = Boolean(body.waitingRoomEnabled);
    if (body.recordingEnabled !== undefined) updateData.recordingEnabled = Boolean(body.recordingEnabled);
    if (body.chatEnabled !== undefined) updateData.chatEnabled = Boolean(body.chatEnabled);
    if (body.screenShareEnabled !== undefined) updateData.screenShareEnabled = Boolean(body.screenShareEnabled);
    if (body.isLocked !== undefined) updateData.isLocked = Boolean(body.isLocked);
    if (body.allowReactions !== undefined) updateData.allowReactions = Boolean(body.allowReactions);
    if (body.allowAiCopilot !== undefined) updateData.allowAiCopilot = Boolean(body.allowAiCopilot);
    if (body.allowFileSharing !== undefined) updateData.allowFileSharing = Boolean(body.allowFileSharing);

    await db.update(meetings).set(updateData).where(eq(meetings.id, meeting.id));

    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "meeting.settings_updated",
      organizationId: user.organizationId,
      timestamp: new Date().toISOString(),
      payload: { meetingId: meeting.id, ...updateData },
    });

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "meeting.updated",
      resourceType: "meeting",
      resourceId: meeting.id,
      metadata: updateData,
    });

    return NextResponse.json({ success: true, updated: updateData });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const db = await getDb();

    const existing = await db
      .select()
      .from(meetings)
      .where(
        or(
          eq(meetings.id, id),
          eq(meetings.joinCode, id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = existing[0];

    await requireResourceAccess({
      resourceType: "meeting",
      resourceId: meeting.id,
      organizationId: user.organizationId,
      ownerId: meeting.hostId,
      requiredPermission: "meetings:delete",
    });

    await db.delete(meetings).where(eq(meetings.id, meeting.id));

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "meeting.deleted",
      resourceType: "meeting",
      resourceId: meeting.id,
      metadata: { title: meeting.title },
    });

    return NextResponse.json({ success: true, id: meeting.id });
  } catch (error) {
    return handleApiError(error);
  }
}
