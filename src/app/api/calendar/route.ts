import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calendarEvents, meetings } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, asc, and } from "drizzle-orm";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const exportIcs = searchParams.get("export") === "ics";

    const db = await getDb();
    const events = await db
      .select({
        id: calendarEvents.id,
        userId: calendarEvents.userId,
        meetingId: calendarEvents.meetingId,
        title: calendarEvents.title,
        description: calendarEvents.description,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        timezone: calendarEvents.timezone,
        recurrence: calendarEvents.recurrence,
        reminders: calendarEvents.reminders,
        meetingJoinCode: meetings.joinCode,
      })
      .from(calendarEvents)
      .leftJoin(meetings, eq(calendarEvents.meetingId, meetings.id))
      .where(eq(calendarEvents.userId, user.id))
      .orderBy(asc(calendarEvents.startTime));

    if (exportIcs) {
      // Generate standard RFC 5545 iCalendar .ics format for Google / Outlook / Apple Calendar
      let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Kollab//Collaboration Platform//EN",
        "CALSCALE:GREGORIAN",
      ];

      for (const ev of events) {
        const startIso = new Date(ev.startTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const endIso = new Date(ev.endTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        icsContent.push(
          "BEGIN:VEVENT",
          `UID:${ev.id}@kollab.io`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
          `DTSTART:${startIso}`,
          `DTEND:${endIso}`,
          `SUMMARY:${ev.title}`,
          `DESCRIPTION:${ev.description || "Kollab Scheduled Meeting"}`,
          ev.meetingJoinCode ? `URL:http://localhost:3000/meeting/${ev.meetingJoinCode}` : "",
          "END:VEVENT"
        );
      }

      icsContent.push("END:VCALENDAR");

      return new NextResponse(icsContent.filter(Boolean).join("\r\n"), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="kollab-calendar.ics"',
        },
      });
    }

    return NextResponse.json({ events });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { title, description, startTime, endTime, timezone = "UTC", recurrence = null, meetingId = null } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Title, startTime, and endTime are required" }, { status: 400 });
    }

    const db = await getDb();
    const eventId = createId("cal");

    const newEvent = {
      id: eventId,
      userId: user.id,
      meetingId: meetingId || null,
      title: title.trim(),
      description: description || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      timezone: timezone || "UTC",
      recurrence: recurrence || null,
      reminders: ["15m", "1h"],
      createdAt: new Date(),
    };

    await db.insert(calendarEvents).values(newEvent);

    return NextResponse.json({ success: true, event: newEvent });
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
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const db = await getDb();
    await db
      .delete(calendarEvents)
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
