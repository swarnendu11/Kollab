import { describe, it, expect } from "vitest";
import { putObject, getObject, deleteObject, createSignedDownloadUrl, verifySignedDownload } from "../src/lib/storage";

describe("Secure Object Storage Abstraction", () => {
  const testOrg = "org_test_suite";
  const testKey = "documents-test-report.pdf";

  it("writes and reads object data securely", async () => {
    const data = Buffer.from("Hello Kollab Secure Storage");
    const result = await putObject({
      key: testKey,
      buffer: data,
      mimeType: "application/pdf",
      organizationId: testOrg,
    });

    expect(result.key).toBe(testKey);
    expect(result.sizeBytes).toBe(data.length);
    expect(result.downloadUrl).toBeDefined();

    const read = await getObject(testKey, testOrg);
    expect(read).not.toBeNull();
    expect(read?.buffer.toString("utf-8")).toBe("Hello Kollab Secure Storage");
  });

  it("generates and verifies HMAC-SHA256 signed download tokens", () => {
    const signedUrl = createSignedDownloadUrl(testKey, testOrg, 60);
    expect(signedUrl).toContain("/api/files/download?");
    expect(signedUrl).toContain("sig=");
    expect(signedUrl).toContain("exp=");

    // Verify token validation
    const urlObj = new URL(signedUrl, "http://localhost:3000");
    const key = urlObj.searchParams.get("key")!;
    const org = urlObj.searchParams.get("org")!;
    const exp = parseInt(urlObj.searchParams.get("exp")!, 10);
    const sig = urlObj.searchParams.get("sig")!;

    expect(verifySignedDownload(key, org, exp, sig)).toBe(true);

    // Tampered signature must fail
    expect(verifySignedDownload(key, org, exp, sig + "tampered")).toBe(false);
  });

  it("deletes objects cleanly", async () => {
    await deleteObject(testKey, testOrg);
    const readAfterDelete = await getObject(testKey, testOrg);
    expect(readAfterDelete).toBeNull();
  });
});
