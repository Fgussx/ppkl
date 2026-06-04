import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseSecretEnv } from "@/lib/env";

export function createAdminClient() {
  const { url, key } = requireSupabaseSecretEnv();

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
