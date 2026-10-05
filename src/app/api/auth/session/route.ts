import { NextResponse } from "next/server";
import {
  getCurrentUser,
  hashPassword,
  isValidPassword,
  PASSWORD_POLICY_MESSAGE,
  verifyPassword,
} from "@/lib/auth";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users, organizations, organizationMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, fullName, avatarUrl, role } = body;
    const cookieStore = await cookies();
    const db = await getDb();

    // Sign out
    if (action === "signout") {
      cookieStore.delete("kollab_user_id");
      cookieStore.delete("kollab_user_email");
      cookieStore.delete("kollab_user_name");
      cookieStore.delete("kollab_user_avatar");
      return NextResponse.json({ success: true, message: "Signed out" });
    }

    // Sign up
    if (action === "signup") {
      if (!email || !password || !fullName) {
        return NextResponse.json(
          { error: "Name, email, and password are required" },
          { status: 400 }
        );
      }

      if (!isValidPassword(password)) {
        return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 400 }
        );
      }

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const passwordHash = hashPassword(password);
      const generatedAvatar =
        avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`;

      // Insert new user
      await db.insert(users).values({
        id: userId,
        email: normalizedEmail,
        fullName: fullName.trim(),
        passwordHash,
        avatarUrl: generatedAvatar,
        role: "admin",
        status: "active",
      });

      // Ensure default organization exists
      const orgCheck = await db.select().from(organizations).where(eq(organizations.id, "org_kollab")).limit(1);
      if (orgCheck.length === 0) {
        await db.insert(organizations).values({
          id: "org_kollab",
          name: "Kollab Workspace",
          slug: "kollab-workspace",
        });
      }

      // Add to workspace
      await db.insert(organizationMembers).values({
        id: `om_${Date.now()}`,
        organizationId: "org_kollab",
        userId,
        role: "admin",
      });

      // Set auth cookies
      cookieStore.set("kollab_user_id", userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      cookieStore.set("kollab_user_email", normalizedEmail, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set("kollab_user_name", fullName.trim(), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set("kollab_user_avatar", generatedAvatar, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: normalizedEmail,
          fullName: fullName.trim(),
          avatarUrl: generatedAvatar,
          role: "admin",
        },
      });
    }

    // Sign in
    if (action === "signin") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "No account found with this email. Please create an account." },
          { status: 404 }
        );
      }

      const foundUser = existing[0];

      // If user has a password hash, verify it
      if (foundUser.passwordHash) {
        const isValid = verifyPassword(password, foundUser.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
        }
      }

      // Set cookies
      cookieStore.set("kollab_user_id", foundUser.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set("kollab_user_email", foundUser.email, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set("kollab_user_name", foundUser.fullName, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      if (foundUser.avatarUrl) {
        cookieStore.set("kollab_user_avatar", foundUser.avatarUrl, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          fullName: foundUser.fullName,
          avatarUrl: foundUser.avatarUrl,
          role: foundUser.role || "member",
        },
      });
    }

    // Direct session update (profile or current user update)
    if (action === "updateProfile") {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const updateData: any = {};
      if (fullName) updateData.fullName = fullName.trim();
      if (avatarUrl) updateData.avatarUrl = avatarUrl;
      if (role) updateData.role = role;

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, currentUser.id));

        if (fullName) {
          cookieStore.set("kollab_user_name", fullName.trim(), {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
        if (avatarUrl) {
          cookieStore.set("kollab_user_avatar", avatarUrl, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
      }

      return NextResponse.json({ success: true, message: "Profile updated" });
    }

    // Legacy fallback for quick setting session
    const { userId, name, avatar } = body;
    if (userId) {
      cookieStore.set("kollab_user_id", userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      if (email) cookieStore.set("kollab_user_email", email, { path: "/", httpOnly: true, sameSite: "lax" });
      if (name) cookieStore.set("kollab_user_name", name, { path: "/", httpOnly: true, sameSite: "lax" });
      if (avatar) cookieStore.set("kollab_user_avatar", avatar, { path: "/", httpOnly: true, sameSite: "lax" });
      return NextResponse.json({ success: true, userId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
