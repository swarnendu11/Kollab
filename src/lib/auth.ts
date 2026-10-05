import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const PASSWORD_POLICY_MESSAGE =
  "Password must be 6-8 characters and include uppercase, lowercase, a number, and a symbol (e.g., @, #, !).";

export function isValidPassword(password: string): boolean {
  return (
    password.length >= 6 &&
    password.length <= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
}

/**
 * Hash password using standard Node crypto PBKDF2 (zero external dependencies)
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

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("kollab_user_id")?.value;

    if (!sessionUserId) {
      return null;
    }

    const db = await getDb();
    const matched = await db.select().from(users).where(eq(users.id, sessionUserId)).limit(1);

    if (matched.length > 0) {
      const u = matched[0];
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.fullName)}`,
        role: u.role || "member",
      };
    }

    // Check if session cookies carry valid name/email if user was created in this session
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
      };
    }
  } catch (err) {
    // In static generation or prerender
  }

  return null;
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Please sign in to Kollab.");
  }
  return user;
}
