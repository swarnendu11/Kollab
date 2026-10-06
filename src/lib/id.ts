import crypto from "crypto";

/**
 * Generate cryptographically secure UUID-based identifier.
 * Safe for distributed environments and collision-resistant.
 */
export function createId(prefix?: string): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
