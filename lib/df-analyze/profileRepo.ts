import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type CharacterProfileRow = {
    id: string;
    server_id: string;
    dnf_character_id: string;
    character_name: string;
    job_name: string | null;
    level: number | null;
    last_image_url: string | null;
    last_analysis: string | null;

    battle_tags: string[] | null;
    battle_stats: any | null; // jsonb
    battle_stats_version: number | null;
    battle_stats_updated_at: string | null;
};

export async function findCharacterProfile(serverId: string, dnfCharacterId: string) {
    const { data, error } = await supabaseAdmin
        .from("character_profiles")
        .select("id, server_id, dnf_character_id, character_name, job_name, level, last_image_url, last_analysis, battle_tags, battle_stats, battle_stats_version, battle_stats_updated_at")
        .eq("server_id", serverId)
        .eq("dnf_character_id", dnfCharacterId)
        .maybeSingle();

    if (error) throw error;
    return data as CharacterProfileRow | null;
}

export async function saveCharacterProfile(input: {
    serverId: string;
    dnfCharacterId: string;
    name: string;
    level: number;
    jobName: string;
    imageUrl: string;
    analysis: string;

    battleTags: string[];
    battleStats: any | null;
    battleStatsVersion: number;
}) {
    const { data, error } = await supabaseAdmin
        .from("character_profiles")
        .upsert(
            {
                server_id: input.serverId,
                dnf_character_id: input.dnfCharacterId,
                character_name: input.name,
                job_name: input.jobName,
                level: input.level,
                last_image_url: input.imageUrl,
                last_analysis: input.analysis,

                battle_tags: input.battleTags,
                battle_stats: input.battleStats,
                battle_stats_version: input.battleStatsVersion,
                battle_stats_updated_at: new Date().toISOString(),
            },
            { onConflict: "server_id,dnf_character_id" }
        )
        .select("id, server_id, dnf_character_id, character_name, job_name, level, last_image_url, last_analysis, battle_tags, battle_stats, battle_stats_version, battle_stats_updated_at")
        .single();

    if (error) throw error;
    return data as CharacterProfileRow;
}
