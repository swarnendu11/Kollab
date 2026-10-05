import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db";
import * as authSchema from "../db/auth-schema";
import { headers } from "next/headers";
import crypto from "crypto";

// ---------- Better Auth Instance (lazy, singleton) ----------

let authInstance: ReturnType<typeof betterAuth> | null = null;
let authInitPromise: Promise<ReturnType<typeof betterAuth>> | null = null;

export async function getAuth() {
  if (authInstance) return authInstance;
  if (!authInitPromise) {
    authInitPromise = (async () => {
      const db = await getDb();
      const instance = betterAuth({
        database: drizzleAdapter(db, {
          provider: "pg",
          schema: authSchema,
        }),
        baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        secret: process.env.BETTER_AUTH_SECRET,
        emailAndPassword: {
          enabled: true,
          minPasswordLength: 6,
        },
      });
      authInstance = instance;
      return instance;
    })();
  }
  return authInitPromise;
}

// Proxy so existing `import { auth } from "@/lib/auth"` keeps working
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    if (prop === "handler") {
      return async (request: Request) => {
        const instance = await getAuth();
        return instance.handler(request);
      };
    }
    if (prop === "api") {
      return new Proxy({} as any, {
        get(_t, apiProp) {
          return async (...args: any[]) => {
            const instance = await getAuth();
            return (instance.api as any)[apiProp](...args);
          };
        },
      });
    }
    return undefined;
  },
});

// ---------- Compatibility helpers (used by existing API routes) ----------

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string;
}

/**
 * Get the current authenticated user from the Better Auth session.
 * Falls back to legacy kollab_user_* cookies during migration.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Try Better Auth session first
    const instance = await getAuth();
    const headersList = await headers();
    const sessionResult = await instance.api.getSession({
      headers: headersList,
    });

    if (sessionResult?.user) {
      return {
        id: sessionResult.user.id,
        email: sessionResult.user.email,
        fullName: sessionResult.user.name || sessionResult.user.email,
        avatarUrl: sessionResult.user.image || null,
        role: "member",
      };
    }
  } catch {
    // Better Auth session not available, fall through
  }

  // Fallback: legacy cookie-based session
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const userId = cookieStore.get("kollab_user_id")?.value;
    if (!userId) return null;

    return {
      id: userId,
      email: cookieStore.get("kollab_user_email")?.value || "",
      fullName: cookieStore.get("kollab_user_name")?.value || "User",
      avatarUrl: cookieStore.get("kollab_user_avatar")?.value || null,
      role: "member",
    };
  } catch {
    return null;
  }
}

/**
 * Hash a password using SHA-256 (simple, for the legacy session route).
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify a password against a hash.
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
