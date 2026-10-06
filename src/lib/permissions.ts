export type OrganizationRole =
  | "owner"
  | "admin"
  | "member"
  | "guest"
  | "billing_admin"
  | "security_admin";

export type Permission =
  | "meetings:create"
  | "meetings:record"
  | "meetings:join"
  | "meetings:delete"
  | "recordings:access"
  | "recordings:download"
  | "recordings:delete"
  | "channels:create"
  | "channels:delete"
  | "messages:send"
  | "members:invite"
  | "members:manage"
  | "roles:manage"
  | "documents:create"
  | "documents:edit"
  | "documents:delete"
  | "documents:share_external"
  | "whiteboards:create"
  | "whiteboards:edit"
  | "whiteboards:delete"
  | "ai:access"
  | "billing:manage"
  | "billing:view"
  | "audit:view"
  | "files:upload"
  | "files:download"
  | "files:delete"
  | "tasks:create"
  | "tasks:manage";

const ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  owner: [
    "meetings:create",
    "meetings:record",
    "meetings:join",
    "meetings:delete",
    "recordings:access",
    "recordings:download",
    "recordings:delete",
    "channels:create",
    "channels:delete",
    "messages:send",
    "members:invite",
    "members:manage",
    "roles:manage",
    "documents:create",
    "documents:edit",
    "documents:delete",
    "documents:share_external",
    "whiteboards:create",
    "whiteboards:edit",
    "whiteboards:delete",
    "ai:access",
    "billing:manage",
    "billing:view",
    "audit:view",
    "files:upload",
    "files:download",
    "files:delete",
    "tasks:create",
    "tasks:manage",
  ],
  admin: [
    "meetings:create",
    "meetings:record",
    "meetings:join",
    "meetings:delete",
    "recordings:access",
    "recordings:download",
    "recordings:delete",
    "channels:create",
    "channels:delete",
    "messages:send",
    "members:invite",
    "members:manage",
    "roles:manage",
    "documents:create",
    "documents:edit",
    "documents:delete",
    "documents:share_external",
    "whiteboards:create",
    "whiteboards:edit",
    "whiteboards:delete",
    "ai:access",
    "billing:view",
    "audit:view",
    "files:upload",
    "files:download",
    "files:delete",
    "tasks:create",
    "tasks:manage",
  ],
  security_admin: [
    "meetings:join",
    "recordings:access",
    "audit:view",
    "members:manage",
    "roles:manage",
    "files:download",
  ],
  billing_admin: [
    "billing:manage",
    "billing:view",
    "members:invite",
  ],
  member: [
    "meetings:create",
    "meetings:record",
    "meetings:join",
    "recordings:access",
    "recordings:download",
    "channels:create",
    "messages:send",
    "members:invite",
    "documents:create",
    "documents:edit",
    "whiteboards:create",
    "whiteboards:edit",
    "ai:access",
    "files:upload",
    "files:download",
    "tasks:create",
    "tasks:manage",
  ],
  guest: [
    "meetings:join",
    "messages:send",
    "documents:edit",
    "whiteboards:edit",
    "files:download",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = (role?.toLowerCase() || "member") as OrganizationRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}
