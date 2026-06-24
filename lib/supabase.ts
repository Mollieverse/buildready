import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton. Avoids crashing at module-load time when env vars are
// missing (e.g. during `next build` prerendering before the user has filled
// in .env.local). Components call this in effects/handlers, never at import.

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  cached = createClient(url, key);
  return cached;
}

// Proxy that defers client creation until the first method call. This lets
// `import { supabase } from "@/lib/supabase"` succeed at module-load time
// even with no env, while still throwing a useful error when actually used.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const c = getClient();
    const v = (c as any)[prop];
    return typeof v === "function" ? v.bind(c) : v;
  },
});
