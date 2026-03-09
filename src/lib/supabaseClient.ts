import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// Anon/public key — safe to expose in the browser
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Client-side Supabase client (uses anon key, subject to RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
