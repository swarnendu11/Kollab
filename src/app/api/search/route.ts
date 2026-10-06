import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  meetings,
  chatMessages,
  documents,
  recordings,
  files,
  tasks,
  users,
  organizationMembers,
  transcripts,
} from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, and, ilike, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export interface SearchResultItem {
  id: string;
  category: "meeting" | "chat" | "document" | "recording" | "file" | "person" | "task" | "transcript";
  title: string;
  snippet: string;
  url: string;
  timestamp?: string;
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const db = await getDb();
    const pattern = `%${query}%`;
    const results: SearchResultItem[] = [];

    // 1. Search Meetings
    const matchedMeetings = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.organizationId, user.organizationId),
          or(ilike(meetings.title, pattern), ilike(meetings.description, pattern))
        )
      )
      .limit(5);

    for (const m of matchedMeetings) {
      results.push({
        id: m.id,
        category: "meeting",
        title: m.title,
        snippet: m.description || `Join code: ${m.joinCode}`,
        url: `/meeting/${m.joinCode}`,
        timestamp: m.createdAt.toISOString(),
      });
    }

    // 2. Search Documents
    const matchedDocs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.organizationId, user.organizationId),
          or(ilike(documents.title, pattern), ilike(documents.content, pattern))
        )
      )
      .limit(5);

    for (const d of matchedDocs) {
      results.push({
        id: d.id,
        category: "document",
        title: d.title,
        snippet: d.content.slice(0, 120),
        url: `/documents/${d.id}`,
        timestamp: d.updatedAt.toISOString(),
      });
    }

    // 3. Search Chat Messages
    const matchedMessages = await db
      .select()
      .from(chatMessages)
      .where(ilike(chatMessages.messageText, pattern))
      .limit(5);

    for (const msg of matchedMessages) {
      results.push({
        id: msg.id,
        category: "chat",
        title: `Message from ${msg.senderName}`,
        snippet: msg.messageText.slice(0, 120),
        url: `/chat?channel=${msg.chatRoomId}`,
        timestamp: msg.createdAt.toISOString(),
      });
    }

    // 4. Search Tasks
    const matchedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, user.organizationId),
          or(ilike(tasks.title, pattern), ilike(tasks.description, pattern))
        )
      )
      .limit(5);

    for (const t of matchedTasks) {
      results.push({
        id: t.id,
        category: "task",
        title: t.title,
        snippet: `Owner: ${t.ownerName} | Status: ${t.status}`,
        url: "/dashboard",
        timestamp: t.createdAt.toISOString(),
      });
    }

    // 5. Search Files
    const matchedFiles = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.organizationId, user.organizationId),
          ilike(files.name, pattern)
        )
      )
      .limit(5);

    for (const f of matchedFiles) {
      results.push({
        id: f.id,
        category: "file",
        title: f.name,
        snippet: `Size: ${f.fileSize} | Type: ${f.fileCategory}`,
        url: f.downloadUrl,
        timestamp: f.createdAt.toISOString(),
      });
    }

    // 6. Search Recordings
    const matchedRecordings = await db
      .select()
      .from(recordings)
      .where(
        and(
          eq(recordings.organizationId, user.organizationId),
          ilike(recordings.title, pattern)
        )
      )
      .limit(5);

    for (const r of matchedRecordings) {
      results.push({
        id: r.id,
        category: "recording",
        title: r.title,
        snippet: `Duration: ${Math.floor(r.durationSeconds / 60)}m ${r.durationSeconds % 60}s`,
        url: "/recordings",
        timestamp: r.createdAt.toISOString(),
      });
    }

    // 7. Search Transcripts
    const matchedTranscripts = await db
      .select({
        id: transcripts.id,
        fullText: transcripts.fullText,
        meetingId: transcripts.meetingId,
        title: meetings.title,
        joinCode: meetings.joinCode,
      })
      .from(transcripts)
      .innerJoin(meetings, eq(transcripts.meetingId, meetings.id))
      .where(
        and(
          eq(meetings.organizationId, user.organizationId),
          ilike(transcripts.fullText, pattern)
        )
      )
      .limit(5);

    for (const tr of matchedTranscripts) {
      const idx = tr.fullText.toLowerCase().indexOf(query.toLowerCase());
      const start = Math.max(0, idx - 40);
      const snippet = "..." + tr.fullText.slice(start, start + 120) + "...";
      results.push({
        id: tr.id,
        category: "transcript",
        title: `Transcript: ${tr.title}`,
        snippet,
        url: `/meeting/${tr.joinCode}/summary`,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
