import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { documents, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      .orderBy(desc(documents.updatedAt));

    return NextResponse.json({ documents: result });
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
    const { title, content, templateType = "general" } = body;

    const db = await getDb();
    const docId = `doc_${Date.now()}`;

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
      organizationId: "org_kollab",
      authorId: user.id,
      title: title || "Untitled Document",
      content: defaultContent,
      templateType,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(documents).values(newDoc);

    return NextResponse.json({ success: true, document: newDoc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
