import { NextRequest, NextResponse } from "next/server";
import { verifySignedDownload, getObject } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const org = searchParams.get("org");
    const expStr = searchParams.get("exp");
    const sig = searchParams.get("sig");

    if (!key || !org || !expStr || !sig) {
      return NextResponse.json({ error: "Missing required download parameters" }, { status: 400 });
    }

    const exp = parseInt(expStr, 10);
    if (isNaN(exp)) {
      return NextResponse.json({ error: "Invalid expiration" }, { status: 400 });
    }

    // Verify cryptographic signature
    const isValid = verifySignedDownload(key, org, exp, sig);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired download link" }, { status: 403 });
    }

    // Authenticate user & ensure membership in org
    const user = await getCurrentUser();
    if (!user || user.organizationId !== org) {
      return NextResponse.json({ error: "Access denied: Unauthorized organization" }, { status: 403 });
    }

    const obj = await getObject(key, org);
    if (!obj) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Log file download audit event
    await logAuditEvent({
      organizationId: org,
      actorId: user.id,
      actorName: user.fullName,
      action: "file.downloaded",
      resourceType: "file",
      resourceId: key,
    });

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${key}"`);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(new Uint8Array(obj.buffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to download file" }, { status: 500 });
  }
}
