import fs from "fs";
import path from "path";
import crypto from "crypto";

const STORAGE_SECRET = process.env.STORAGE_SECRET || process.env.BETTER_AUTH_SECRET || "kollab_storage_secret_key_32_bytes";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "data", "storage");

// Ensure local storage directory exists
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

export interface StorageUploadResult {
  key: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
  downloadUrl: string;
}

/**
 * Validates file upload constraints.
 */
export function validateUpload(options: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  if (options.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File exceeds maximum size limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
  }

  // Prevent path traversal in filenames
  const sanitizedName = path.basename(options.filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!sanitizedName) {
    throw new Error("Invalid file name.");
  }

  return sanitizedName;
}

/**
 * Sign a file access URL with HMAC-SHA256 signature and expiration timestamp.
 */
export function createSignedDownloadUrl(key: string, organizationId: string, expiresInSeconds = 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${key}:${organizationId}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", STORAGE_SECRET).update(payload).digest("hex");
  return `/api/files/download?key=${encodeURIComponent(key)}&org=${encodeURIComponent(organizationId)}&exp=${expiresAt}&sig=${signature}`;
}

/**
 * Verify signed download URL parameters.
 */
export function verifySignedDownload(key: string, organizationId: string, exp: number, sig: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (now > exp) {
    return false; // Expired
  }

  const expectedPayload = `${key}:${organizationId}:${exp}`;
  const expectedSig = crypto.createHmac("sha256", STORAGE_SECRET).update(expectedPayload).digest("hex");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

/**
 * Save file buffer to persistent storage.
 */
export async function putObject(options: {
  key: string;
  buffer: Buffer;
  mimeType: string;
  organizationId: string;
}): Promise<StorageUploadResult> {
  const orgDir = path.join(LOCAL_STORAGE_DIR, options.organizationId);
  if (!fs.existsSync(orgDir)) {
    fs.mkdirSync(orgDir, { recursive: true });
  }

  const filePath = path.join(orgDir, options.key);
  fs.writeFileSync(filePath, options.buffer);

  const downloadUrl = createSignedDownloadUrl(options.key, options.organizationId);

  return {
    key: options.key,
    storagePath: filePath,
    sizeBytes: options.buffer.length,
    mimeType: options.mimeType,
    downloadUrl,
  };
}

/**
 * Read file buffer from persistent storage.
 */
export async function getObject(key: string, organizationId: string): Promise<{ buffer: Buffer; mimeType?: string } | null> {
  const filePath = path.join(LOCAL_STORAGE_DIR, organizationId, key);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  return { buffer };
}

/**
 * Delete file from persistent storage.
 */
export async function deleteObject(key: string, organizationId: string): Promise<boolean> {
  const filePath = path.join(LOCAL_STORAGE_DIR, organizationId, key);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
