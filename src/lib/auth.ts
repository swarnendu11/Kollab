import { cookies } from "next/headers";
import { getDb } from "../db";
import { users, organizations, organizationMembers } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { hasPermission, Permission, OrganizationRole } from "./permissions";
import { createId } from "./id";

// ---------- Auth User & Authorization Types ----------

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: OrganizationRole;
  organizationId: string;
  organizationName: string;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Standard Node crypto PBKDF2 Password Hashing (zero external dependencies)
 */
export function hashPassword(password: string, salt?: string): string {
  const finalSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, finalSalt, 1000, 64, "sha512").toString("hex");
  return `${finalSalt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

/**
 * Get the current authenticated user from session cookies & PostgreSQL database.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("kollab_user_id")?.value;

    if (!sessionUserId) {
      return null;
    }

    const db = await getDb();

    // Query application users table
    const matched = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionUserId))
      .limit(1);

    if (matched.length === 0) {
      // Cookie exists but user not in DB (e.g. database wipe) -> check cookie fallback
      const cookieEmail = cookieStore.get("kollab_user_email")?.value;
      const cookieName = cookieStore.get("kollab_user_name")?.value;
      const cookieAvatar = cookieStore.get("kollab_user_avatar")?.value;

      if (cookieEmail && cookieName) {
        return {
          id: sessionUserId,
          email: cookieEmail,
          fullName: cookieName,
          avatarUrl: cookieAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cookieName)}`,
          role: "member",
          organizationId: "org_kollab",
          organizationName: "Kollab Workspace",
        };
      }
      return null;
    }

    const appUser = matched[0];

    // Ensure default organization exists
    const defaultOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, "org_kollab"))
      .limit(1);

    if (defaultOrg.length === 0) {
      await db.insert(organizations).values({
        id: "org_kollab",
        name: "Kollab Workspace",
        slug: "kollab-workspace",
      });
    }

    // Fetch user's organization membership
    const memberships = await db
      .select({
        membershipId: organizationMembers.id,
        role: organizationMembers.role,
        organizationId: organizations.id,
        organizationName: organizations.name,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, appUser.id))
      .limit(1);

    let activeOrgId = "org_kollab";
    let activeOrgName = "Kollab Workspace";
    let role: OrganizationRole = (appUser.role as OrganizationRole) || "member";

    if (memberships.length > 0) {
      activeOrgId = memberships[0].organizationId;
      activeOrgName = memberships[0].organizationName;
      role = (memberships[0].role as OrganizationRole) || role;
    } else {
      // Automatically enroll in primary organization
      await db.insert(organizationMembers).values({
        id: createId("om"),
        organizationId: activeOrgId,
        userId: appUser.id,
        role: role,
      }).onConflictDoNothing();
    }

    return {
      id: appUser.id,
      email: appUser.email,
      fullName: appUser.fullName,
      avatarUrl: appUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(appUser.fullName)}`,
      role,
      organizationId: activeOrgId,
      organizationName: activeOrgName,
    };
  } catch (err) {
    console.warn("getCurrentUser session resolution failed:", err);
    return null;
  }
}

/**
 * Reusable helper: Require authenticated session.
 * Throws AuthError(401) if not logged in.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required. Please sign in.", 401);
  }
  return user;
}

/**
 * Reusable helper: Require membership in specified or current organization.
 */
export async function requireOrganizationMember(targetOrgId?: string): Promise<{
  user: AuthUser;
  organizationId: string;
  role: OrganizationRole;
}> {
  const user = await requireAuth();
  const organizationId = targetOrgId || user.organizationId;

  const db = await getDb();
  const membership = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, user.id)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new AuthError("Access denied: You are not a member of this organization", 403);
  }

  const role = (membership[0].role as OrganizationRole) || "member";
  return { user, organizationId, role };
}

/**
 * Reusable helper: Require specific enterprise role within organization.
 */
export async function requireOrganizationRole(
  requiredRoles: OrganizationRole[],
  targetOrgId?: string
): Promise<{ user: AuthUser; organizationId: string; role: OrganizationRole }> {
  const member = await requireOrganizationMember(targetOrgId);
  if (!requiredRoles.includes(member.role) && member.role !== "owner") {
    throw new AuthError(
      `Insufficient privileges. Required role: ${requiredRoles.join(" or ")}`,
      403
    );
  }
  return member;
}

/**
 * Reusable helper: Require access to a specific resource with optional permission check.
 */
export async function requireResourceAccess(options: {
  resourceType: string;
  resourceId?: string;
  organizationId?: string;
  ownerId?: string | null;
  requiredPermission?: Permission;
}): Promise<{ user: AuthUser; organizationId: string; role: OrganizationRole }> {
  const member = await requireOrganizationMember(options.organizationId);

  // If user is owner of the resource, access is permitted
  if (options.ownerId && options.ownerId === member.user.id) {
    return member;
  }

  // If role check requires permission
  if (options.requiredPermission && !hasPermission(member.role, options.requiredPermission)) {
    throw new AuthError(
      `Access denied: Missing '${options.requiredPermission}' permission on ${options.resourceType}`,
      403
    );
  }

  return member;
}

/**
 * Consistent API error response handler.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
