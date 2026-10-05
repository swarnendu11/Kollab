import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users, organizations, organizationMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  const user = await getCurrentUser();
  const supabaseConfigured = isSupabaseConfigured();
  return NextResponse.json({
    user,
    supabase: {
      configured: supabaseConfigured,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, fullName, avatarUrl, role, supabaseUser } = body;
    const cookieStore = await cookies();
    const db = await getDb();
    const serverSupabase = getServerSupabase();

    // Check Supabase status
    if (action === "supabase_status") {
      return NextResponse.json({
        configured: isSupabaseConfigured(),
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      });
    }

    // Sign out
    if (action === "signout") {
      if (serverSupabase) {
        try {
          await serverSupabase.auth.signOut();
        } catch {}
      }
      cookieStore.delete("kollab_user_id");
      cookieStore.delete("kollab_user_email");
      cookieStore.delete("kollab_user_name");
      cookieStore.delete("kollab_user_avatar");
      return NextResponse.json({ success: true, message: "Signed out" });
    }

    // Synchronize Supabase Client Session to Server Cookies and Database
    if (action === "sync_supabase_session") {
      const u = supabaseUser || body.user;
      if (!u || !u.email) {
        return NextResponse.json({ error: "Invalid user data for synchronization" }, { status: 400 });
      }

      const userId = u.id || `usr_sb_${Date.now()}`;
      const userEmail = u.email.trim().toLowerCase();
      const userName = u.fullName || u.user_metadata?.full_name || u.name || userEmail.split("@")[0];
      const userAvatar =
        u.avatarUrl ||
        u.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`;

      // Check if user exists in database
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

      if (existing.length === 0) {
        // Insert new user
        await db.insert(users).values({
          id: userId,
          email: userEmail,
          fullName: userName,
          avatarUrl: userAvatar,
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

        // Add to workspace members
        await db.insert(organizationMembers).values({
          id: `om_${Date.now()}`,
          organizationId: "org_kollab",
          userId,
          role: "admin",
        });
      } else {
        // Update user avatar or name if needed
        await db
          .update(users)
          .set({
            fullName: userName,
            avatarUrl: userAvatar,
          })
          .where(eq(users.email, userEmail));
      }

      // Set auth cookies
      cookieStore.set("kollab_user_id", userId, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_email", userEmail, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_name", userName, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_avatar", userAvatar, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: userEmail,
          fullName: userName,
          avatarUrl: userAvatar,
          role: "admin",
        },
      });
    }

    // 1-Click Demo Login
    if (action === "demo_login") {
      const demoEmail = (body.email || "alex@kollab.io").trim().toLowerCase();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, demoEmail))
        .limit(1);

      const foundUser = existing[0] || {
        id: "usr_demo_admin",
        email: "alex@kollab.io",
        fullName: "Alex Rivera",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      };

      cookieStore.set("kollab_user_id", foundUser.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_email", foundUser.email, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_name", foundUser.fullName, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      if (foundUser.avatarUrl) {
        cookieStore.set("kollab_user_avatar", foundUser.avatarUrl, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      }

      return NextResponse.json({
        success: true,
        user: foundUser,
      });
    }

    // Register / Sign up
    if (action === "signup") {
      if (!email || !password || !fullName) {
        return NextResponse.json(
          { error: "Name, email, and password are required" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const generatedAvatar =
        avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`;

      let supabaseUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let requiresEmailConfirmation = false;

      // If Supabase is configured, register through Supabase Auth
      if (serverSupabase) {
        const { data: sbData, error: sbError } = await serverSupabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              avatar_url: generatedAvatar,
            },
          },
        });

        if (sbError) {
          return NextResponse.json({ error: sbError.message }, { status: 400 });
        }

        if (sbData.user) {
          supabaseUserId = sbData.user.id;
          // If Supabase has email confirmation enabled and no active session returned
          if (!sbData.session) {
            requiresEmailConfirmation = true;
          }
        }
      }

      // Check if user exists in local database
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing.length > 0 && !serverSupabase) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 400 }
        );
      }

      const passwordHash = hashPassword(password);

      if (existing.length === 0) {
        // Insert new user
        await db.insert(users).values({
          id: supabaseUserId,
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
          userId: supabaseUserId,
          role: "admin",
        });
      }

      // Set auth cookies
      cookieStore.set("kollab_user_id", supabaseUserId, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_email", normalizedEmail, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_name", fullName.trim(), { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_avatar", generatedAvatar, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });

      return NextResponse.json({
        success: true,
        requiresEmailConfirmation,
        provider: serverSupabase ? "supabase" : "local",
        user: {
          id: supabaseUserId,
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

      // If Supabase is configured, authenticate via Supabase Auth
      if (serverSupabase) {
        const { data: sbData, error: sbError } = await serverSupabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (sbError) {
          return NextResponse.json({ error: sbError.message }, { status: 401 });
        }

        if (sbData.user) {
          const u = sbData.user;
          const fullName = u.user_metadata?.full_name || normalizedEmail.split("@")[0];
          const avatarUrl =
            u.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

          // Sync to database
          const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
          if (existing.length === 0) {
            await db.insert(users).values({
              id: u.id,
              email: normalizedEmail,
              fullName,
              avatarUrl,
              role: "admin",
              status: "active",
            });
            await db.insert(organizationMembers).values({
              id: `om_${Date.now()}`,
              organizationId: "org_kollab",
              userId: u.id,
              role: "admin",
            });
          }

          cookieStore.set("kollab_user_id", u.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
          cookieStore.set("kollab_user_email", normalizedEmail, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
          cookieStore.set("kollab_user_name", fullName, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
          cookieStore.set("kollab_user_avatar", avatarUrl, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });

          return NextResponse.json({
            success: true,
            provider: "supabase",
            user: {
              id: u.id,
              email: normalizedEmail,
              fullName,
              avatarUrl,
              role: "admin",
            },
          });
        }
      }

      // Fallback local database verification
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

      if (foundUser.passwordHash) {
        const isValid = verifyPassword(password, foundUser.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
        }
      }

      cookieStore.set("kollab_user_id", foundUser.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_email", foundUser.email, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      cookieStore.set("kollab_user_name", foundUser.fullName, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      if (foundUser.avatarUrl) {
        cookieStore.set("kollab_user_avatar", foundUser.avatarUrl, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      }

      return NextResponse.json({
        success: true,
        provider: "local",
        user: {
          id: foundUser.id,
          email: foundUser.email,
          fullName: foundUser.fullName,
          avatarUrl: foundUser.avatarUrl,
          role: foundUser.role || "member",
        },
      });
    }

    // Direct session update
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
          cookieStore.set("kollab_user_name", fullName.trim(), { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
        }
        if (avatarUrl) {
          cookieStore.set("kollab_user_avatar", avatarUrl, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
        }
      }

      return NextResponse.json({ success: true, message: "Profile updated" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
