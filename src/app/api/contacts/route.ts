import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { contacts } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();
    const result = await db.select().from(contacts).where(eq(contacts.userId, user.id));

    return NextResponse.json({ contacts: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { contactName, contactEmail, contactUserId = null, phone = "" } = body;

    if (!contactName || !contactEmail) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const db = await getDb();
    const normalizedEmail = contactEmail.trim().toLowerCase();

    // Check if already in user's contacts
    const existing = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, user.id),
          eq(contacts.contactEmail, normalizedEmail)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ success: true, contact: existing[0], alreadyExists: true });
    }

    // Look up if this contact corresponds to a registered user in Kollab
    let matchedUserId = contactUserId;
    let matchedAvatar = null;

    if (!matchedUserId) {
      const { users } = await import("@/db/schema");
      const matched = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (matched.length > 0) {
        matchedUserId = matched[0].id;
        matchedAvatar = matched[0].avatarUrl;
      }
    } else {
      const { users } = await import("@/db/schema");
      const matched = await db
        .select()
        .from(users)
        .where(eq(users.id, matchedUserId))
        .limit(1);

      if (matched.length > 0) {
        matchedAvatar = matched[0].avatarUrl;
      }
    }

    const contactId = createId("cont");
    const avatar =
      matchedAvatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contactName.trim())}`;

    const newContact = {
      id: contactId,
      userId: user.id,
      contactUserId: matchedUserId,
      contactName: contactName.trim(),
      contactEmail: normalizedEmail,
      contactAvatar: avatar,
      phone: phone || "",
      status: "active",
      createdAt: new Date(),
    };

    await db.insert(contacts).values(newContact);

    return NextResponse.json({ success: true, contact: newContact });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    const db = await getDb();
    await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
