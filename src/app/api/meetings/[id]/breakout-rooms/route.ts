import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, breakoutRooms, meetingParticipants } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, and, or } from "drizzle-orm";
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

    const meetingQuery = await db
      .select()
      .from(meetings)
      .where(or(eq(meetings.id, id), eq(meetings.joinCode, id)))
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];

    const rooms = await db
      .select()
      .from(breakoutRooms)
      .where(eq(breakoutRooms.meetingId, meeting.id));

    return NextResponse.json({ rooms, breakoutRooms: rooms });
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
    const { action = "create", name, roomId, participantIds = [], broadcastText } = body;

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

    // Verify caller is host or co-host
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
        { error: "Only the host or co-host can manage breakout rooms" },
        { status: 403 }
      );
    }

    switch (action) {
      case "create": {
        const roomName = name || `Breakout Room`;
        const newId = createId("br");
        await db.insert(breakoutRooms).values({
          id: newId,
          meetingId: meeting.id,
          name: roomName,
          status: "active",
          assignedParticipants: participantIds,
        });

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.breakout.created",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, roomId: newId, name: roomName },
        });

        return NextResponse.json({ success: true, roomId: newId, name: roomName });
      }

      case "assign": {
        if (!roomId) {
          return NextResponse.json({ error: "roomId is required" }, { status: 400 });
        }
        await db
          .update(breakoutRooms)
          .set({ assignedParticipants: participantIds })
          .where(
            and(
              eq(breakoutRooms.id, roomId),
              eq(breakoutRooms.meetingId, meeting.id)
            )
          );

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.breakout.assigned",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id, roomId, participantIds },
        });

        return NextResponse.json({ success: true, roomId, participantIds });
      }

      case "broadcast": {
        if (!broadcastText) {
          return NextResponse.json({ error: "broadcastText is required" }, { status: 400 });
        }

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.breakout.broadcast",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: {
            meetingId: meeting.id,
            message: broadcastText,
            sender: user.fullName,
          },
        });

        return NextResponse.json({ success: true, message: broadcastText });
      }

      case "close_all": {
        await db
          .update(breakoutRooms)
          .set({ status: "closed" })
          .where(eq(breakoutRooms.meetingId, meeting.id));

        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.breakout.closed_all",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: { meetingId: meeting.id },
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
