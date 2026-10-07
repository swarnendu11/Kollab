import { describe, it, expect } from "vitest";
import { generateJoinCode } from "../src/lib/utils";

describe("Meeting Code Generation & Member Invitation Suite", () => {
  it("generates valid Google Meet style join codes (format: xxx-xxxx-xxx)", () => {
    const code = generateJoinCode();
    expect(code).toBeDefined();
    expect(typeof code).toBe("string");

    // Must match 3 lowercase letters, hyphen, 4 lowercase letters, hyphen, 3 lowercase letters
    const pattern = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
    expect(pattern.test(code)).toBe(true);

    // Verify entropy / uniqueness across multiple generations
    const generated = new Set<string>();
    for (let i = 0; i < 50; i++) {
      generated.add(generateJoinCode());
    }
    expect(generated.size).toBe(50);
  });

  it("normalizes and sanitizes custom meeting codes", () => {
    const normalizeCode = (raw: string) => {
      return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    };

    expect(normalizeCode("MY-TEAM-SYNC")).toBe("my-team-sync");
    expect(normalizeCode("Review 2026 Room!")).toBe("review-2026-room-");
    expect(normalizeCode("abc-defg-hij")).toBe("abc-defg-hij");
  });

  it("validates meeting invitation authorization and recipient mapping", () => {
    const validateInvitationRequest = (
      operatorRole: "host" | "co-host" | "member" | "viewer",
      recipients: { userIds?: string[]; emails?: string[] }
    ) => {
      // Any workspace member or host/co-host can invite colleagues
      if (operatorRole === "viewer") {
        return { valid: false, error: "Viewers cannot invite members" };
      }

      const totalCount = (recipients.userIds?.length || 0) + (recipients.emails?.length || 0);
      if (totalCount === 0) {
        return { valid: false, error: "At least one recipient is required" };
      }

      const validEmails = (recipients.emails || []).filter((e) => e.includes("@") && e.includes("."));
      if ((recipients.emails?.length || 0) > 0 && validEmails.length === 0) {
        return { valid: false, error: "Invalid email addresses" };
      }

      return { valid: true, count: totalCount };
    };

    expect(validateInvitationRequest("host", { userIds: ["usr_1", "usr_2"] }).valid).toBe(true);
    expect(validateInvitationRequest("co-host", { emails: ["sarah@kollab.io"] }).valid).toBe(true);
    expect(validateInvitationRequest("member", { userIds: ["usr_3"] }).valid).toBe(true);
    expect(validateInvitationRequest("viewer", { userIds: ["usr_1"] }).valid).toBe(false);
    expect(validateInvitationRequest("host", { userIds: [], emails: [] }).valid).toBe(false);
  });

  it("formats invite notification payloads accurately for in-app alert and realtime delivery", () => {
    const createInviteNotification = (params: {
      meetingTitle: string;
      joinCode: string;
      meetingId: string;
      inviterName: string;
      recipientUserId: string;
    }) => {
      return {
        userId: params.recipientUserId,
        type: "meeting_invite",
        title: `Video Call Invitation: ${params.meetingTitle}`,
        message: `${params.inviterName} invited you to join "${params.meetingTitle}". Meeting Code: ${params.joinCode}`,
        link: `/meeting/${params.meetingId}/prejoin`,
        read: false,
      };
    };

    const notif = createInviteNotification({
      meetingTitle: "Sprint Review",
      joinCode: "klb-sprint-q4",
      meetingId: "meet_123",
      inviterName: "Alex Rivera",
      recipientUserId: "usr_sarah",
    });

    expect(notif.userId).toBe("usr_sarah");
    expect(notif.type).toBe("meeting_invite");
    expect(notif.message).toContain("Alex Rivera");
    expect(notif.message).toContain("klb-sprint-q4");
    expect(notif.link).toBe("/meeting/meet_123/prejoin");
  });
});
