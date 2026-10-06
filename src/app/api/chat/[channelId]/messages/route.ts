import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { chatMessages, chatRooms, chatReactions, users, notifications } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, asc, and } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await requireAuth();
    const { channelId } = await params;
    const db = await getDb();

    // Verify channel belongs to user's organization
    const channel = await db
      .select()
      .from(chatRooms)
      .where(and(eq(chatRooms.id, channelId), eq(chatRooms.organizationId, user.organizationId)))
      .limit(1);

    if (channel.length === 0) {
      // Allow default workspace channels and direct message rooms
      if (!channelId.startsWith("channel_") && !channelId.startsWith("dm_")) {
        return NextResponse.json({ error: "Channel not found in your workspace" }, { status: 404 });
      }
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatRoomId, channelId))
      .orderBy(asc(chatMessages.createdAt));

    // Fetch reactions for these messages
    let reactions: any[] = [];
    try {
      reactions = await db.select().from(chatReactions);
    } catch {
      // Gracefully continue if reactions table is not yet ready
    }

    const reactionMap: Record<string, { emoji: string; count: number; users: string[] }[]> = {};
    for (const r of reactions) {
      if (!reactionMap[r.messageId]) reactionMap[r.messageId] = [];
      const existingEmoji = reactionMap[r.messageId].find((e) => e.emoji === r.emoji);
      if (existingEmoji) {
        existingEmoji.count++;
        existingEmoji.users.push(r.userId);
      } else {
        reactionMap[r.messageId].push({ emoji: r.emoji, count: 1, users: [r.userId] });
      }
    }

    const enrichedMessages = messages.map((m: any) => ({
      ...m,
      reactions: reactionMap[m.id] || [],
    }));

    return NextResponse.json({ messages: enrichedMessages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await requireAuth();
    const { channelId } = await params;
    const body = await req.json();
    const { text, attachments = [], parentMessageId = null } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const db = await getDb();
    const messageId = createId("msg");

    const newMessage = {
      id: messageId,
      chatRoomId: channelId,
      senderId: user.id,
      senderName: user.fullName,
      senderAvatar: user.avatarUrl,
      messageText: text.trim(),
      attachments,
      parentMessageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(chatMessages).values(newMessage);

    // Broadcast message.created via Realtime Hub
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "message.created",
      organizationId: user.organizationId,
      channelId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: { message: { ...newMessage, reactions: [] } },
    });

    // Detect @mentions and notify mentioned users
    const mentionMatches = text.match(/@(\w+)/g);
    if (mentionMatches) {
      const allUsers = await db.select().from(users);
      for (const mention of mentionMatches) {
        const username = mention.slice(1).toLowerCase();
        const mentionedUser = allUsers.find(
          (u: any) =>
            u.fullName.toLowerCase().includes(username) ||
            u.email.toLowerCase().includes(username)
        );
        if (mentionedUser && mentionedUser.id !== user.id) {
          await db.insert(notifications).values({
            id: createId("notif"),
            userId: mentionedUser.id,
            type: "chat_mention",
            title: `Mentioned in #${channelId.replace("channel_", "")}`,
            message: `${user.fullName}: "${text.slice(0, 80)}"`,
            link: `/chat?channel=${channelId}`,
            read: false,
            createdAt: new Date(),
          });

          realtimeHub.broadcast({
            id: `rt_notif_${Date.now()}`,
            type: "notification.created",
            organizationId: user.organizationId,
            senderId: user.id,
            timestamp: new Date().toISOString(),
            payload: {
              targetUserId: mentionedUser.id,
              message: `${user.fullName} mentioned you in chat.`,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: { ...newMessage, reactions: [] } });
  } catch (error) {
    console.error("Messages POST error:", error);
    return handleApiError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await requireAuth();
    const { channelId } = await params;
    const body = await req.json();
    const { messageId, text } = body;

    if (!messageId || !text || text.trim() === "") {
      return NextResponse.json({ error: "Message ID and text are required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.chatRoomId, channelId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Only sender or admin can edit
    if (existing[0].senderId !== user.id && user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized to edit this message" }, { status: 403 });
    }

    await db
      .update(chatMessages)
      .set({
        messageText: text.trim(),
        updatedAt: new Date(),
      })
      .where(eq(chatMessages.id, messageId));

    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "message.updated",
      organizationId: user.organizationId,
      channelId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: { messageId, messageText: text.trim(), updatedAt: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, messageId, messageText: text.trim() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await requireAuth();
    const { channelId } = await params;
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.chatRoomId, channelId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Only sender or admin can delete
    if (existing[0].senderId !== user.id && user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized to delete this message" }, { status: 403 });
    }

    await db.delete(chatMessages).where(eq(chatMessages.id, messageId));

    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "message.deleted",
      organizationId: user.organizationId,
      channelId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: { messageId },
    });

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    return handleApiError(error);
  }
}
