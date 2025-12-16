import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
});

// console.log("SUPABASE_ADMIN_KEY_PREFIX", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10));
// console.log("SUPABASE_ANON_KEY_PREFIX", process.env.SUPABASE_ANON_KEY?.slice(0, 10));
// console.log("SUPABASE_URL_PREFIX", process.env.SUPABASE_URL?.slice(0, 10));