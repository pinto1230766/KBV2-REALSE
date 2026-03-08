import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ikjxpmhyrgddmbhzruhn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UEPK5kHZmk30TzEETe2TmA_BV2Ezkcz";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
