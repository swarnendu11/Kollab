import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { tasks, users, notifications } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { desc, eq, and } from "drizzle-orm";
import { createId } from "@/lib/id";
import { realtimeHub } from "@/lib/realtime";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const meetingId = searchParams.get("meetingId");

    const db = await getDb();

    let query = db
      .select({
        id: tasks.id,
        organizationId: tasks.organizationId,
        meetingId: tasks.meetingId,
        title: tasks.title,
        description: tasks.description,
        ownerId: tasks.ownerId,
        ownerName: tasks.ownerName,
        creatorId: tasks.creatorId,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        status: tasks.status,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(eq(tasks.organizationId, user.organizationId))
      .orderBy(desc(tasks.createdAt));

    const result = await query;
    let filtered = result;
    if (status) {
      filtered = filtered.filter((t: any) => t.status === status);
    }
    if (meetingId) {
      filtered = filtered.filter((t: any) => t.meetingId === meetingId);
    }

    return NextResponse.json({ tasks: filtered });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const {
      title,
      description = null,
      meetingId = null,
      ownerId = null,
      ownerName = null,
      dueDate = null,
      priority = "medium",
    } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const db = await getDb();
    const taskId = createId("task");

    // Assign owner name
    let assignedOwnerName = ownerName || user.fullName;
    let targetOwnerId = ownerId || user.id;

    if (ownerId && !ownerName) {
      const ownerQuery = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);
      if (ownerQuery[0]) {
        assignedOwnerName = ownerQuery[0].fullName;
      }
    }

    const newTask = {
      id: taskId,
      organizationId: user.organizationId,
      meetingId: meetingId || null,
      title: title.trim(),
      description: description || null,
      ownerId: targetOwnerId,
      ownerName: assignedOwnerName,
      creatorId: user.id,
      dueDate: dueDate || null,
      priority: priority || "medium",
      status: "todo",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(tasks).values(newTask);

    // Notify owner if different from creator
    if (targetOwnerId && targetOwnerId !== user.id) {
      await db.insert(notifications).values({
        id: createId("notif"),
        userId: targetOwnerId,
        type: "task_assigned",
        title: "New Task Assigned",
        message: `${user.fullName} assigned you task: "${newTask.title}"`,
        link: "/dashboard",
        read: false,
        createdAt: new Date(),
      });
    }

    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "task.created",
      organizationId: user.organizationId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: { task: newTask },
    });

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "task.created",
      resourceType: "task",
      resourceId: taskId,
      metadata: { title: newTask.title, ownerName: assignedOwnerName },
    });

    return NextResponse.json({ success: true, task: newTask });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { id, status, priority, title, description, dueDate, ownerId, ownerName } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, user.organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (ownerId !== undefined) updateData.ownerId = ownerId;
    if (ownerName !== undefined) updateData.ownerName = ownerName;

    await db.update(tasks).set(updateData).where(eq(tasks.id, id));

    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: "task.updated",
      organizationId: user.organizationId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: { taskId: id, updates: updateData },
    });

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "task.updated",
      resourceType: "task",
      resourceId: id,
      metadata: updateData,
    });

    return NextResponse.json({ success: true, updated: updateData });
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
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, user.organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.delete(tasks).where(eq(tasks.id, id));

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "task.deleted",
      resourceType: "task",
      resourceId: id,
      metadata: { title: existing[0].title },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
