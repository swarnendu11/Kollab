import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { contacts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const result = await db.select().from(contacts).where(eq(contacts.userId, user.id));

    return NextResponse.json({ contacts: result });
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
    const { contactName, contactEmail, phone = "" } = body;

    if (!contactName || !contactEmail) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const db = await getDb();
    const contactId = `cont_${Date.now()}`;

    const newContact = {
      id: contactId,
      userId: user.id,
      contactUserId: null,
      contactName,
      contactEmail,
      contactAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contactName)}`,
      phone,
      status: "active",
      createdAt: new Date(),
    };

    await db.insert(contacts).values(newContact);

    return NextResponse.json({ success: true, contact: newContact });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
