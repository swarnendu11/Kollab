import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { chatRooms, chatMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const rooms = await db.select().from(chatRooms).orderBy(chatRooms.name);

    return NextResponse.json({ channels: rooms });
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
    const { name, isDirect = false } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const formattedName = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    const channelId = `channel_${formattedName}_${Date.now()}`;

    const db = await getDb();
    const newRoom = {
      id: channelId,
      name: formattedName,
      isDirect: Boolean(isDirect),
      organizationId: "org_kollab",
      createdBy: user.id,
      createdAt: new Date(),
    };

    await db.insert(chatRooms).values(newRoom);

    // Initial message
    await db.insert(chatMessages).values({
      id: `msg_init_${Date.now()}`,
      chatRoomId: channelId,
      senderId: user.id,
      senderName: user.fullName,
      senderAvatar: user.avatarUrl,
      messageText: `Welcome to #${formattedName}! This channel was created by ${user.fullName}.`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, channel: newRoom });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
