import { createClient } from "@supabase/supabase-js";

// Supabase is disabled by default - users can enable it by:
// 1. Creating a Supabase project at https://supabase.com
// 2. Adding their credentials to .env file
//
// To enable, create a .env file with:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('VITE_SUPABASE_URL') || "https://ikjxpmhyrgddmbhzruhn.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || "sb_publishable_UEPK5kHZmk30TzEETe2TmA_BV2Ezkcz";

// Only create client if credentials are provided
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = () => supabase !== null;
