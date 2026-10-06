import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { createId } from "./id";
import { headers } from "next/headers";

export interface LogAuditOptions {
  organizationId: string;
  actorId?: string | null;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Record an immutable audit log entry.
 */
export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    const db = await getDb();
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const headersList = await headers();
      ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
      userAgent = headersList.get("user-agent");
    } catch {
      // Background or test context
    }

    await db.insert(auditLogs).values({
      id: createId("audit"),
      organizationId: options.organizationId,
      actorId: options.actorId || null,
      actorName: options.actorName,
      action: options.action,
      resourceType: options.resourceType,
      resourceId: options.resourceId || null,
      metadata: options.metadata || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
