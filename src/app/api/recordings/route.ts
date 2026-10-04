import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { recordings, meetings } from "@/db/schema";
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
      .orderBy(desc(recordings.createdAt));

    return NextResponse.json({ recordings: result });
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
    const { meetingId, title, durationSeconds = 60, fileUrl, fileSizeBytes = 15000000 } = body;

    const db = await getDb();
    const recId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newRecording = {
      id: recId,
      meetingId: meetingId || null,
      title: title || `Kollab Meeting Recording - ${new Date().toLocaleDateString()}`,
      durationSeconds: Number(durationSeconds),
      fileUrl: fileUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      storagePath: `/recordings/${recId}.mp4`,
      fileSizeBytes: Number(fileSizeBytes),
      thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600",
      status: "ready",
      createdAt: new Date(),
    };

    await db.insert(recordings).values(newRecording);

    return NextResponse.json({ success: true, recording: newRecording });
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
    await db.delete(recordings).where(eq(recordings.id, id));

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
