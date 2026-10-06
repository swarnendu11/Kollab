import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { organizations, organizationMembers, users, notifications } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { createId } from "@/lib/id";
import { logAuditEvent } from "@/lib/audit";
import { OrganizationRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();

    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);

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
      .where(eq(organizationMembers.organizationId, user.organizationId));

    return NextResponse.json({
      organization: org[0] || { name: user.organizationName, slug: "kollab-team" },
      members,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    await requireResourceAccess({
      resourceType: "organization_members",
      organizationId: user.organizationId,
      requiredPermission: "members:invite",
    });

    const body = await req.json();
    const { email, role = "member" } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const validRoles: OrganizationRole[] = [
      "owner",
      "admin",
      "member",
      "guest",
      "billing_admin",
      "security_admin",
    ];

    if (!validRoles.includes(role as OrganizationRole)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
    }

    const db = await getDb();

    // Check if target user exists in database
    let existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    let targetUserId = existingUsers[0]?.id;

    if (!targetUserId) {
      // Create user placeholder for invited member
      targetUserId = createId("usr");
      const generatedName = normalizedEmail.split("@")[0].replace(/[._-]/g, " ");
      await db.insert(users).values({
        id: targetUserId,
        email: normalizedEmail,
        fullName: generatedName.charAt(0).toUpperCase() + generatedName.slice(1),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(generatedName)}`,
        role: role,
        status: "active",
      });
    }

    // Check if already member
    const existingMembership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, user.organizationId),
          eq(organizationMembers.userId, targetUserId)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 400 });
    }

    const membershipId = createId("om");
    await db.insert(organizationMembers).values({
      id: membershipId,
      organizationId: user.organizationId,
      userId: targetUserId,
      role: role,
    });

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "user.invited",
      resourceType: "member",
      resourceId: targetUserId,
      metadata: { email: normalizedEmail, role },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation successfully processed for ${normalizedEmail} with role ${role}.`,
      member: {
        id: membershipId,
        userId: targetUserId,
        email: normalizedEmail,
        role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();

    await requireResourceAccess({
      resourceType: "organization_members",
      organizationId: user.organizationId,
      requiredPermission: "roles:manage",
    });

    const body = await req.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json({ error: "memberId and role are required" }, { status: 400 });
    }

    const validRoles: OrganizationRole[] = [
      "owner",
      "admin",
      "member",
      "guest",
      "billing_admin",
      "security_admin",
    ];

    if (!validRoles.includes(role as OrganizationRole)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
    }

    const db = await getDb();

    // Verify member exists in this organization
    const memQuery = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, user.organizationId)
        )
      )
      .limit(1);

    if (memQuery.length === 0) {
      return NextResponse.json({ error: "Member not found in workspace" }, { status: 404 });
    }

    const oldRole = memQuery[0].role;
    await db
      .update(organizationMembers)
      .set({ role })
      .where(eq(organizationMembers.id, memberId));

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "role.changed",
      resourceType: "member",
      resourceId: memQuery[0].userId,
      metadata: { memberId, oldRole, newRole: role },
    });

    return NextResponse.json({ success: true, memberId, role });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();

    await requireResourceAccess({
      resourceType: "organization_members",
      organizationId: user.organizationId,
      requiredPermission: "members:manage",
    });

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const db = await getDb();

    const memQuery = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, user.organizationId)
        )
      )
      .limit(1);

    if (memQuery.length === 0) {
      return NextResponse.json({ error: "Member not found in workspace" }, { status: 404 });
    }

    if (memQuery[0].role === "owner") {
      return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 400 });
    }

    await db.delete(organizationMembers).where(eq(organizationMembers.id, memberId));

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "user.removed",
      resourceType: "member",
      resourceId: memQuery[0].userId,
      metadata: { memberId },
    });

    return NextResponse.json({ success: true, memberId });
  } catch (error) {
    return handleApiError(error);
  }
}
