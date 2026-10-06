import { describe, it, expect } from "vitest";
import { createId } from "../src/lib/id";

describe("Collision-resistant ID Generator", () => {
  it("generates UUIDv4-backed IDs with prefixes", () => {
    const id = createId("user");
    expect(id).toMatch(/^user_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("produces unique identifiers across consecutive invocations", () => {
    const id1 = createId("msg");
    const id2 = createId("msg");
    expect(id1).not.toBe(id2);
  });

  it("handles different prefixes cleanly", () => {
    const orgId = createId("org");
    const fileId = createId("file");
    expect(orgId.startsWith("org_")).toBe(true);
    expect(fileId.startsWith("file_")).toBe(true);
  });
});
