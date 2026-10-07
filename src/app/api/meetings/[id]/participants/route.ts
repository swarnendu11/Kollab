import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, meetingParticipants, users } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
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

    // Find meeting
    const meetingQuery = await db
      .select()
      .from(meetings)
      .where(or(eq(meetings.id, id), eq(meetings.joinCode, id)))
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];
    if (meeting.organizationId && meeting.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
      participants: admitted,
      waitingRoom: waiting,
      totalCount: admitted.length,
      waitingCount: waiting.length,
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
    const { action, participantId, role: newRole } = body;

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

    // Determine if caller is host or co-host
    const isHost = meeting.hostId === user.id;
    const callerParticipant = await db
      .select()
      .from(meetingParticipants)
      .where(
        and(
          eq(meetingParticipants.meetingId, meeting.id),
          eq(meetingParticipants.userId, user.id)
        )
      )
      .limit(1);

    const isCoHost = !isHost && callerParticipant.length > 0 && callerParticipant[0].role === "co-host";
    const isAdmin = user.role === "admin" || user.role === "owner";

    if (!isHost && !isCoHost && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only meeting hosts or co-hosts can moderate participants" },
        { status: 403 }
      );
    }

    switch (action) {
      case "admit": {
        if (!participantId) {
          return NextResponse.json({ error: "participantId is required" }, { status: 400 });
        }
        await db
          .update(meetingParticipants)
          .set({ status: "admitted" })
          .where(
            and(
              eq(meetingParticipants.id, participantId),
              eq(meetingParticipants.meetingId, meeting.id)
            )
          );

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.participant.admitted",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, participantId },
        });
        break;
      }

      case "admit_all": {
        await db
          .update(meetingParticipants)
          .set({ status: "admitted" })
          .where(
            and(
              eq(meetingParticipants.meetingId, meeting.id),
              eq(meetingParticipants.status, "waiting")
            )
          );

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.participant.admitted_all",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id },
        });
        break;
      }

      case "reject": {
        if (!participantId) {
          return NextResponse.json({ error: "participantId is required" }, { status: 400 });
        }
        await db
          .update(meetingParticipants)
          .set({ status: "rejected" })
          .where(
            and(
              eq(meetingParticipants.id, participantId),
              eq(meetingParticipants.meetingId, meeting.id)
            )
          );

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.participant.rejected",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, participantId },
        });
        break;
      }

      case "mute": {
        if (!participantId) {
          return NextResponse.json({ error: "participantId is required" }, { status: 400 });
        }
        await db
          .update(meetingParticipants)
          .set({ isMuted: true })
          .where(
            and(
              eq(meetingParticipants.id, participantId),
              eq(meetingParticipants.meetingId, meeting.id)
            )
          );

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.participant.muted",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, participantId },
        });
        break;
      }

      case "mute_all": {
        await db
          .update(meetingParticipants)
          .set({ isMuted: true })
          .where(eq(meetingParticipants.meetingId, meeting.id));

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.participants.muted_all",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id },
        });
        break;
      }

      case "remove": {
        if (!participantId) {
          return NextResponse.json({ error: "participantId is required" }, { status: 400 });
        }
        await db
          .update(meetingParticipants)
          .set({ status: "rejected", leftAt: new Date() })
          .where(
            and(
              eq(meetingParticipants.id, participantId),
              eq(meetingParticipants.meetingId, meeting.id)
            )
          );

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.participant.removed",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, participantId },
        });
        break;
      }

      case "set_role": {
        if (!isHost && !isAdmin) {
          return NextResponse.json({ error: "Only the host can modify roles" }, { status: 403 });
        }
        if (!participantId || !newRole) {
          return NextResponse.json({ error: "participantId and role are required" }, { status: 400 });
        }

        await db
          .update(meetingParticipants)
          .set({ role: newRole })
          .where(
            and(
              eq(meetingParticipants.id, participantId),
              eq(meetingParticipants.meetingId, meeting.id)
            )
          );

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.participant.role_updated",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, participantId, role: newRole },
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: `meeting.participant.${action}`,
      resourceType: "meeting",
      resourceId: meeting.id,
      metadata: { participantId, action },
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    return handleApiError(error);
  }
}
