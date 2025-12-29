import { createClient } from '@supabase/supabase-js';

// Singleton pattern - create once, reuse everywhere (browser-side)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);