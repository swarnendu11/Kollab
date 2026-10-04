import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { whiteboards, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      .orderBy(desc(whiteboards.updatedAt));

    return NextResponse.json({ whiteboards: result });
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
    const { title, canvasData = [] } = body;

    const db = await getDb();
    const wbId = `wb_${Date.now()}`;

    const newWb = {
      id: wbId,
      organizationId: "org_kollab",
      authorId: user.id,
      title: title || "Untitled Whiteboard",
      canvasData,
      thumbnailUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(whiteboards).values(newWb);

    return NextResponse.json({ success: true, whiteboard: newWb });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
