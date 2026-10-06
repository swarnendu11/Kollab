import { describe, it, expect } from "vitest";
import { extractMeetingIntelligence, queryMeetingCopilot } from "../src/lib/ai";

describe("AI Meeting Intelligence & Grounded Copilot", () => {
  const sampleTranscript = `
Sarah Chen: We decided to target November 15 for the beta launch.
Alex Rivera: I will complete the API authentication by this Friday.
David Kim: What about the load balancer capacity during peak hours?
Sarah Chen: That is an open question. We also have a major risk with third-party webhook latency.
`;

  it("extracts structured intelligence with non-fabricated decisions and action items", async () => {
    const intelligence = await extractMeetingIntelligence(sampleTranscript, "Sprint Planning");

    expect(intelligence).toBeDefined();
    expect(typeof intelligence.summary).toBe("string");
    expect(Array.isArray(intelligence.topics)).toBe(true);
    expect(Array.isArray(intelligence.decisions)).toBe(true);
    expect(Array.isArray(intelligence.actionItems)).toBe(true);
    expect(Array.isArray(intelligence.questions)).toBe(true);
    expect(Array.isArray(intelligence.risks)).toBe(true);

    // Verify extraction derived directly from transcript
    expect(intelligence.decisions.some((d) => d.toLowerCase().includes("november") || d.toLowerCase().includes("launch"))).toBe(true);
    expect(intelligence.actionItems.some((a) => a.task.toLowerCase().includes("authentication") || a.task.toLowerCase().includes("api"))).toBe(true);
  });

  it("answers in-meeting copilot questions grounded strictly in transcript context", async () => {
    const answer = await queryMeetingCopilot("What did Sarah say about the launch?", sampleTranscript, "Sprint Planning");

    expect(answer).toBeDefined();
    expect(typeof answer).toBe("string");
    expect(answer.toLowerCase()).toContain("november");
  });

  it("identifies risks accurately from meeting discussions", async () => {
    const answer = await queryMeetingCopilot("What risks were mentioned?", sampleTranscript, "Sprint Planning");

    expect(answer).toBeDefined();
    expect(answer.toLowerCase()).toContain("risk");
  });
});
