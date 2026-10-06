import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users, contacts } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, or, ilike, and, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 1) {
      return NextResponse.json({ users: [] });
    }

    const db = await getDb();
    const pattern = `%${query}%`;

    // Search for users matching query by email OR fullName, excluding current user
    const matchedUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          ne(users.id, user.id),
          or(ilike(users.email, pattern), ilike(users.fullName, pattern))
        )
      )
      .limit(10);

    // Fetch user's existing contacts to see if already saved
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, user.id));

    const savedEmails = new Set(existingContacts.map((c: any) => c.contactEmail?.toLowerCase()));
    const savedUserIds = new Set(existingContacts.map((c: any) => c.contactUserId).filter(Boolean));

    const results = matchedUsers.map((u: any) => {
      const isSaved = savedUserIds.has(u.id) || savedEmails.has(u.email?.toLowerCase());
      const existing = existingContacts.find(
        (c: any) => c.contactUserId === u.id || c.contactEmail?.toLowerCase() === u.email?.toLowerCase()
      );
      return {
        ...u,
        isSaved,
        contactId: existing?.id || null,
      };
    });

    return NextResponse.json({ users: results });
  } catch (error) {
    return handleApiError(error);
  }
}
