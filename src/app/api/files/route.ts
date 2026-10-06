import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { files, users, workspaceUsage } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { putObject, deleteObject, createSignedDownloadUrl, validateUpload } from "@/lib/storage";
import { desc, eq, and, sql } from "drizzle-orm";
import { createId } from "@/lib/id";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();

    // Scoped strictly to user's organization
    const result = await db
      .select({
        id: files.id,
        name: files.name,
        filePath: files.filePath,
        fileSize: files.fileSize,
        mimeType: files.mimeType,
        fileCategory: files.fileCategory,
        downloadUrl: files.downloadUrl,
        createdAt: files.createdAt,
        userName: users.fullName,
        userId: files.userId,
      })
      .from(files)
      .leftJoin(users, eq(files.userId, users.id))
      .where(eq(files.organizationId, user.organizationId))
      .orderBy(desc(files.createdAt));

    // Regenerate signed download URLs for secure time-limited access
    const filesWithSignedUrls = result.map((f: any) => ({
      ...f,
      downloadUrl: f.filePath ? createSignedDownloadUrl(f.filePath, user.organizationId) : f.downloadUrl,
    }));

    return NextResponse.json({ files: filesWithSignedUrls });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const contentType = req.headers.get("content-type") || "";

    let filename = "";
    let mimeType = "application/octet-stream";
    let fileBuffer: Buffer;
    let fileCategory = "document";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      filename = validateUpload({
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      mimeType = file.type || "application/octet-stream";
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      if (mimeType.startsWith("image/")) fileCategory = "image";
      else if (mimeType.startsWith("video/")) fileCategory = "video";
      else if (mimeType.startsWith("audio/")) fileCategory = "audio";
      else if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar")) fileCategory = "archive";
    } else {
      // JSON upload with content (e.g., base64 or text payload)
      const body = await req.json();
      if (!body.name) {
        return NextResponse.json({ error: "File name is required" }, { status: 400 });
      }

      filename = validateUpload({
        filename: body.name,
        mimeType: body.mimeType || "text/plain",
        sizeBytes: body.content ? Buffer.byteLength(body.content, "utf8") : 1024,
      });

      mimeType = body.mimeType || "text/plain";
      fileCategory = body.fileCategory || "document";
      fileBuffer = body.content ? Buffer.from(body.content, "utf8") : Buffer.from("Empty file content", "utf8");
    }

    const storageKey = `${createId("file")}_${filename}`;
    const stored = await putObject({
      key: storageKey,
      buffer: fileBuffer,
      mimeType,
      organizationId: user.organizationId,
    });

    const db = await getDb();
    const fileId = createId("f");

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const newFile = {
      id: fileId,
      organizationId: user.organizationId,
      userId: user.id,
      name: filename,
      filePath: storageKey,
      fileSize: formatSize(stored.sizeBytes),
      mimeType,
      fileCategory,
      downloadUrl: stored.downloadUrl,
      createdAt: new Date(),
    };

    await db.insert(files).values(newFile);

    // Update workspace storage metrics
    try {
      await db
        .insert(workspaceUsage)
        .values({
          id: createId("wu"),
          organizationId: user.organizationId,
          storageBytes: stored.sizeBytes,
          recordingMinutes: 0,
          meetingMinutes: 0,
          aiUsageCount: 0,
          transcriptMinutes: 0,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: workspaceUsage.organizationId,
          set: {
            storageBytes: sql`${workspaceUsage.storageBytes} + ${stored.sizeBytes}`,
            updatedAt: new Date(),
          },
        });
    } catch {}

    // Audit log
    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "file.uploaded",
      resourceType: "file",
      resourceId: fileId,
      metadata: { name: filename, sizeBytes: stored.sizeBytes, mimeType },
    });

    return NextResponse.json({ success: true, file: newFile });
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
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.organizationId, user.organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const targetFile = existing[0];

    // Verify user owns file or has files:delete permission
    await requireResourceAccess({
      resourceType: "file",
      resourceId: id,
      organizationId: user.organizationId,
      ownerId: targetFile.userId,
      requiredPermission: "files:delete",
    });

    // Delete underlying object
    if (targetFile.filePath) {
      await deleteObject(targetFile.filePath, user.organizationId);
    }

    await db.delete(files).where(eq(files.id, id));

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "file.deleted",
      resourceType: "file",
      resourceId: id,
      metadata: { name: targetFile.name },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
