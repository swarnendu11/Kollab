import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, chatMessages, documents, recordings } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export interface ActivityItem {
  id: string;
  type: "meeting" | "message" | "document" | "recording" | "system";
  title: string;
  description: string;
  author: string;
  timestamp: string;
  link: string;
  badge?: string;
}

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();

    // Query latest messages
    const recentMessages = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(3);

    // Query latest meetings for user's organization
    const recentMeetings = await db
      .select()
      .from(meetings)
      .where(eq(meetings.organizationId, user.organizationId))
      .orderBy(desc(meetings.createdAt))
      .limit(3);

    // Query latest documents for user's organization
    const recentDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.organizationId, user.organizationId))
      .orderBy(desc(documents.updatedAt))
      .limit(3);

    // Query latest recordings for user's organization
    const recentRecordings = await db
      .select()
      .from(recordings)
      .where(eq(recordings.organizationId, user.organizationId))
      .orderBy(desc(recordings.createdAt))
      .limit(2);

    const activities: ActivityItem[] = [];

    for (const msg of recentMessages) {
      activities.push({
        id: `act_${msg.id}`,
        type: "message",
        title: `Message in #${msg.chatRoomId.replace("channel_", "")}`,
        description: msg.messageText.length > 60 ? `${msg.messageText.slice(0, 60)}...` : msg.messageText,
        author: msg.senderName,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        link: `/chat?channel=${msg.chatRoomId}`,
        badge: "Chat",
      });
    }

    for (const m of recentMeetings) {
      activities.push({
        id: `act_${m.id}`,
        type: "meeting",
        title: m.title,
        description: m.status === "live" ? "Meeting is currently live" : `Meeting code: ${m.joinCode}`,
        author: "Host",
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        link: `/meeting/${m.joinCode}`,
        badge: m.status === "live" ? "Live Call" : "Meeting",
      });
    }

    for (const d of recentDocs) {
      activities.push({
        id: `act_${d.id}`,
        type: "document",
        title: d.title,
        description: `Updated document notes`,
        author: "Collaborator",
        timestamp: new Date(d.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        link: `/documents/${d.id}`,
        badge: "Document",
      });
    }

    for (const r of recentRecordings) {
      activities.push({
        id: `act_${r.id}`,
        type: "recording",
        title: r.title,
        description: `Duration: ${Math.floor(r.durationSeconds / 60)}m ${r.durationSeconds % 60}s`,
        author: "Kollab Cloud",
        timestamp: new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        link: "/recordings",
        badge: "Recording",
      });
    }

    return NextResponse.json({ activities });
  } catch (error) {
    return handleApiError(error);
  }
}
