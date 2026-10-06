import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { documents, users, documentVersions } from "@/db/schema";
import { requireAuth, requireResourceAccess, handleApiError } from "@/lib/auth";
import { desc, eq, and } from "drizzle-orm";
import { createId } from "@/lib/id";
import { logAuditEvent } from "@/lib/audit";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDb();

    const result = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        templateType: documents.templateType,
        authorId: documents.authorId,
        authorName: users.fullName,
        authorAvatar: users.avatarUrl,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .leftJoin(users, eq(documents.authorId, users.id))
      .where(eq(documents.organizationId, user.organizationId))
      .orderBy(desc(documents.updatedAt));

    return NextResponse.json({ documents: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    await requireResourceAccess({
      resourceType: "document",
      organizationId: user.organizationId,
      requiredPermission: "documents:create",
    });

    const body = await req.json();
    const { title, content, templateType = "general" } = body;

    const db = await getDb();
    const docId = createId("doc");

    let defaultContent = content || "";
    if (!defaultContent) {
      if (templateType === "meeting_notes") {
        defaultContent = `# Meeting Notes: ${title || "Untitled"}\n\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** ${user.fullName}\n\n## Objectives\n- \n\n## Discussion Points\n- \n\n## Action Items\n- [ ] `;
      } else if (templateType === "agenda") {
        defaultContent = `# Meeting Agenda: ${title || "Untitled"}\n\n**Time:** 45 minutes\n\n1. Welcome & Standup (10m)\n2. Project Architecture Walkthrough (20m)\n3. Open Floor Q&A (15m)`;
      } else if (templateType === "project_brief") {
        defaultContent = `# Project Brief: ${title || "Untitled"}\n\n## Executive Summary\n\n## Scope & Deliverables\n\n## Timeline & Milestones`;
      } else {
        defaultContent = `# ${title || "Untitled Document"}\n\nStart typing your collaborative notes here...`;
      }
    }

    const newDoc = {
      id: docId,
      organizationId: user.organizationId,
      authorId: user.id,
      title: title?.trim() || "Untitled Document",
      content: defaultContent,
      templateType,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(documents).values(newDoc);

    // Initial version entry
    await db.insert(documentVersions).values({
      id: createId("docv"),
      documentId: docId,
      versionNumber: 1,
      content: defaultContent,
      savedBy: user.id,
      createdAt: new Date(),
    });

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.fullName,
      action: "document.created",
      resourceType: "document",
      resourceId: docId,
      metadata: { title: newDoc.title, templateType },
    });

    return NextResponse.json({ success: true, document: newDoc });
  } catch (error) {
    return handleApiError(error);
  }
}
