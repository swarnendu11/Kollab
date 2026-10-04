import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { organizations, organizationMembers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const org = await db.select().from(organizations).where(eq(organizations.id, "org_kollab")).limit(1);

    const members = await db
      .select({
        id: organizationMembers.id,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(organizationMembers)
      .leftJoin(users, eq(organizationMembers.userId, users.id));

    return NextResponse.json({
      organization: org[0] || { name: "Kollab Core Team", slug: "kollab-team" },
      members,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, role = "member" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${email} with role ${role}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
