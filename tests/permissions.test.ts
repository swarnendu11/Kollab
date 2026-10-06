import { describe, it, expect } from "vitest";
import { hasPermission } from "../src/lib/permissions";

describe("Enterprise RBAC Permission Matrix", () => {
  it("grants owner all permissions", () => {
    expect(hasPermission("owner", "members:manage")).toBe(true);
    expect(hasPermission("owner", "billing:manage")).toBe(true);
    expect(hasPermission("owner", "audit:view")).toBe(true);
    expect(hasPermission("owner", "channels:delete")).toBe(true);
    expect(hasPermission("owner", "ai:access")).toBe(true);
  });

  it("grants admin member management but restricts billing", () => {
    expect(hasPermission("admin", "members:manage")).toBe(true);
    expect(hasPermission("admin", "members:invite")).toBe(true);
    expect(hasPermission("admin", "billing:manage")).toBe(false);
  });

  it("restricts guests from administrative and recording actions", () => {
    expect(hasPermission("guest", "channels:create")).toBe(false);
    expect(hasPermission("guest", "channels:delete")).toBe(false);
    expect(hasPermission("guest", "members:invite")).toBe(false);
    expect(hasPermission("guest", "members:manage")).toBe(false);
    expect(hasPermission("guest", "meetings:record")).toBe(false);
    expect(hasPermission("guest", "billing:manage")).toBe(false);
    expect(hasPermission("guest", "audit:view")).toBe(false);
    
    // Guests can participate in meetings and chat
    expect(hasPermission("guest", "meetings:join")).toBe(true);
    expect(hasPermission("guest", "messages:send")).toBe(true);
  });

  it("grants billing_admin billing permissions while restricting audit logs and recording", () => {
    expect(hasPermission("billing_admin", "billing:manage")).toBe(true);
    expect(hasPermission("billing_admin", "audit:view")).toBe(false);
    expect(hasPermission("billing_admin", "meetings:record")).toBe(false);
  });

  it("grants security_admin audit log inspection and security controls", () => {
    expect(hasPermission("security_admin", "audit:view")).toBe(true);
    expect(hasPermission("security_admin", "billing:manage")).toBe(false);
  });
});
