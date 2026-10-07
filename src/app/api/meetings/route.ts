import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, users, meetingParticipants, meetingInvites, notifications } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { generateJoinCode } from "@/lib/utils";
import { eq, desc, and, inArray } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const db = await getDb();
    let query = db
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
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .leftJoin(users, eq(meetings.hostId, users.id))
      .where(eq(meetings.organizationId, user.organizationId))
      .orderBy(desc(meetings.createdAt));

    const result = await query;
    const filtered = status ? result.filter((m: any) => m.status === status) : result;

    return NextResponse.json({ meetings: filtered });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    await requireResourceAccess({
      resourceType: "meeting",
      organizationId: user.organizationId,
      requiredPermission: "meetings:create",
    });

    const body = await req.json();
    const {
      title,
      description,
      scheduledStart,
      scheduledEnd,
      waitingRoomEnabled = false,
      recordingEnabled = true,
      chatEnabled = true,
      screenShareEnabled = true,
      isInstant = false,
    } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Meeting title is required" }, { status: 400 });
    }

    const meetingId = createId("meet");
    const rawCustomCode = body.customJoinCode || body.joinCode;
    const joinCode = (rawCustomCode && typeof rawCustomCode === "string" && rawCustomCode.trim().length >= 6)
      ? rawCustomCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
      : generateJoinCode();
    const roomName = `room_${joinCode.replace(/-/g, "_")}`;

    const newMeeting = {
      id: meetingId,
      organizationId: user.organizationId,
      title: title.trim(),
      description: description || null,
      hostId: user.id,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : isInstant ? new Date() : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      actualStart: isInstant ? new Date() : null,
      actualEnd: null,
      status: isInstant ? "live" : "scheduled",
      passcode: null,
      joinCode,
      roomName,
      waitingRoomEnabled: Boolean(waitingRoomEnabled),
      recordingEnabled: Boolean(recordingEnabled),
      chatEnabled: Boolean(chatEnabled),
      screenShareEnabled: Boolean(screenShareEnabled),
      createdAt: new Date(),
    };

    const db = await getDb();
    await db.insert(meetings).values(newMeeting);

    // Add host as participant
    await db.insert(meetingParticipants).values({
      id: createId("mp"),
      meetingId,
      userId: user.id,
      displayName: user.fullName,
      role: "host",
      isMuted: false,
      isCameraOff: false,
      isHandRaised: false,
      joinedAt: new Date(),
    });

    // Process optional invited members on creation
    const invitedUserIds: string[] = Array.isArray(body.invitedUserIds) ? body.invitedUserIds : [];
    const invitedEmails: string[] = Array.isArray(body.invitedEmails) ? body.invitedEmails : [];

    if (invitedUserIds.length > 0) {
      const foundUsers = await db
        .select({ id: users.id, email: users.email, fullName: users.fullName })
        .from(users)
        .where(inArray(users.id, invitedUserIds));

      for (const u of foundUsers) {
        await db.insert(meetingInvites).values({
          id: createId("inv"),
          meetingId,
          email: u.email,
          status: "pending",
        });

        await db.insert(notifications).values({
          id: createId("ntf"),
          userId: u.id,
          type: "meeting_invite",
          title: `Invited to Meeting: ${newMeeting.title}`,
          message: `${user.fullName} invited you to join "${newMeeting.title}". Code: ${joinCode}`,
          link: `/meeting/${meetingId}/prejoin`,
          read: false,
        });
      }
    }

    for (const email of invitedEmails) {
      const normalized = email.trim().toLowerCase();
      if (normalized.includes("@")) {
        await db.insert(meetingInvites).values({
          id: createId("inv"),
          meetingId,
          email: normalized,
          status: "pending",
        });
      }
    }

    if (isInstant) {
      realtimeHub.broadcast({
        id: `rt_${Date.now()}`,
        type: "meeting.started",
        organizationId: user.organizationId,
        timestamp: new Date().toISOString(),
        payload: { meetingId, title: newMeeting.title, joinCode },
      });
    }

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "meeting.created",
      resourceType: "meeting",
      resourceId: meetingId,
      metadata: { title: newMeeting.title, isInstant, joinCode },
    });

    return NextResponse.json({
      success: true,
      meeting: newMeeting,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
