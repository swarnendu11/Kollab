import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { chatMessages, chatRooms } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const db = await getDb();
    const roomId = `room_${meetingId}`;

    // Check if room exists first
    const room = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
    if (room.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    // Query messages associated with this meeting room
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

    const formatted = messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      senderAvatar: m.senderAvatar,
      text: m.text,
      time: new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    return NextResponse.json({ messages: formatted });
  } catch (error: any) {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const user = await getCurrentUser();
    const body = await req.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const db = await getDb();
    const roomId = `room_${meetingId}`;

    // Ensure chat room exists in database to satisfy foreign key constraint
    const roomCheck = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
    if (roomCheck.length === 0) {
      await db.insert(chatRooms).values({
        id: roomId,
        name: `meeting-${meetingId}`,
        isDirect: false,
        organizationId: "org_kollab",
        createdBy: user?.id || "usr_demo_admin",
        createdAt: new Date(),
      });
    }

    const messageId = `meet_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const senderId = user?.id || "usr_demo_admin";
    const senderName = user?.fullName || body.senderName || "Caller";
    const senderAvatar = user?.avatarUrl || body.senderAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

    const newMessage = {
      id: messageId,
      chatRoomId: roomId,
      senderId,
      senderName,
      senderAvatar,
      messageText: text.trim(),
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(chatMessages).values(newMessage);

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        sender: senderName,
        senderAvatar,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    });
  } catch (error: any) {
    console.error("In-meeting message POST error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
