import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { documents, documentVersions } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
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

    const res = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.organizationId, user.organizationId)))
      .limit(1);

    if (res.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Fetch version history
    const versions = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, id))
      .orderBy(desc(documentVersions.versionNumber))
      .limit(10);

    return NextResponse.json({ document: res[0], versions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { title, content, isMajorVersion = false } = body;

    const db = await getDb();
    const existing = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.organizationId, user.organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await requireResourceAccess({
      resourceType: "document",
      resourceId: id,
      organizationId: user.organizationId,
      ownerId: existing[0].authorId,
      requiredPermission: "documents:edit",
    });

    const updateData: any = { updatedAt: new Date() };
    if (title) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;

    await db.update(documents).set(updateData).where(eq(documents.id, id));

    // If requested, create a snapshot in documentVersions
    if (isMajorVersion && content !== undefined) {
      const [latestVersion] = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, id))
        .orderBy(desc(documentVersions.versionNumber))
        .limit(1);

      const nextVersionNum = (latestVersion?.versionNumber || 1) + 1;
      await db.insert(documentVersions).values({
        id: createId("docv"),
        documentId: id,
        versionNumber: nextVersionNum,
        content,
        savedBy: user.id,
        createdAt: new Date(),
      });
    }

    // Broadcast realtime update to other collaborators
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "document.updated",
      organizationId: user.organizationId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: {
        documentId: id,
        title: updateData.title || existing[0].title,
        content: updateData.content,
        updatedBy: user.fullName,
      },
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
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.organizationId, user.organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await requireResourceAccess({
      resourceType: "document",
      resourceId: id,
      organizationId: user.organizationId,
      ownerId: existing[0].authorId,
      requiredPermission: "documents:delete",
    });

    await db.delete(documents).where(eq(documents.id, id));

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "document.deleted",
      resourceType: "document",
      resourceId: id,
      metadata: { title: existing[0].title },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
