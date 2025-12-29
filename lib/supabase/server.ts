import { createClient } from '@supabase/supabase-js';

// Singleton pattern - create once, reuse everywhere (server-side)
// Service role bypasses RLS - use only in server components/route handlers
export const supabaseServer = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);