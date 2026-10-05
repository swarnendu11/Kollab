import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, chatMessages, documents, recordings, users } from "@/db/schema";
import { desc } from "drizzle-orm";

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
    const db = await getDb();

    // Query latest messages
    const recentMessages = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(3);

    // Query latest meetings
    const recentMeetings = await db
      .select()
      .from(meetings)
      .orderBy(desc(meetings.createdAt))
      .limit(3);

    // Query latest documents
    const recentDocs = await db
      .select()
      .from(documents)
      .orderBy(desc(documents.updatedAt))
      .limit(3);

    // Query latest recordings
    const recentRecordings = await db
      .select()
      .from(recordings)
      .orderBy(desc(recordings.createdAt))
      .limit(2);

    const activities: ActivityItem[] = [];

    // Map chat messages
    for (const msg of recentMessages) {
      activities.push({
        id: `act_${msg.id}`,
        type: "message",
        title: `Message in #${msg.chatRoomId.replace("channel_", "")}`,
        description: msg.messageText.length > 60 ? `${msg.messageText.slice(0, 60)}...` : msg.messageText,
        author: msg.senderName,
        timestamp: new Date(msg.createdAt).toISOString(),
        link: "/chat",
        badge: "Chat",
      });
    }

    // Map meetings
    for (const m of recentMeetings) {
      activities.push({
        id: `act_${m.id}`,
        type: "meeting",
        title: m.title,
        description: `Meeting code: ${m.joinCode} • Status: ${m.status}`,
        author: "Host",
        timestamp: new Date(m.createdAt).toISOString(),
        link: `/meeting/${m.id}/prejoin`,
        badge: m.status.toUpperCase(),
      });
    }

    // Map documents
    for (const doc of recentDocs) {
      activities.push({
        id: `act_${doc.id}`,
        type: "document",
        title: doc.title,
        description: "Document draft synced to workspace cloud",
        author: "Team",
        timestamp: new Date(doc.updatedAt).toISOString(),
        link: `/documents/${doc.id}`,
        badge: "Doc",
      });
    }

    // Map recordings
    for (const rec of recentRecordings) {
      activities.push({
        id: `act_${rec.id}`,
        type: "recording",
        title: rec.meetingTitle || "Meeting Recording",
        description: `HD video replay available (${Math.floor((rec.durationSeconds || 0) / 60)}m ${Math.floor((rec.durationSeconds || 0) % 60)}s)`,
        author: "AI Recorder",
        timestamp: new Date(rec.createdAt).toISOString(),
        link: "/recordings",
        badge: "Replay",
      });
    }

    // Sort all activities chronologically desc
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      count: activities.length,
      activities: activities.slice(0, 6),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
