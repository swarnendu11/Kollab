import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";
import { users, meetings, chatMessages, documents, recordings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    const db = await getDb();

    // 1. Test database ping query
    const dbPingStart = Date.now();
    await db.execute(sql`SELECT 1 as ping`);
    const dbPingMs = Date.now() - dbPingStart;

    // 2. Fetch live table statistics
    const [uCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [mCount] = await db.select({ count: sql<number>`count(*)` }).from(meetings);
    const [cCount] = await db.select({ count: sql<number>`count(*)` }).from(chatMessages);
    const [dCount] = await db.select({ count: sql<number>`count(*)` }).from(documents);
    const [rCount] = await db.select({ count: sql<number>`count(*)` }).from(recordings);

    const mem = process.memoryUsage();
    const totalDurationMs = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      service: "Kollab Enterprise Backend",
      version: "2.5.0",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        driver: process.env.DATABASE_URL ? "PostgreSQL (Remote Cluster)" : "PGlite (Embedded High-Performance SQL Engine)",
        pingMs: dbPingMs,
        tables: {
          users: Number(uCount?.count || 0),
          meetings: Number(mCount?.count || 0),
          chatMessages: Number(cCount?.count || 0),
          documents: Number(dCount?.count || 0),
          recordings: Number(rCount?.count || 0),
        },
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(mem.rss / 1024 / 1024),
        memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
      },
      responseTimeMs: totalDurationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        service: "Kollab Enterprise Backend",
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
