import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users, organizations, organizationMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        const u = data.user;
        const cookieStore = await cookies();
        const db = await getDb();

        const email = u.email || "";
        const fullName = u.user_metadata?.full_name || email.split("@")[0] || "User";
        const avatarUrl = u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

        // Sync to database
        const existing = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
        if (existing.length === 0) {
          await db.insert(users).values({
            id: u.id,
            email,
            fullName,
            avatarUrl,
            role: "member",
            status: "active",
          });

          await db.insert(organizationMembers).values({
            id: `om_${Date.now()}`,
            organizationId: "org_kollab",
            userId: u.id,
            role: "member",
          });
        }

        // Set cookies
        cookieStore.set("kollab_user_id", u.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
        cookieStore.set("kollab_user_email", email, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
        cookieStore.set("kollab_user_name", fullName, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
        cookieStore.set("kollab_user_avatar", avatarUrl, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
