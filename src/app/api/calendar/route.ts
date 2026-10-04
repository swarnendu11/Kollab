import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calendarEvents, meetings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      .orderBy(asc(calendarEvents.startTime));

    return NextResponse.json({ events });
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
    const { title, description, startTime, endTime, timezone = "UTC", meetingId = null } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Title, startTime and endTime required" }, { status: 400 });
    }

    const db = await getDb();
    const newEvent = {
      id: `cal_${Date.now()}`,
      userId: user.id,
      meetingId: meetingId || null,
      title: title.trim(),
      description: description || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      timezone,
      reminders: ["15m", "1h"],
      createdAt: new Date(),
    };

    await db.insert(calendarEvents).values(newEvent);

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
