import { createClient } from "@supabase/supabase-js";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

const supabaseUrl = __SUPABASE_URL__;
const supabaseAnonKey = __SUPABASE_ANON_KEY__;

// eslint-disable-next-line no-console
console.log("[supabase] url length:", supabaseUrl?.length, "starts with https:", supabaseUrl?.startsWith?.("https"));

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check SUPABASE_URL and SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
