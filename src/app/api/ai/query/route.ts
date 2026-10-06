import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { meetings, tasks, chatMessages, documents, transcripts } from "@/db/schema";
import { requireAuth, handleApiError } from "@/lib/auth";
import { desc, eq, and } from "drizzle-orm";
import { queryMeetingCopilot } from "@/lib/ai";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const {
      prompt,
      mode = "query",
      tone = "professional",
      meetingId = null,
      capturedTranscript = null,
    } = body;

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const db = await getDb();
    const lowerPrompt = prompt.toLowerCase();

    // 1. In-Meeting AI Copilot Mode
    if (mode === "meeting_copilot" || meetingId) {
      let transcriptText = capturedTranscript;
      let meetingTitle = "Active Meeting";

      if (meetingId) {
        const meetingQuery = await db
          .select()
          .from(meetings)
          .where(and(eq(meetings.id, meetingId), eq(meetings.organizationId, user.organizationId)))
          .limit(1);

        if (meetingQuery[0]) {
          meetingTitle = meetingQuery[0].title;
        }

        if (!transcriptText) {
          const dbTranscript = await db
            .select()
            .from(transcripts)
            .where(eq(transcripts.meetingId, meetingId))
            .limit(1);
          if (dbTranscript[0]) {
            transcriptText = dbTranscript[0].fullText;
          }
        }
      }

      // Check if user asked to create tasks from meeting
      if (lowerPrompt.includes("create task") || lowerPrompt.includes("add task")) {
        const taskTitle = prompt.replace(/create task(s)?:?/i, "").trim() || "Follow up on meeting decisions";
        const newTaskId = createId("task");
        await db.insert(tasks).values({
          id: newTaskId,
          organizationId: user.organizationId,
          meetingId: meetingId || null,
          title: taskTitle,
          description: `Created by AI Copilot during "${meetingTitle}"`,
          ownerId: user.id,
          ownerName: user.fullName,
          creatorId: user.id,
          dueDate: "In 3 days",
          priority: "high",
          status: "todo",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return NextResponse.json({
          response: `✅ Created task: **"${taskTitle}"** assigned to ${user.fullName}. You can track it in your Tasks & Action Items dashboard.`,
        });
      }

      const copilotResponse = await queryMeetingCopilot(prompt, transcriptText || "", meetingTitle);
      return NextResponse.json({ response: copilotResponse });
    }

    // 2. Draft Message Mode
    if (mode === "draft") {
      let drafted = "";
      if (tone === "friendly") {
        drafted = `Hey team! 👋 Just wanted to check in regarding "${prompt}". Let's sync up whenever you have a moment. Cheers!`;
      } else if (tone === "concise") {
        drafted = `Update on ${prompt}: deliverables verified and on track. Ready for review.`;
      } else if (tone === "detailed") {
        drafted = `Hi everyone,\n\nHere is a comprehensive summary regarding "${prompt}":\n1. Current Status: Key milestones reviewed.\n2. Key Dependencies: Tested and validated.\n3. Next Actions: Scheduled review with team.\n\nPlease share your feedback.`;
      } else {
        drafted = `Hi team,\n\nRegarding "${prompt}", all objectives are progressing as planned. Please let me know if any blockers arise.\n\nBest regards,\n${user.fullName}`;
      }
      return NextResponse.json({ response: drafted });
    }

    // 3. Workspace Intelligence Query Mode (Scoped to user's organization)
    if (lowerPrompt.includes("meeting") && (lowerPrompt.includes("today") || lowerPrompt.includes("upcoming") || lowerPrompt.includes("have"))) {
      const userMeetings = await db
        .select()
        .from(meetings)
        .where(and(eq(meetings.organizationId, user.organizationId), eq(meetings.status, "scheduled")))
        .limit(5);

      if (userMeetings.length === 0) {
        return NextResponse.json({
          response: "You have no upcoming scheduled meetings in this workspace today.",
        });
      }

      const list = userMeetings
        .map((m: any, i: number) => `${i + 1}. **${m.title}** (Code: \`${m.joinCode}\`)`)
        .join("\n");

      return NextResponse.json({
        response: `Here are your scheduled meetings for today:\n\n${list}`,
      });
    }

    if (lowerPrompt.includes("task") || lowerPrompt.includes("action item")) {
      const orgTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.organizationId, user.organizationId))
        .limit(6);

      if (orgTasks.length === 0) {
        return NextResponse.json({
          response: "There are currently no open tasks or action items in your workspace.",
        });
      }

      const list = orgTasks
        .map(
          (t: any, i: number) =>
            `${i + 1}. **${t.title}** — Owner: *${t.ownerName}* (Priority: ${t.priority.toUpperCase()}) [Status: ${t.status.toUpperCase()}]`
        )
        .join("\n");

      return NextResponse.json({
        response: `Here are the active action items and tasks in your workspace:\n\n${list}`,
      });
    }

    // Default contextual assistance
    return NextResponse.json({
      response: `I'm your Kollab Workspace Assistant. I can help you summarize meetings, track action items, draft messages, or answer questions about your organization's projects. Try asking: "What are my open tasks?" or "Summarize our latest sync".`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
