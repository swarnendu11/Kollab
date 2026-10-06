import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { recordings, meetings, workspaceUsage } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { putObject, deleteObject, createSignedDownloadUrl, validateUpload } from "@/lib/storage";
import { desc, eq, and, sql } from "drizzle-orm";
import { createId } from "@/lib/id";
import { logAuditEvent } from "@/lib/audit";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();

    // Query recordings belonging to user's organization
    const result = await db
      .select({
        id: recordings.id,
        meetingId: recordings.meetingId,
        title: recordings.title,
        durationSeconds: recordings.durationSeconds,
        fileUrl: recordings.fileUrl,
        storagePath: recordings.storagePath,
        fileSizeBytes: recordings.fileSizeBytes,
        thumbnailUrl: recordings.thumbnailUrl,
        status: recordings.status,
        createdAt: recordings.createdAt,
        meetingTitle: meetings.title,
      })
      .from(recordings)
      .leftJoin(meetings, eq(recordings.meetingId, meetings.id))
      .where(eq(recordings.organizationId, user.organizationId))
      .orderBy(desc(recordings.createdAt));

    // Generate signed streaming & download URLs
    const processed = result.map((r: any) => ({
      ...r,
      fileUrl: r.storagePath ? createSignedDownloadUrl(r.storagePath, user.organizationId) : r.fileUrl,
      downloadUrl: r.storagePath ? createSignedDownloadUrl(r.storagePath, user.organizationId) : r.fileUrl,
    }));

    return NextResponse.json({ recordings: processed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const contentType = req.headers.get("content-type") || "";
    let meetingId: string | null = null;
    let title = "";
    let durationSeconds = 0;
    let videoBuffer: Buffer | null = null;
    let mimeType = "video/webm";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      meetingId = (formData.get("meetingId") as string) || null;
      title = (formData.get("title") as string) || "Meeting Recording";
      durationSeconds = parseInt((formData.get("durationSeconds") as string) || "0", 10);

      if (file) {
        validateUpload({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });
        mimeType = file.type || "video/webm";
        const ab = await file.arrayBuffer();
        videoBuffer = Buffer.from(ab);
      }
    } else {
      const body = await req.json();
      meetingId = body.meetingId || null;
      title = body.title || "Meeting Recording";
      durationSeconds = Number(body.durationSeconds || 0);

      if (body.videoBase64) {
        videoBuffer = Buffer.from(body.videoBase64, "base64");
      }
    }

    const recId = createId("rec");
    let storageKey = "";
    let fileSizeBytes = 0;

    if (videoBuffer && videoBuffer.length > 0) {
      storageKey = `${recId}.webm`;
      fileSizeBytes = videoBuffer.length;
      await putObject({
        key: storageKey,
        buffer: videoBuffer,
        mimeType,
        organizationId: user.organizationId,
      });
    }

    const db = await getDb();
    const playbackUrl = storageKey ? createSignedDownloadUrl(storageKey, user.organizationId) : "";

    const newRecording = {
      id: recId,
      organizationId: user.organizationId,
      meetingId: meetingId || null,
      title: title || `Kollab Meeting Recording - ${new Date().toLocaleDateString()}`,
      durationSeconds: Math.max(0, durationSeconds),
      fileUrl: playbackUrl,
      storagePath: storageKey || null,
      fileSizeBytes,
      thumbnailUrl: null,
      status: "ready",
      createdAt: new Date(),
    };

    await db.insert(recordings).values(newRecording);

    // Update workspace recording minutes
    const recMinutes = Math.ceil(durationSeconds / 60);
    if (recMinutes > 0) {
      try {
        await db
          .insert(workspaceUsage)
          .values({
            id: createId("wu"),
            organizationId: user.organizationId,
            storageBytes: fileSizeBytes,
            recordingMinutes: recMinutes,
            meetingMinutes: 0,
            aiUsageCount: 0,
            transcriptMinutes: 0,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: workspaceUsage.organizationId,
            set: {
              recordingMinutes: sql`${workspaceUsage.recordingMinutes} + ${recMinutes}`,
              storageBytes: sql`${workspaceUsage.storageBytes} + ${fileSizeBytes}`,
              updatedAt: new Date(),
            },
          });
      } catch {}
    }

    // Broadcast realtime event
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "recording.ready",
      organizationId: user.organizationId,
      timestamp: new Date().toISOString(),
      payload: {
        recordingId: recId,
        title: newRecording.title,
        durationSeconds: newRecording.durationSeconds,
      },
    });

    // Log audit event
    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "recording.created",
      resourceType: "recording",
      resourceId: recId,
      metadata: { title, durationSeconds, fileSizeBytes },
    });

    return NextResponse.json({ success: true, recording: newRecording });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Recording ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .select()
      .from(recordings)
      .where(and(eq(recordings.id, id), eq(recordings.organizationId, user.organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    const targetRec = existing[0];

    // Check permission
    await requireResourceAccess({
      resourceType: "recording",
      resourceId: id,
      organizationId: user.organizationId,
      requiredPermission: "recordings:delete",
    });

    if (targetRec.storagePath) {
      await deleteObject(targetRec.storagePath, user.organizationId);
    }

    await db.delete(recordings).where(eq(recordings.id, id));

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "recording.deleted",
      resourceType: "recording",
      resourceId: id,
      metadata: { title: targetRec.title },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
