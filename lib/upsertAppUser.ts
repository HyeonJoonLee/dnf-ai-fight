//lib/upsertAppUser.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function upsertAppUser(params: {
    provider: string;
    providerUserId: string;
    nickname?: string | null;
    email?: string | null;
}) {
    console.log("[upsertAppUser] has service key:", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));
    console.log("[upsertAppUser] url:", process.env.SUPABASE_URL?.slice(0, 30));
    const { provider, providerUserId, nickname, email } = params;

    const { data, error } = await supabaseAdmin
        .from("app_users")
        .upsert(
            {
                provider,
                provider_user_id: providerUserId,
                nickname: nickname ?? null,
                email: email ?? null,
            },
            { onConflict: "provider,provider_user_id" }
        )
        .select("id, provider, provider_user_id")
        .single();

    if (error) throw error;
    return data; // { id, provider, provider_user_id }
}
