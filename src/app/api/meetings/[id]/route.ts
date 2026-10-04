import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, users, meetingParticipants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Look up by ID or by joinCode
    const meetingQuery = await db
      .select({
        id: meetings.id,
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
      .where(eq(meetings.id, id))
      .limit(1);

    if (meetingQuery.length === 0) {
      // Try by joinCode
      const byCode = await db
        .select()
        .from(meetings)
        .where(eq(meetings.joinCode, id))
        .limit(1);

      if (byCode.length === 0) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
      }
      return NextResponse.json({ meeting: byCode[0] });
    }

    const participants = await db
      .select()
      .from(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meetingQuery[0].id));

    return NextResponse.json({
      meeting: meetingQuery[0],
      participants,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const db = await getDb();

    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "live") updateData.actualStart = new Date();
      if (body.status === "ended") updateData.actualEnd = new Date();
    }
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.waitingRoomEnabled !== undefined) updateData.waitingRoomEnabled = body.waitingRoomEnabled;
    if (body.recordingEnabled !== undefined) updateData.recordingEnabled = body.recordingEnabled;
    if (body.chatEnabled !== undefined) updateData.chatEnabled = body.chatEnabled;
    if (body.screenShareEnabled !== undefined) updateData.screenShareEnabled = body.screenShareEnabled;

    await db.update(meetings).set(updateData).where(eq(meetings.id, id));

    return NextResponse.json({ success: true, updated: updateData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
