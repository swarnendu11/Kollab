import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, chatMessages, chatRooms, documents, recordings, tasks, users } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export interface ActivityItem {
  id: string;
  type: "meeting" | "message" | "document" | "recording" | "task" | "system";
  title: string;
  description: string;
  author: string;
  timestamp: string;
  link: string;
  badge?: string;
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const activities: (ActivityItem & { rawTime: number })[] = [];

    // 1. Query latest chat messages with channel verification
    const recentMessages = await db
      .select({
        id: chatMessages.id,
        chatRoomId: chatMessages.chatRoomId,
        channelName: chatRooms.name,
        senderName: chatMessages.senderName,
        messageText: chatMessages.messageText,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .innerJoin(chatRooms, eq(chatMessages.chatRoomId, chatRooms.id))
      .where(eq(chatRooms.organizationId, user.organizationId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(6);

    for (const msg of recentMessages) {
      const msgDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
      activities.push({
        id: `act_msg_${msg.id}`,
        type: "message",
        title: `Message in #${msg.channelName || "general"}`,
        description: msg.messageText.length > 70 ? `${msg.messageText.slice(0, 70)}...` : msg.messageText,
        author: msg.senderName || "Team Member",
        timestamp: msgDate.toISOString(),
        rawTime: msgDate.getTime(),
        link: `/chat?channel=${msg.chatRoomId}`,
        badge: "Chat",
      });
    }

    // 2. Query latest meetings with real host names
    const recentMeetings = await db
      .select({
        id: meetings.id,
        title: meetings.title,
        joinCode: meetings.joinCode,
        status: meetings.status,
        createdAt: meetings.createdAt,
        hostName: users.fullName,
      })
      .from(meetings)
      .leftJoin(users, eq(meetings.hostId, users.id))
      .where(eq(meetings.organizationId, user.organizationId))
      .orderBy(desc(meetings.createdAt))
      .limit(6);

    for (const m of recentMeetings) {
      const meetDate = m.createdAt ? new Date(m.createdAt) : new Date();
      activities.push({
        id: `act_meet_${m.id}`,
        type: "meeting",
        title: m.title,
        description: m.status === "live" ? "Meeting is live now" : `Room code: ${m.joinCode}`,
        author: m.hostName || user.fullName || "Host",
        timestamp: meetDate.toISOString(),
        rawTime: meetDate.getTime(),
        link: `/meeting/${m.id}/prejoin`,
        badge: m.status === "live" ? "Live Call" : "Meeting",
      });
    }

    // 3. Query latest documents with real author names
    const recentDocs = await db
      .select({
        id: documents.id,
        title: documents.title,
        updatedAt: documents.updatedAt,
        authorName: users.fullName,
      })
      .from(documents)
      .leftJoin(users, eq(documents.authorId, users.id))
      .where(eq(documents.organizationId, user.organizationId))
      .orderBy(desc(documents.updatedAt))
      .limit(4);

    for (const d of recentDocs) {
      const docDate = d.updatedAt ? new Date(d.updatedAt) : new Date();
      activities.push({
        id: `act_doc_${d.id}`,
        type: "document",
        title: d.title,
        description: "Updated document notes & content",
        author: d.authorName || user.fullName || "Collaborator",
        timestamp: docDate.toISOString(),
        rawTime: docDate.getTime(),
        link: `/documents/${d.id}`,
        badge: "Document",
      });
    }

    // 4. Query latest recordings with real host attribution
    const recentRecordings = await db
      .select({
        id: recordings.id,
        title: recordings.title,
        durationSeconds: recordings.durationSeconds,
        createdAt: recordings.createdAt,
        hostName: users.fullName,
      })
      .from(recordings)
      .leftJoin(meetings, eq(recordings.meetingId, meetings.id))
      .leftJoin(users, eq(meetings.hostId, users.id))
      .where(eq(recordings.organizationId, user.organizationId))
      .orderBy(desc(recordings.createdAt))
      .limit(4);

    for (const r of recentRecordings) {
      const recDate = r.createdAt ? new Date(r.createdAt) : new Date();
      const mins = Math.floor(r.durationSeconds / 60);
      const secs = r.durationSeconds % 60;
      activities.push({
        id: `act_rec_${r.id}`,
        type: "recording",
        title: r.title,
        description: `Session capture duration: ${mins}m ${secs}s`,
        author: r.hostName || user.fullName || "Session Host",
        timestamp: recDate.toISOString(),
        rawTime: recDate.getTime(),
        link: "/recordings",
        badge: "Recording",
      });
    }

    // 5. Query latest tasks and action items
    const recentTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.organizationId, user.organizationId))
      .orderBy(desc(tasks.createdAt))
      .limit(4);

    for (const t of recentTasks) {
      const taskDate = t.createdAt ? new Date(t.createdAt) : new Date();
      activities.push({
        id: `act_task_${t.id}`,
        type: "task",
        title: t.title,
        description: t.description || `Task priority: ${t.priority.toUpperCase()}`,
        author: t.ownerName || user.fullName || "Team Member",
        timestamp: taskDate.toISOString(),
        rawTime: taskDate.getTime(),
        link: "/dashboard",
        badge: t.status === "done" ? "Completed" : "Action Item",
      });
    }

    // Sort all activities chronologically (newest first)
    activities.sort((a, b) => b.rawTime - a.rawTime);

    // Strip internal rawTime field
    const responseActivities = activities.slice(0, limit).map(({ rawTime, ...item }) => item);

    return NextResponse.json({ activities: responseActivities });
  } catch (error) {
    return handleApiError(error);
  }
}
