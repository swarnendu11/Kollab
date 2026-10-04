import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, users, meetingParticipants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { generateJoinCode } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const db = await getDb();
    let query = db
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
      .orderBy(desc(meetings.createdAt));

    const result = await query;
    const filtered = status ? result.filter((m: any) => m.status === status) : result;

    return NextResponse.json({ meetings: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const meetingId = `meet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const joinCode = generateJoinCode();
    const roomName = `room_${joinCode.replace(/-/g, "_")}`;

    const db = await getDb();
    const newMeeting = {
      id: meetingId,
      title: title.trim(),
      description: description || null,
      hostId: user.id,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : isInstant ? new Date() : new Date(),
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : new Date(Date.now() + 3600000),
      actualStart: isInstant ? new Date() : null,
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

    await db.insert(meetings).values(newMeeting);

    // Register host as participant
    await db.insert(meetingParticipants).values({
      id: `mp_${Date.now()}`,
      meetingId,
      userId: user.id,
      displayName: user.fullName,
      role: "host",
      isMuted: false,
      isCameraOff: false,
      isHandRaised: false,
      joinedAt: new Date(),
    });

    return NextResponse.json({ success: true, meeting: newMeeting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
