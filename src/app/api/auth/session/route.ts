import { NextResponse } from "next/server";
import { getCurrentUser, DEMO_USERS } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user, availableUsers: DEMO_USERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, name, avatar, idToken, action } = body;

    const cookieStore = await cookies();

    if (action === "signout") {
      cookieStore.delete("kollab_user_id");
      cookieStore.delete("kollab_user_email");
      cookieStore.delete("kollab_user_name");
      cookieStore.delete("kollab_user_avatar");
      return NextResponse.json({ success: true, message: "Signed out" });
    }

    if (userId) {
      cookieStore.set("kollab_user_id", userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      if (email) {
        cookieStore.set("kollab_user_email", email, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      if (name) {
        cookieStore.set("kollab_user_name", name, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      if (avatar) {
        cookieStore.set("kollab_user_avatar", avatar, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      return NextResponse.json({ success: true, userId, email, name });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
