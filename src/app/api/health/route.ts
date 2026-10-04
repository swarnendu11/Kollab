import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "KOLLAB",
    version: "1.0.0",
    theme: "emerald-mint-green",
    timestamp: new Date().toISOString(),
  });
}
