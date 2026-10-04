import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomName, participantName, isHost } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "secret_kollab_livekit_super_secret_passphrase_32_chars_long";
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://kollab-webrtc.livekit.cloud";

    const identity = user.id;
    const name = participantName || user.fullName;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      metadata: JSON.stringify({
        avatar: user.avatarUrl,
        isHost: Boolean(isHost),
        role: isHost ? "host" : "participant",
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: livekitUrl,
      identity,
      name,
    });
  } catch (error: any) {
    console.error("LiveKit token generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
