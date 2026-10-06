export interface MeetingIntelligence {
  summary: string;
  topics: string[];
  decisions: string[];
  actionItems: {
    task: string;
    ownerName?: string;
    ownerId?: string;
    dueDate?: string;
  }[];
  questions: string[];
  risks: string[];
  importantMoments: {
    timestamp: number;
    title: string;
    description: string;
  }[];
  recommendations: string[];
}

/**
 * Call Google Gemini or OpenAI API if configured in environment,
 * with resilient parsing of JSON markdown fences.
 */
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (geminiApiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (err) {
      console.warn("Gemini API call failed, trying fallback:", err);
    }
  }

  if (openaiApiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (err) {
      console.warn("OpenAI API call failed, trying fallback:", err);
    }
  }

  // Fallback: Deterministic natural language parser on real transcript content
  return extractWithNaturalLanguageRules(userPrompt);
}

/**
 * Natural language analysis on real transcript text when external LLM key is absent.
 * NEVER fabricates fake decisions if not found in transcript.
 */
function extractWithNaturalLanguageRules(transcript: string): string {
  const lines = transcript
    .split(/\n|\. /)
    .map((l) => l.trim())
    .filter(Boolean);

  const decisions: string[] = [];
  const actionItems: any[] = [];
  const questions: string[] = [];
  const risks: string[] = [];
  const topics: Set<string> = new Set();

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Decisions extraction
    if (
      lower.includes("agreed") ||
      lower.includes("decided") ||
      lower.includes("we will go with") ||
      lower.includes("approved") ||
      lower.includes("conclusion is")
    ) {
      decisions.push(line.replace(/^(agreed|decided) (that|to)?/i, "").trim());
    }

    // Action items extraction
    if (
      lower.includes("action item") ||
      lower.includes("need to") ||
      lower.includes("will follow up") ||
      lower.includes("take ownership") ||
      lower.includes("assigned to") ||
      lower.includes("i will") ||
      lower.includes("will complete") ||
      lower.includes("todo:")
    ) {
      actionItems.push({
        task: line,
        ownerName: "Unassigned",
        dueDate: "Next sync",
      });
    }

    // Unresolved questions extraction
    if (line.includes("?") || lower.startsWith("how") || lower.startsWith("what if") || lower.includes("unresolved")) {
      questions.push(line);
    }

    // Risks extraction
    if (lower.includes("risk") || lower.includes("blocker") || lower.includes("bottleneck") || lower.includes("concern")) {
      risks.push(line);
    }

    // Topic keywords
    if (lower.includes("architecture") || lower.includes("api") || lower.includes("backend")) topics.add("Architecture & API");
    if (lower.includes("ui") || lower.includes("design") || lower.includes("frontend")) topics.add("Design & User Experience");
    if (lower.includes("release") || lower.includes("deploy") || lower.includes("launch")) topics.add("Release & Deployment");
    if (lower.includes("security") || lower.includes("auth") || lower.includes("permission")) topics.add("Security & Authentication");
  }

  const result: MeetingIntelligence = {
    summary:
      lines.length > 0
        ? `The session covered discussion across ${lines.length} key points with focus on ${Array.from(topics).join(", ") || "meeting agenda"}. Key topics and deliverables were reviewed by attendees.`
        : "Session concluded without transcribed dialogue.",
    topics: Array.from(topics).length > 0 ? Array.from(topics) : ["General Discussion"],
    decisions,
    actionItems,
    questions,
    risks,
    importantMoments: [
      { timestamp: 0, title: "Meeting Started", description: "Participants joined session" },
      { timestamp: Math.floor(lines.length * 3), title: "Key Discussion", description: "Review of core agenda" },
    ],
    recommendations: [
      "Review captured action items and assign explicit completion dates.",
      "Share meeting notes with absent stakeholders.",
    ],
  };

  return JSON.stringify(result);
}

/**
 * Extract structured meeting intelligence from actual meeting transcript.
 */
export async function extractMeetingIntelligence(
  transcript: string,
  meetingTitle: string
): Promise<MeetingIntelligence> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Cannot generate summary: Transcript is empty. No spoken dialogue was captured.");
  }

  const systemPrompt = `You are Kollab AI Meeting Intelligence engine.
Extract structured meeting intelligence from the provided real meeting transcript.
Return ONLY valid JSON matching this schema:
{
  "summary": string,
  "topics": string[],
  "decisions": string[],
  "actionItems": [{ "task": string, "ownerName": string, "dueDate": string }],
  "questions": string[],
  "risks": string[],
  "importantMoments": [{ "timestamp": number, "title": string, "description": string }],
  "recommendations": string[]
}
CRITICAL RULES:
- Never fabricate decisions, tasks, or action items that were not discussed.
- If no decisions were made, return an empty decisions array [].
- If no action items were assigned, return [].`;

  const userPrompt = `Meeting Title: "${meetingTitle}"\n\nActual Transcript:\n${transcript}`;

  const responseText = await callLLM(systemPrompt, userPrompt);

  try {
    // Strip markdown code fences if present
    const cleaned = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || "Summary generated from meeting transcript.",
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      importantMoments: Array.isArray(parsed.importantMoments) ? parsed.importantMoments : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (err) {
    console.warn("Failed to parse LLM JSON output:", err, responseText);
    return JSON.parse(extractWithNaturalLanguageRules(transcript));
  }
}

/**
 * Answer in-meeting Copilot questions grounded in real meeting transcript.
 */
export async function queryMeetingCopilot(
  userQuery: string,
  transcript: string,
  meetingTitle: string
): Promise<string> {
  if (!transcript || transcript.trim().length === 0) {
    return "No audio transcript has been captured for this meeting yet. As participants speak, captions and transcript will populate here for me to analyze.";
  }

  const systemPrompt = `You are Kollab In-Meeting Copilot.
You assist participants DURING the active meeting: "${meetingTitle}".
Answer the user's question using ONLY the provided transcript of the current meeting.
Do not hallucinate facts. If the information is not in the transcript, explicitly state that it was not mentioned in the meeting so far.`;

  const userPrompt = `Meeting Transcript:\n${transcript}\n\nUser Question: "${userQuery}"`;

  return await callLLM(systemPrompt, userPrompt);
}
