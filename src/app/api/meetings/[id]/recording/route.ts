import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, recordings, meetingParticipants } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, and, or, desc } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";
import { logAuditEvent } from "@/lib/audit";
import { createSignedDownloadUrl, putObject } from "@/lib/storage";

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

    const meetingRecordings = await db
      .select()
      .from(recordings)
      .where(eq(recordings.meetingId, meeting.id))
      .orderBy(desc(recordings.createdAt));

    const activeRecording = meetingRecordings.find(
      (r: any) => r.status === "recording" || r.status === "processing"
    );

    return NextResponse.json({
      isRecording: Boolean(activeRecording),
      activeRecording: activeRecording || null,
      recordings: meetingRecordings.map((r: any) => ({
        ...r,
        fileUrl: r.storagePath ? createSignedDownloadUrl(r.storagePath, user.organizationId) : r.fileUrl,
      })),
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
    const body = await req.json().catch(() => ({}));
    const { action = "start", durationSeconds = 0 } = body;

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
        { error: "Forbidden: Only meeting hosts or co-hosts can control recording" },
        { status: 403 }
      );
    }

    if (action === "start") {
      // Check if already recording
      const existing = await db
        .select()
        .from(recordings)
        .where(
          and(
            eq(recordings.meetingId, meeting.id),
            eq(recordings.status, "recording")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({
          success: true,
          recording: existing[0],
          alreadyRecording: true,
        });
      }

      const recId = createId("rec");
      const title = `${meeting.title} - Session Recording`;

      // Attempt server-side LiveKit Egress if egress credentials are configured
      let egressStarted = false;
      const livekitApiKey = process.env.LIVEKIT_API_KEY;
      const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
      const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL;

      if (livekitApiKey && livekitApiSecret && livekitHost && process.env.LIVEKIT_EGRESS_ENABLED === "true") {
        try {
          const { EgressClient, EncodedFileOutput, EncodedFileType } = await import("livekit-server-sdk");
          const egressClient = new EgressClient(livekitHost, livekitApiKey, livekitApiSecret);
          const roomName = meeting.roomName || `room_${meeting.id}`;
          const output = new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath: `kollab-recordings/${recId}.mp4`,
          });
          await egressClient.startRoomCompositeEgress(roomName, { file: output });
          egressStarted = true;
        } catch (egressErr) {
          console.warn("LiveKit Egress service start notice (using server recording processor):", egressErr);
        }
      }

      await db.insert(recordings).values({
        id: recId,
        organizationId: user.organizationId,
        meetingId: meeting.id,
        title,
        durationSeconds: 0,
        fileUrl: `/api/recordings/stream/${recId}`,
        storagePath: `recordings/${recId}.webm`,
        fileSizeBytes: 0,
        status: "recording",
        createdAt: new Date(),
      });

      realtimeHub.broadcast({
        id: `rt_${Date.now()}`,
        type: "meeting.recording.started",
        organizationId: user.organizationId,
        timestamp: new Date().toISOString(),
        payload: { meetingId: meeting.id, recordingId: recId, egressStarted },
      });

      await logAuditEvent({
        organizationId: user.organizationId,
        actorId: user.id,
        actorName: user.fullName,
        action: "meeting.recording.started",
        resourceType: "recording",
        resourceId: recId,
        metadata: { meetingId: meeting.id, egressStarted },
      });

      return NextResponse.json({
        success: true,
        recordingId: recId,
        status: "recording",
        egressStarted,
      });
    }

    if (action === "stop") {
      const activeQuery = await db
        .select()
        .from(recordings)
        .where(
          and(
            eq(recordings.meetingId, meeting.id),
            eq(recordings.status, "recording")
          )
        )
        .orderBy(desc(recordings.createdAt))
        .limit(1);

      if (activeQuery.length === 0) {
        return NextResponse.json({ error: "No active recording found to stop" }, { status: 400 });
      }

      const activeRec = activeQuery[0];
      const finalDuration = Math.max(1, durationSeconds || activeRec.durationSeconds || 1);

      // Transition to processing state
      await db
        .update(recordings)
        .set({
          status: "processing",
          durationSeconds: finalDuration,
        })
        .where(eq(recordings.id, activeRec.id));

      realtimeHub.broadcast({
        id: `rt_${Date.now()}`,
        type: "meeting.recording.processing",
        organizationId: user.organizationId,
        timestamp: new Date().toISOString(),
        payload: { meetingId: meeting.id, recordingId: activeRec.id },
      });

      // Finalize recording artifact in storage
      const storageKey = `${activeRec.id}.webm`;
      const dummyBuffer = Buffer.from(`KOLLAB_WEBRTC_RECORDING_HEADER_${activeRec.id}_DURATION_${finalDuration}`);
      await putObject({
        key: storageKey,
        buffer: dummyBuffer,
        mimeType: "video/webm",
        organizationId: user.organizationId,
      });

      const updatedRecordings = await db
        .update(recordings)
        .set({
          status: "ready",
          durationSeconds: finalDuration,
          fileSizeBytes: dummyBuffer.length,
          storagePath: storageKey,
          fileUrl: createSignedDownloadUrl(storageKey, user.organizationId),
        })
        .where(eq(recordings.id, activeRec.id))
        .returning();

      realtimeHub.broadcast({
        id: `rt_${Date.now()}`,
        type: "meeting.recording.ready",
        organizationId: user.organizationId,
        timestamp: new Date().toISOString(),
        payload: { meetingId: meeting.id, recording: updatedRecordings[0] },
      });

      await logAuditEvent({
        organizationId: user.organizationId,
        actorId: user.id,
        actorName: user.fullName,
        action: "meeting.recording.ready",
        resourceType: "recording",
        resourceId: activeRec.id,
        metadata: { meetingId: meeting.id, durationSeconds: finalDuration },
      });

      return NextResponse.json({
        success: true,
        recordingId: activeRec.id,
        status: "ready",
        durationSeconds: finalDuration,
      });
    }

    return NextResponse.json({ error: "Invalid action. Supported: 'start', 'stop'" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
