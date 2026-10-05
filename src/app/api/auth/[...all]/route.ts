import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import * as authSchema from "@/db/auth-schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// We need to create the auth instance per-request since getDb is async
async function createAuth() {
  const db = await getDb();
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
  });
}

export async function GET(request: NextRequest) {
  const auth = await createAuth();
  return auth.handler(request);
}

export async function POST(request: NextRequest) {
  const auth = await createAuth();
  return auth.handler(request);
}