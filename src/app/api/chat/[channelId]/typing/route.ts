import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await requireAuth();
    const { channelId } = await params;
    const body = await req.json();
    const { isTyping = true } = body;

    realtimeHub.broadcast({
      id: `rt_${Date.now()}`,
      type: isTyping ? "typing.started" : "typing.stopped",
      organizationId: user.organizationId,
      channelId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      payload: {
        userId: user.id,
        userName: user.fullName,
        channelId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
