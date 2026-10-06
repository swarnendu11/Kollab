import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { chatReactions, chatMessages } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string; messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { channelId, messageId } = await params;
    const body = await req.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    const db = await getDb();

    // Check if user already reacted with this emoji
    const existing = await db
      .select()
      .from(chatReactions)
      .where(
        and(
          eq(chatReactions.messageId, messageId),
          eq(chatReactions.userId, user.id),
          eq(chatReactions.emoji, emoji)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Toggle off
      await db.delete(chatReactions).where(eq(chatReactions.id, existing[0].id));

      realtimeHub.broadcast({
        id: `rt_${Date.now()}`,
        type: "reaction.deleted",
        organizationId: user.organizationId,
        channelId,
        senderId: user.id,
        timestamp: new Date().toISOString(),
        payload: { messageId, emoji, userId: user.id },
      });

      return NextResponse.json({ success: true, action: "removed", emoji });
    }

    // Toggle on
    const reactionId = createId("react");
    await db.insert(chatReactions).values({
      id: reactionId,
      messageId,
      userId: user.id,
      emoji,
      createdAt: new Date(),
    });

    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "reaction.created",
      organizationId: user.organizationId,
      channelId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: { messageId, emoji, userId: user.id, reactionId },
    });

    return NextResponse.json({ success: true, action: "added", emoji });
  } catch (error) {
    return handleApiError(error);
  }
}
