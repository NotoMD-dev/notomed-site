// src/lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

// read from env
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in env");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in env"
  );
}

// narrow to plain strings for TS
const url: string = SUPABASE_URL;
const key: string = SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseServerClient() {
  return createClient(url, key, {
    auth: {
      // server env -> no cookie/session
      persistSession: false,
    },
  });
}
