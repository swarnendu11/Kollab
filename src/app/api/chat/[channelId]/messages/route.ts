import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { chatMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await params;
    const db = await getDb();

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatRoomId, channelId))
      .orderBy(asc(chatMessages.createdAt));

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await params;
    const body = await req.json();
    const { text, attachments = [], parentMessageId = null } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const db = await getDb();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

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

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
