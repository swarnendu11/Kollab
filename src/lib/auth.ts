import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
}

export const DEMO_USERS: UserSession[] = [
  {
    id: "user_alex",
    email: "alex.morgan@kollab.io",
    fullName: "Alex Morgan",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    role: "admin",
  },
  {
    id: "user_sarah",
    email: "sarah.chen@kollab.io",
    fullName: "Sarah Chen",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    role: "member",
  },
  {
    id: "user_david",
    email: "david.kim@kollab.io",
    fullName: "David Kim",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    role: "member",
  },
  {
    id: "user_elena",
    email: "elena.rostova@kollab.io",
    fullName: "Elena Rostova",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    role: "member",
  },
];

export async function getCurrentUser(): Promise<UserSession | null> {
  const hasClerkKeys =
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    Boolean(process.env.CLERK_SECRET_KEY);

  if (hasClerkKeys) {
    try {
      const { auth, currentUser } = await import("@clerk/nextjs/server");
      const clerkAuth = await auth();
      if (!clerkAuth.userId) {
        return null;
      }
      const clerkUser = await currentUser();
      if (clerkUser) {
        return {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "user@kollab.io",
          fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Kollab User",
          avatarUrl: clerkUser.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          role: "member",
        };
      }
    } catch (e) {
      console.warn("Clerk auth resolution fell back to session cookie:", e);
    }
  }

  // Session cookie resolution
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("kollab_user_id")?.value;
    if (sessionCookie) {
      const matched = DEMO_USERS.find((u) => u.id === sessionCookie);
      if (matched) return matched;

      // Firebase user session from cookies
      const userEmail = cookieStore.get("kollab_user_email")?.value;
      const userName = cookieStore.get("kollab_user_name")?.value;
      const userAvatar = cookieStore.get("kollab_user_avatar")?.value;

      if (userEmail || userName) {
        return {
          id: sessionCookie,
          email: userEmail || `${sessionCookie}@kollab.io`,
          fullName: userName || "Kollab Member",
          avatarUrl: userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userName || sessionCookie}`,
          role: "member",
        };
      }

      // Query database for custom signed up user
      const db = await getDb();
      const res = await db.select().from(users).where(eq(users.id, sessionCookie)).limit(1);
      if (res.length > 0) {
        return {
          id: res[0].id,
          email: res[0].email,
          fullName: res[0].fullName,
          avatarUrl: res[0].avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          role: res[0].role || "member",
        };
      }
    }
  } catch (err) {
    // In static rendering or non-request context
  }

  // Default active user for seamless instant access & browser testing
  return DEMO_USERS[0];
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Please sign in to Kollab.");
  }
  return user;
}
