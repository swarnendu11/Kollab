import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub, RealtimeMessage } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const targetChannelId = searchParams.get("channelId");
  const orgId = user.organizationId;

  // Register user presence
  realtimeHub.updatePresence(user.id, user.fullName, orgId, "online");

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connected event
  const initialData = `data: ${JSON.stringify({
    type: "connected",
    userId: user.id,
    organizationId: orgId,
    timestamp: new Date().toISOString(),
  })}\n\n`;
  writer.write(encoder.encode(initialData));

  // Subscribe to realtime hub
  const unsubscribe = realtimeHub.subscribe((message: RealtimeMessage) => {
    // Check organization boundary
    if (message.organizationId !== orgId) {
      return;
    }

    // Check channel boundary if specified
    if (targetChannelId && message.channelId && message.channelId !== targetChannelId) {
      return;
    }

    const payload = `data: ${JSON.stringify(message)}\n\n`;
    try {
      writer.write(encoder.encode(payload));
    } catch {
      // Writer closed
    }
  });

  // Keep-alive heartbeat interval every 15 seconds
  const heartbeatInterval = setInterval(() => {
    try {
      writer.write(encoder.encode(": ping\n\n"));
      realtimeHub.updatePresence(user.id, user.fullName, orgId, "online");
    } catch {
      clearInterval(heartbeatInterval);
      unsubscribe();
    }
  }, 15000);

  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeatInterval);
    unsubscribe();
    try {
      writer.close();
    } catch {}
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
