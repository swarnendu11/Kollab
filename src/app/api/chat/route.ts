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

    // Standard workspace channels
    const channels = await db
      .select()
      .from(chatRooms)
      .where(and(eq(chatRooms.organizationId, user.organizationId), eq(chatRooms.isDirect, false)))
      .orderBy(asc(chatRooms.name));

    // Direct message rooms
    const allDms = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.isDirect, true));

    // Filter DMs that involve current user (id contains user.id)
    const userDms = allDms.filter(
      (dm: any) => dm.id.includes(user.id) || dm.createdBy === user.id
    );

    // Resolve other user's info for each DM
    const { users } = await import("@/db/schema");
    const allUsers = await db.select().from(users);

    const enrichedDms = userDms.map((dm: any) => {
      // Find recipient user id from dm id
      let otherUser: any = null;
      if (dm.id.startsWith("dm_")) {
        const parts = dm.id.replace("dm_", "").split("_");
        const otherId = parts.find((p: string) => p !== user.id) || dm.createdBy;
        otherUser = allUsers.find((u: any) => u.id === otherId);
      }
      return {
        ...dm,
        recipientName: otherUser?.fullName || dm.name,
        recipientAvatar: otherUser?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(dm.name)}`,
        recipientEmail: otherUser?.email,
        recipientId: otherUser?.id,
      };
    });

    return NextResponse.json({
      channels,
      directMessages: enrichedDms,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, isDirect = false, recipientId = null } = body;

    const db = await getDb();

    // 1. Handle Direct Message Room Creation or Lookup
    if (isDirect && recipientId) {
      const { users } = await import("@/db/schema");
      const targetUser = await db
        .select()
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1);

      const targetName = targetUser[0]?.fullName || name || "Direct Message";
      const targetAvatar = targetUser[0]?.avatarUrl;

      // Deterministic room id so both participants join the exact same room
      const sortedIds = [user.id, recipientId].sort();
      const dmChannelId = `dm_${sortedIds[0]}_${sortedIds[1]}`;

      const existing = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.id, dmChannelId))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({
          success: true,
          channel: {
            ...existing[0],
            recipientName: targetName,
            recipientAvatar: targetAvatar,
            recipientId,
          },
          alreadyExists: true,
        });
      }

      const newDmRoom = {
        id: dmChannelId,
        name: targetName,
        isDirect: true,
        organizationId: user.organizationId,
        createdBy: user.id,
        createdAt: new Date(),
      };

      await db.insert(chatRooms).values(newDmRoom);

      // Welcome message in DM
      const initMessageId = createId("msg");
      await db.insert(chatMessages).values({
        id: initMessageId,
        chatRoomId: dmChannelId,
        senderId: user.id,
        senderName: user.fullName,
        senderAvatar: user.avatarUrl,
        messageText: `Direct message started between ${user.fullName} and ${targetName}.`,
        attachments: [],
        parentMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        channel: {
          ...newDmRoom,
          recipientName: targetName,
          recipientAvatar: targetAvatar,
          recipientId,
        },
      });
    }

    // 2. Handle standard channel creation
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    const formattedName = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");
    const channelId = createId("channel");

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
