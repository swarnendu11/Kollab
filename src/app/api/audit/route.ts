import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();

    // Check enterprise audit:view permission
    await requireResourceAccess({
      resourceType: "audit_logs",
      organizationId: user.organizationId,
      requiredPermission: "audit:view",
    });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));

    const db = await getDb();
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        actorId: auditLogs.actorId,
        actorName: auditLogs.actorName,
        metadata: auditLogs.metadata,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        timestamp: auditLogs.timestamp,
      })
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, user.organizationId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);

    return NextResponse.json({ auditLogs: logs });
  } catch (error) {
    return handleApiError(error);
  }
}
