import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/db";
import { meetings, meetingParticipants } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomName, meetingId: rawMeetingId, participantName } = body;

    if (!roomName && !rawMeetingId) {
      return NextResponse.json({ error: "Room name or meeting ID is required" }, { status: 400 });
    }

    // Resolve meeting ID from roomName ("room_xxx") or directly passed
    let searchId = rawMeetingId;
    if (!searchId && roomName) {
      searchId = roomName.startsWith("room_") ? roomName.slice(5) : roomName;
    }

    const db = await getDb();

    // Look up the meeting in the database
    const meetingQuery = await db
      .select()
      .from(meetings)
      .where(
        or(
          eq(meetings.id, searchId),
          eq(meetings.joinCode, searchId),
          eq(meetings.roomName, roomName || `room_${searchId}`)
        )
      )
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];

    // 1. Organization tenant isolation check
    if (meeting.organizationId && meeting.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Access denied: Meeting belongs to another workspace" },
        { status: 403 }
      );
    }

    // 2. Lifecycle check
    if (meeting.status === "ended") {
      return NextResponse.json(
        { error: "This meeting has already ended." },
        { status: 403 }
      );
    }
    if (meeting.status === "cancelled") {
      return NextResponse.json(
        { error: "This meeting was cancelled." },
        { status: 403 }
      );
    }

    // 3. Determine authoritative role - NEVER trust browser payload
    const isHost = meeting.hostId === user.id;

    // Check existing participant record
    const existingParticipant = await db
      .select()
      .from(meetingParticipants)
      .where(
        and(
          eq(meetingParticipants.meetingId, meeting.id),
          eq(meetingParticipants.userId, user.id)
        )
      )
      .limit(1);

    const isCoHost = !isHost && existingParticipant.length > 0 && existingParticipant[0].role === "co-host";
    const role = isHost ? "host" : isCoHost ? "co-host" : "participant";

    // 4. Meeting Lock Check
    if (meeting.isLocked && !isHost && !isCoHost) {
      return NextResponse.json(
        { error: "This meeting is locked by the host. No new participants may enter." },
        { status: 403 }
      );
    }

    // 5. Waiting Room Check
    if (meeting.waitingRoomEnabled && !isHost && !isCoHost) {
      if (existingParticipant.length === 0) {
        // Enqueue into waiting room
        const participantId = createId("mp");
        await db.insert(meetingParticipants).values({
          id: participantId,
          meetingId: meeting.id,
          userId: user.id,
          displayName: participantName || user.fullName,
          role: "participant",
          status: "waiting",
          isMuted: false,
          isCameraOff: false,
          isHandRaised: false,
          joinedAt: new Date(),
        });

        // Broadcast to host that participant is waiting
        realtimeHub.broadcast({
          id: `rt_${Date.now()}`,
          type: "meeting.waiting_room.joined",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: {
            meetingId: meeting.id,
            participant: {
              id: participantId,
              userId: user.id,
              name: participantName || user.fullName,
              avatar: user.avatarUrl,
              joinedAt: new Date().toISOString(),
            },
          },
        });

        return NextResponse.json({
          waitingRoom: true,
          message: "You are in the waiting room. The host will admit you shortly.",
          participantId,
        });
      } else {
        const p = existingParticipant[0];
        if (p.status === "waiting") {
          return NextResponse.json({
            waitingRoom: true,
            message: "You are in the waiting room. The host will admit you shortly.",
            participantId: p.id,
          });
        }
        if (p.status === "rejected") {
          return NextResponse.json(
            { error: "Admission to this meeting was declined by the host." },
            { status: 403 }
          );
        }
      }
    }

    // Ensure participant is recorded as admitted
    if (existingParticipant.length === 0) {
      await db.insert(meetingParticipants).values({
        id: createId("mp"),
        meetingId: meeting.id,
        userId: user.id,
        displayName: participantName || user.fullName,
        role,
        status: "admitted",
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        joinedAt: new Date(),
      });
    } else if (existingParticipant[0].status !== "admitted") {
      await db
        .update(meetingParticipants)
        .set({ status: "admitted", leftAt: null })
        .where(eq(meetingParticipants.id, existingParticipant[0].id));
    }

    // 6. LiveKit Access Token Generation
    const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "secret_kollab_livekit_super_secret_passphrase_32_chars_long";
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://kollab-webrtc.livekit.cloud";

    const identity = user.id;
    const name = participantName || user.fullName;
    const actualRoomName = meeting.roomName || `room_${meeting.id}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      metadata: JSON.stringify({
        userId: user.id,
        name,
        avatar: user.avatarUrl,
        isHost,
        isCoHost,
        role,
        organizationId: user.organizationId,
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: actualRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost || isCoHost,
      canUpdateOwnMetadata: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: livekitUrl,
      roomName: actualRoomName,
      meetingId: meeting.id,
      identity,
      name,
      role,
      isHost,
      isCoHost,
      waitingRoom: false,
    });
  } catch (error: any) {
    console.error("LiveKit token generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate session token" }, { status: 500 });
  }
}
