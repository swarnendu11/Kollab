import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Returns a server-side Supabase client using either the service role key or anon key.
 */
export function getServerSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const keyToUse = supabaseServiceRole || supabaseAnonKey;
  return createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
