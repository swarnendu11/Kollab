import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  organizations,
  organizationMembers,
  users,
  meetings,
  chatRooms,
  files,
  auditLogs,
  workspaceUsage,
} from "@/db/schema";
import { requireOrganizationRole, handleApiError } from "@/lib/auth";
import { eq, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Only Admin and Owner can access admin console
    const { user, organizationId } = await requireOrganizationRole(["admin", "owner"]);

    const db = await getDb();

    // Query organization details
    const orgQuery = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);

    // Query members with roles
    const members = await db
      .select({
        id: organizationMembers.id,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
      })
      .from(organizationMembers)
      .leftJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, organizationId));

    // Aggregate statistics
    const [meetingsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(meetings)
      .where(eq(meetings.organizationId, organizationId));

    const [channelsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatRooms)
      .where(eq(chatRooms.organizationId, organizationId));

    const [filesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(eq(files.organizationId, organizationId));

    // Recent audit logs
    const recentAuditLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, organizationId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(8);

    // Workspace usage
    const usageQuery = await db
      .select()
      .from(workspaceUsage)
      .where(eq(workspaceUsage.organizationId, organizationId))
      .limit(1);

    return NextResponse.json({
      organization: orgQuery[0] || { id: organizationId, name: "Kollab Workspace", slug: "kollab-workspace" },
      stats: {
        totalMembers: members.length,
        totalMeetings: Number(meetingsCount?.count || 0),
        totalChannels: Number(channelsCount?.count || 0),
        totalFiles: Number(filesCount?.count || 0),
      },
      members,
      recentAuditLogs,
      usage: usageQuery[0] || {
        storageBytes: 15400000,
        recordingMinutes: 45,
        meetingMinutes: 120,
        aiUsageCount: 18,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
