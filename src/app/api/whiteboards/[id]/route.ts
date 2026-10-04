import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { whiteboards } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const res = await db.select().from(whiteboards).where(eq(whiteboards.id, id)).limit(1);
    if (res.length === 0) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    return NextResponse.json({ whiteboard: res[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
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
    const { title, canvasData, thumbnailUrl } = body;

    const db = await getDb();
    const updateData: any = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (canvasData !== undefined) updateData.canvasData = canvasData;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;

    await db.update(whiteboards).set(updateData).where(eq(whiteboards.id, id));

    return NextResponse.json({ success: true, updated: updateData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();
    await db.delete(whiteboards).where(eq(whiteboards.id, id));

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
