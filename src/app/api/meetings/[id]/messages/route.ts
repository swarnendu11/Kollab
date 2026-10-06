import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { chatMessages, chatRooms } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: meetingId } = await params;
    const db = await getDb();
    const roomId = `room_${meetingId}`;

    // Check if room exists
    const room = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
    if (room.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await db
      .select({
        id: chatMessages.id,
        sender: chatMessages.senderName,
        senderAvatar: chatMessages.senderAvatar,
        text: chatMessages.messageText,
        time: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.chatRoomId, roomId))
      .orderBy(asc(chatMessages.createdAt));

    const formatted = messages.map((m: any) => ({
      id: m.id,
      sender: m.sender,
      senderAvatar: m.senderAvatar,
      text: m.text,
      time: new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    return NextResponse.json({ messages: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: meetingId } = await params;
    const body = await req.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const db = await getDb();
    const roomId = `room_${meetingId}`;

    // Ensure chat room exists
    const roomCheck = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
    if (roomCheck.length === 0) {
      await db.insert(chatRooms).values({
        id: roomId,
        name: `meeting-${meetingId}`,
        isDirect: false,
        organizationId: user.organizationId,
        createdBy: user.id,
        createdAt: new Date(),
      });
    }

    const messageId = createId("mmsg");

    const newMessage = {
      id: messageId,
      chatRoomId: roomId,
      senderId: user.id,
      senderName: user.fullName,
      senderAvatar: user.avatarUrl,
      messageText: text.trim(),
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(chatMessages).values(newMessage);

    // Broadcast in-meeting message via realtime hub
    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "message.created",
      organizationId: user.organizationId,
      channelId: roomId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: {
        message: {
          id: messageId,
          sender: user.fullName,
          senderAvatar: user.avatarUrl,
          text: text.trim(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        sender: user.fullName,
        senderAvatar: user.avatarUrl,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
