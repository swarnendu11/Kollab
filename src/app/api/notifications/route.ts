import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { desc, eq, and } from "drizzle-orm";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json({ notifications: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { id, title, message, type = "system", link = null } = body;

    const db = await getDb();

    if (title && message) {
      // Create new notification
      const newNotif = {
        id: createId("notif"),
        userId: user.id,
        type,
        title,
        message,
        link,
        read: false,
        createdAt: new Date(),
      };
      await db.insert(notifications).values(newNotif);
      return NextResponse.json({ success: true, notification: newNotif });
    }

    // Mark as read
    if (id) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
    } else {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const db = await getDb();
    if (id) {
      await db
        .delete(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
    } else {
      // Clear all
      await db
        .delete(notifications)
        .where(eq(notifications.userId, user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
