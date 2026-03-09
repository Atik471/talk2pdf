import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Server-only admin client — bypasses Row Level Security.
// NEVER import this in client components.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
