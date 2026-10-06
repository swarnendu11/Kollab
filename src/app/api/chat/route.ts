import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { chatRooms, chatMessages } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();

    // Strictly scoped to user's organization
    const rooms = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.organizationId, user.organizationId))
      .orderBy(asc(chatRooms.name));

    return NextResponse.json({ channels: rooms });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, isDirect = false } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    const formattedName = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");
    const channelId = createId("channel");

    const db = await getDb();
    const newRoom = {
      id: channelId,
      name: formattedName,
      isDirect: Boolean(isDirect),
      organizationId: user.organizationId,
      createdBy: user.id,
      createdAt: new Date(),
    };

    await db.insert(chatRooms).values(newRoom);

    // Initial welcome message
    const initMessageId = createId("msg");
    const initMessage = {
      id: initMessageId,
      chatRoomId: channelId,
      senderId: user.id,
      senderName: user.fullName,
      senderAvatar: user.avatarUrl,
      messageText: `Welcome to #${formattedName}! Channel created by ${user.fullName}.`,
      attachments: [],
      parentMessageId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(chatMessages).values(initMessage);

    // Broadcast channel creation via realtime hub
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "channel.created",
      organizationId: user.organizationId,
      timestamp: new Date().toISOString(),
      payload: { channel: newRoom },
    });

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "channel.created",
      resourceType: "channel",
      resourceId: channelId,
      metadata: { name: formattedName, isDirect },
    });

    return NextResponse.json({ success: true, channel: newRoom });
  } catch (error) {
    return handleApiError(error);
  }
}
