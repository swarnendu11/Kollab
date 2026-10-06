import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { whiteboards, users } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { createId } from "@/lib/id";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();

    const result = await db
      .select({
        id: whiteboards.id,
        title: whiteboards.title,
        canvasData: whiteboards.canvasData,
        thumbnailUrl: whiteboards.thumbnailUrl,
        authorId: whiteboards.authorId,
        authorName: users.fullName,
        authorAvatar: users.avatarUrl,
        createdAt: whiteboards.createdAt,
        updatedAt: whiteboards.updatedAt,
      })
      .from(whiteboards)
      .leftJoin(users, eq(whiteboards.authorId, users.id))
      .where(eq(whiteboards.organizationId, user.organizationId))
      .orderBy(desc(whiteboards.updatedAt));

    return NextResponse.json({ whiteboards: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    await requireResourceAccess({
      resourceType: "whiteboard",
      organizationId: user.organizationId,
      requiredPermission: "whiteboards:create",
    });

    const body = await req.json();
    const { title, canvasData = [] } = body;

    const db = await getDb();
    const wbId = createId("wb");

    const newWb = {
      id: wbId,
      organizationId: user.organizationId,
      authorId: user.id,
      title: title?.trim() || "Untitled Whiteboard",
      canvasData,
      thumbnailUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(whiteboards).values(newWb);

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "whiteboard.created",
      resourceType: "whiteboard",
      resourceId: wbId,
      metadata: { title: newWb.title },
    });

    return NextResponse.json({ success: true, whiteboard: newWb });
  } catch (error) {
    return handleApiError(error);
  }
}
