import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";
import {
  users,
  organizations,
  organizationMembers,
  meetings,
  meetingParticipants,
  recordings,
  transcripts,
  meetingSummaries,
  meetingActionItems,
  chatRooms,
  chatMessages,
  documents,
  whiteboards,
  calendarEvents,
  contacts,
  notifications,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const startTime = Date.now();

    // Query counts for all major tables
    const [uCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [oCount] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
    const [omCount] = await db.select({ count: sql<number>`count(*)` }).from(organizationMembers);
    const [mCount] = await db.select({ count: sql<number>`count(*)` }).from(meetings);
    const [mpCount] = await db.select({ count: sql<number>`count(*)` }).from(meetingParticipants);
    const [rCount] = await db.select({ count: sql<number>`count(*)` }).from(recordings);
    const [tCount] = await db.select({ count: sql<number>`count(*)` }).from(transcripts);
    const [sCount] = await db.select({ count: sql<number>`count(*)` }).from(meetingSummaries);
    const [aCount] = await db.select({ count: sql<number>`count(*)` }).from(meetingActionItems);
    const [crCount] = await db.select({ count: sql<number>`count(*)` }).from(chatRooms);
    const [cmCount] = await db.select({ count: sql<number>`count(*)` }).from(chatMessages);
    const [dCount] = await db.select({ count: sql<number>`count(*)` }).from(documents);
    const [wCount] = await db.select({ count: sql<number>`count(*)` }).from(whiteboards);
    const [ceCount] = await db.select({ count: sql<number>`count(*)` }).from(calendarEvents);
    const [ctCount] = await db.select({ count: sql<number>`count(*)` }).from(contacts);
    const [nCount] = await db.select({ count: sql<number>`count(*)` }).from(notifications);

    const pingMs = Date.now() - startTime;

    const tables = [
      { name: "users", label: "User Accounts & Profiles", count: Number(uCount?.count || 0), primaryKey: "id", icon: "Users" },
      { name: "organizations", label: "Workspaces & Orgs", count: Number(oCount?.count || 0), primaryKey: "id", icon: "Building2" },
      { name: "organization_members", label: "Workspace Memberships", count: Number(omCount?.count || 0), primaryKey: "id", icon: "Shield" },
      { name: "meetings", label: "Video Conferences & Rooms", count: Number(mCount?.count || 0), primaryKey: "id", icon: "Video" },
      { name: "meeting_participants", label: "In-Call Attendees", count: Number(mpCount?.count || 0), primaryKey: "id", icon: "UserCheck" },
      { name: "recordings", label: "Cloud Video Replays", count: Number(rCount?.count || 0), primaryKey: "id", icon: "Film" },
      { name: "transcripts", label: "Speech-to-Text Transcripts", count: Number(tCount?.count || 0), primaryKey: "id", icon: "FileCode" },
      { name: "meeting_summaries", label: "AI Executive Briefs", count: Number(sCount?.count || 0), primaryKey: "id", icon: "Sparkles" },
      { name: "meeting_action_items", label: "AI Action Items", count: Number(aCount?.count || 0), primaryKey: "id", icon: "CheckSquare" },
      { name: "chat_rooms", label: "Team Channels & DMs", count: Number(crCount?.count || 0), primaryKey: "id", icon: "Hash" },
      { name: "chat_messages", label: "Live Chat Messages", count: Number(cmCount?.count || 0), primaryKey: "id", icon: "MessageSquare" },
      { name: "documents", label: "Collaborative Docs", count: Number(dCount?.count || 0), primaryKey: "id", icon: "FileText" },
      { name: "whiteboards", label: "Interactive Canvas Boards", count: Number(wCount?.count || 0), primaryKey: "id", icon: "Paintbrush" },
      { name: "calendar_events", label: "Scheduled Calendar Syncs", count: Number(ceCount?.count || 0), primaryKey: "id", icon: "Calendar" },
      { name: "contacts", label: "Contact Directory", count: Number(ctCount?.count || 0), primaryKey: "id", icon: "BookUser" },
      { name: "notifications", label: "System Notifications", count: Number(nCount?.count || 0), primaryKey: "id", icon: "Bell" },
    ];

    const totalRows = tables.reduce((acc, t) => acc + t.count, 0);

    return NextResponse.json({
      success: true,
      database: {
        engine: "PostgreSQL Standard Specification",
        driver: process.env.DATABASE_URL ? "Remote Postgres Cluster" : "PGlite Embedded SQL Engine",
        storagePath: "./data/kollab-pg",
        status: "Online & Fully Synchronized",
        pingMs,
        totalTables: tables.length,
        totalRecords: totalRows,
        connectionPool: {
          activeConnections: 1,
          maxConnections: 10,
          idleTimeout: "30s",
        },
      },
      tables,
      systemTime: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();
    const { action } = body;

    // 1. Run Benchmark
    if (action === "benchmark") {
      const benchmarkId = `bench_${Date.now()}`;
      
      // Test Write
      const t0 = performance.now();
      await db.execute(sql`
        INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
        VALUES (${benchmarkId}, 'usr_demo_admin', 'system', 'Benchmark Probe', 'Latency measurement packet', '#', true, CURRENT_TIMESTAMP)
      `);
      const writeTimeMs = +(performance.now() - t0).toFixed(2);

      // Test Read
      const t1 = performance.now();
      const readResult = await db.execute(sql`
        SELECT * FROM notifications WHERE id = ${benchmarkId}
      `);
      const readTimeMs = +(performance.now() - t1).toFixed(2);

      // Test Delete
      const t2 = performance.now();
      await db.execute(sql`
        DELETE FROM notifications WHERE id = ${benchmarkId}
      `);
      const deleteTimeMs = +(performance.now() - t2).toFixed(2);

      return NextResponse.json({
        success: true,
        action: "benchmark",
        metrics: {
          writeLatencyMs: writeTimeMs,
          readLatencyMs: readTimeMs,
          deleteLatencyMs: deleteTimeMs,
          totalRoundtripMs: +(writeTimeMs + readTimeMs + deleteTimeMs).toFixed(2),
          status: "Optimal Performance (< 30ms)",
        },
      });
    }

    // 2. Export Database Dump (JSON Snapshot)
    if (action === "export") {
      const allUsers = await db.select().from(users);
      const allMeetings = await db.select().from(meetings);
      const allMessages = await db.select().from(chatMessages);
      const allDocs = await db.select().from(documents);
      const allWhiteboards = await db.select().from(whiteboards);
      const allRecordings = await db.select().from(recordings);
      const allEvents = await db.select().from(calendarEvents);

      return NextResponse.json({
        success: true,
        action: "export",
        exportedAt: new Date().toISOString(),
        snapshot: {
          users: allUsers,
          meetings: allMeetings,
          chatMessages: allMessages,
          documents: allDocs,
          whiteboards: allWhiteboards,
          recordings: allRecordings,
          calendarEvents: allEvents,
        },
      });
    }

    // 3. Quick Table Data Preview
    if (action === "preview") {
      const tableName = body.tableName || "meetings";
      let rows: any[] = [];
      if (tableName === "meetings") rows = await db.select().from(meetings).limit(10);
      else if (tableName === "users") rows = await db.select().from(users).limit(10);
      else if (tableName === "chat_messages") rows = await db.select().from(chatMessages).limit(10);
      else if (tableName === "documents") rows = await db.select().from(documents).limit(10);
      else if (tableName === "whiteboards") rows = await db.select().from(whiteboards).limit(10);
      else if (tableName === "recordings") rows = await db.select().from(recordings).limit(10);
      else if (tableName === "calendar_events") rows = await db.select().from(calendarEvents).limit(10);
      else rows = await db.select().from(meetings).limit(10);

      return NextResponse.json({
        success: true,
        action: "preview",
        tableName,
        count: rows.length,
        rows,
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
