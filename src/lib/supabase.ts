import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn("[Supabase] NEXT_PUBLIC vars missing — auth will fail. Restart dev server.");
    }
    supabaseInstance = createClient(
      url || "https://placeholder.supabase.co",
      key || "placeholder"
    );
  }
  return supabaseInstance;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    supabaseAdminInstance = createClient(
      url || "https://placeholder.supabase.co",
      key || "placeholder"
    );
  }
  return supabaseAdminInstance;
}
