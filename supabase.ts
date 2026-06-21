import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Single shared client. Uses the publishable/anon key, safe for browser use
// since RLS policies (currently open, see DEPLOY.md) govern actual access.
export const supabase = createClient(supabaseUrl, supabaseKey);
