import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { files, users } from "@/db/schema";
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
        id: files.id,
        name: files.name,
        filePath: files.filePath,
        fileSize: files.fileSize,
        mimeType: files.mimeType,
        fileCategory: files.fileCategory,
        downloadUrl: files.downloadUrl,
        createdAt: files.createdAt,
        userName: users.fullName,
      })
      .from(files)
      .leftJoin(users, eq(files.userId, users.id))
      .orderBy(desc(files.createdAt));

    return NextResponse.json({ files: result });
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
    const { name, fileSize = "1.2 MB", mimeType = "application/pdf", fileCategory = "document", downloadUrl = "#" } = body;

    if (!name) return NextResponse.json({ error: "File name required" }, { status: 400 });

    const db = await getDb();
    const fileId = `file_${Date.now()}`;

    const newFile = {
      id: fileId,
      organizationId: "org_kollab",
      userId: user.id,
      name,
      filePath: `/uploads/${name}`,
      fileSize,
      mimeType,
      fileCategory,
      downloadUrl,
      createdAt: new Date(),
    };

    await db.insert(files).values(newFile);

    return NextResponse.json({ success: true, file: newFile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const db = await getDb();
    await db.delete(files).where(eq(files.id, id));

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
