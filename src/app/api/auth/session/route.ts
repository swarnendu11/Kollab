import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword, handleApiError } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users, organizations, organizationMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, fullName, avatarUrl, role } = body;
    const cookieStore = await cookies();
    const db = await getDb();

    // 1. Sign out
    if (action === "signout") {
      cookieStore.delete("kollab_user_id");
      cookieStore.delete("kollab_user_email");
      cookieStore.delete("kollab_user_name");
      cookieStore.delete("kollab_user_avatar");

      return NextResponse.json({ success: true, message: "Signed out successfully" });
    }

    // 2. Demo Persona Quick-Switcher
    if (action === "demo_login") {
      const demoEmail = (body.email || "alex.rivera@kollab.io").trim().toLowerCase();

      let targetName = "Alex Rivera";
      let targetAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
      let targetRole = "owner";

      if (demoEmail.includes("sarah")) {
        targetName = "Sarah Chen";
        targetAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";
        targetRole = "admin";
      } else if (demoEmail.includes("marcus")) {
        targetName = "Marcus Vance";
        targetAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
        targetRole = "member";
      } else if (demoEmail.includes("priya")) {
        targetName = "Priya Sharma";
        targetAvatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150";
        targetRole = "admin";
      } else if (demoEmail.includes("david")) {
        targetName = "David Kim";
        targetAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150";
        targetRole = "member";
      }

      // Check existing user
      let matched = await db
        .select()
        .from(users)
        .where(eq(users.email, demoEmail))
        .limit(1);

      let targetUserId: string;

      if (matched.length > 0) {
        targetUserId = matched[0].id;
        targetName = matched[0].fullName;
        targetAvatar = matched[0].avatarUrl || targetAvatar;
        targetRole = matched[0].role || targetRole;
      } else {
        targetUserId = createId("usr");
        await db.insert(users).values({
          id: targetUserId,
          email: demoEmail,
          fullName: targetName,
          passwordHash: hashPassword("demo1234"),
          avatarUrl: targetAvatar,
          role: targetRole,
          status: "active",
        });
      }

      // Ensure default organization exists
      const orgCheck = await db.select().from(organizations).where(eq(organizations.id, "org_kollab")).limit(1);
      if (orgCheck.length === 0) {
        await db.insert(organizations).values({
          id: "org_kollab",
          name: "Kollab Workspace",
          slug: "kollab-workspace",
        });
      }

      // Add to organization members
      await db.insert(organizationMembers).values({
        id: createId("om"),
        organizationId: "org_kollab",
        userId: targetUserId,
        role: targetRole,
      }).onConflictDoNothing();

      // Set auth cookies
      cookieStore.set("kollab_user_id", targetUserId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set("kollab_user_email", demoEmail, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set("kollab_user_name", targetName, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set("kollab_user_avatar", targetAvatar, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: targetUserId,
          email: demoEmail,
          fullName: targetName,
          avatarUrl: targetAvatar,
          role: targetRole,
          organizationId: "org_kollab",
          organizationName: "Kollab Workspace",
        },
      });
    }

    // 3. User Sign Up
    if (action === "signup") {
      if (!email || !password || !fullName) {
        return NextResponse.json(
          { error: "Full name, email address, and password are required." },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
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
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 400 }
        );
      }

      const userId = createId("usr");
      const passwordHash = hashPassword(password);
      const generatedAvatar =
        avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`;

      // Insert new user into database
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

      // Add to organization members
      await db.insert(organizationMembers).values({
        id: createId("om"),
        organizationId: "org_kollab",
        userId,
        role: "admin",
      });

      // Set auth cookies
      cookieStore.set("kollab_user_id", userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
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
          organizationId: "org_kollab",
          organizationName: "Kollab Workspace",
        },
      });
    }

    // 4. User Sign In
    if (action === "signin") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required." },
          { status: 400 }
        );
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
          return NextResponse.json(
            { error: "Incorrect password. Please verify and try again." },
            { status: 401 }
          );
        }
      }

      const userAvatar =
        foundUser.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(foundUser.fullName)}`;

      // Set session cookies
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
      cookieStore.set("kollab_user_avatar", userAvatar, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          fullName: foundUser.fullName,
          avatarUrl: userAvatar,
          role: foundUser.role || "member",
          organizationId: "org_kollab",
          organizationName: "Kollab Workspace",
        },
      });
    }

    // 5. Update Profile
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

      return NextResponse.json({ success: true, message: "Profile updated successfully" });
    }

    // 6. Direct Session Setter
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

    return NextResponse.json({ error: "Invalid action provided" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process auth request" }, { status: 500 });
  }
}
