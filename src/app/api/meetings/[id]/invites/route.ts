import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, meetingInvites, users, notifications, meetingParticipants } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { eq, or, and, inArray } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const db = await getDb();

    // Find meeting
    const meetingQuery = await db
      .select()
      .from(meetings)
      .where(or(eq(meetings.id, id), eq(meetings.joinCode, id)))
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];

    // Fetch existing invites
    const invites = await db
      .select({
        id: meetingInvites.id,
        email: meetingInvites.email,
        status: meetingInvites.status,
        createdAt: meetingInvites.createdAt,
      })
      .from(meetingInvites)
      .where(eq(meetingInvites.meetingId, meeting.id));

    // Fetch current participants to show who is already in call
    const currentParticipants = await db
      .select({
        userId: meetingParticipants.userId,
        displayName: meetingParticipants.displayName,
      })
      .from(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meeting.id));

    return NextResponse.json({
      meetingId: meeting.id,
      joinCode: meeting.joinCode,
      invites,
      activeParticipantUserIds: currentParticipants
        .map((p: any) => p.userId)
        .filter(Boolean),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const db = await getDb();

    // Find meeting
    const meetingQuery = await db
      .select()
      .from(meetings)
      .where(or(eq(meetings.id, id), eq(meetings.joinCode, id)))
      .limit(1);

    if (meetingQuery.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingQuery[0];

    // Enforce workspace tenancy
    if (meeting.organizationId && meeting.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const userIds: string[] = Array.isArray(body.userIds)
      ? body.userIds
      : body.userId
      ? [body.userId]
      : [];
    const emails: string[] = Array.isArray(body.emails)
      ? body.emails
      : body.email
      ? [body.email]
      : [];

    if (userIds.length === 0 && emails.length === 0) {
      return NextResponse.json(
        { error: "At least one member userId or email must be provided" },
        { status: 400 }
      );
    }

    const invitedMembers: { name: string; email: string; userId?: string }[] = [];

    // 1. Process userIds by looking up workspace users
    if (userIds.length > 0) {
      const foundUsers = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      for (const u of foundUsers) {
        invitedMembers.push({
          name: u.fullName || u.email,
          email: u.email,
          userId: u.id,
        });
      }
    }

    // 2. Process external emails
    for (const rawEmail of emails) {
      const normalized = rawEmail.trim().toLowerCase();
      if (!normalized || !normalized.includes("@")) continue;
      if (!invitedMembers.some((m) => m.email === normalized)) {
        // Check if user exists for this email
        const userMatch = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.email, normalized))
          .limit(1);

        if (userMatch.length > 0) {
          invitedMembers.push({
            name: userMatch[0].fullName || normalized,
            email: normalized,
            userId: userMatch[0].id,
          });
        } else {
          invitedMembers.push({
            name: normalized,
            email: normalized,
          });
        }
      }
    }

    // 3. Insert invites and notifications
    for (const member of invitedMembers) {
      const inviteId = createId("inv");
      await db.insert(meetingInvites).values({
        id: inviteId,
        meetingId: meeting.id,
        email: member.email,
        status: "pending",
      });

      // If user has an account, send in-app notification
      if (member.userId) {
        const notifId = createId("ntf");
        await db.insert(notifications).values({
          id: notifId,
          userId: member.userId,
          type: "meeting_invite",
          title: `Video Call Invitation: ${meeting.title}`,
          message: `${user.fullName || "A colleague"} invited you to join "${meeting.title}". Meeting Code: ${meeting.joinCode}`,
          link: `/meeting/${meeting.id}/prejoin`,
          read: false,
        });

        // Broadcast notification to the specific user
        realtimeHub.broadcast({
          id: `rt_${Date.now()}_${member.userId}`,
          type: "notification.created",
          organizationId: user.organizationId,
          timestamp: new Date().toISOString(),
          payload: {
            userId: member.userId,
            title: `Incoming Call Invite: ${meeting.title}`,
            message: `${user.fullName} is inviting you to join now.`,
            link: `/meeting/${meeting.id}/prejoin`,
            joinCode: meeting.joinCode,
          },
        });
      }

      // Broadcast meeting invitation event
      realtimeHub.broadcast({
        id: `rt_${Date.now()}_${inviteId}`,
        type: "meeting.member_invited",
        organizationId: user.organizationId,
        timestamp: new Date().toISOString(),
        payload: {
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          joinCode: meeting.joinCode,
          invitedBy: user.fullName,
          invitee: member,
        },
      });
    }

    // 4. Log audit event
    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "meeting.members_invited",
      resourceType: "meeting",
      resourceId: meeting.id,
      metadata: {
        invitedCount: invitedMembers.length,
        invitedMembers: invitedMembers.map((m) => m.email),
      },
    });

    return NextResponse.json({
      success: true,
      invitedCount: invitedMembers.length,
      invitedMembers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
