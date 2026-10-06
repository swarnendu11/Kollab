import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { whiteboards } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
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
      .from(whiteboards)
      .where(and(eq(whiteboards.id, id), eq(whiteboards.organizationId, user.organizationId)))
      .limit(1);

    if (res.length === 0) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    return NextResponse.json({ whiteboard: res[0] });
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
    const { title, canvasData, thumbnailUrl } = body;

    const db = await getDb();
    const existing = await db
      .select()
      .from(whiteboards)
      .where(and(eq(whiteboards.id, id), eq(whiteboards.organizationId, user.organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    await requireResourceAccess({
      resourceType: "whiteboard",
      resourceId: id,
      organizationId: user.organizationId,
      ownerId: existing[0].authorId,
      requiredPermission: "whiteboards:edit",
    });

    const updateData: any = { updatedAt: new Date() };
    if (title) updateData.title = title.trim();
    if (canvasData !== undefined) updateData.canvasData = canvasData;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;

    await db.update(whiteboards).set(updateData).where(eq(whiteboards.id, id));

    // Broadcast realtime update to active whiteboard collaborators
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "whiteboard.updated",
      organizationId: user.organizationId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: {
        whiteboardId: id,
        canvasData: updateData.canvasData,
        title: updateData.title || existing[0].title,
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
      .from(whiteboards)
      .where(and(eq(whiteboards.id, id), eq(whiteboards.organizationId, user.organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    await requireResourceAccess({
      resourceType: "whiteboard",
      resourceId: id,
      organizationId: user.organizationId,
      ownerId: existing[0].authorId,
      requiredPermission: "whiteboards:delete",
    });

    await db.delete(whiteboards).where(eq(whiteboards.id, id));

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "whiteboard.deleted",
      resourceType: "whiteboard",
      resourceId: id,
      metadata: { title: existing[0].title },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
