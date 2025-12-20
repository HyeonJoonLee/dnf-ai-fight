import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type CharacterProfileRow = {
    id: string;
    server_id: string;
    dnf_character_id: string;
    character_name: string;
    job_name: string | null;
    dnf_level: number | null;
    last_image_url: string | null;
    last_analysis: string | null;

    dnf_battle_tags: string[] | null;
    dnf_battle_stats: any | null; // jsonb
    dnf_battle_stats_version: number | null;
    dnf_battle_stats_updated_at: string | null;
};

export async function findCharacterProfile(serverId: string, dnfCharacterId: string) {
    const { data, error } = await supabaseAdmin
        .from("character_profiles")
        .select("id, server_id, dnf_character_id, character_name, job_name, dnf_level, last_image_url, last_analysis, dnf_battle_tags, dnf_battle_stats, dnf_battle_stats_version, dnf_battle_stats_updated_at")
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
    dnflevel: number;
    jobName: string;
    imageUrl: string;
    analysis: string;

    dnfbattleTags: string[];
    dnfbattleStats: any | null;
    dnfbattleStatsVersion: number;
}) {
    const { data, error } = await supabaseAdmin
        .from("character_profiles")
        .upsert(
            {
                server_id: input.serverId,
                dnf_character_id: input.dnfCharacterId,
                character_name: input.name,
                job_name: input.jobName,
                level: input.dnflevel,
                last_image_url: input.imageUrl,
                last_analysis: input.analysis,

                battle_tags: input.dnfbattleTags,
                battle_stats: input.dnfbattleStats,
                battle_stats_version: input.dnfbattleStatsVersion,
                battle_stats_updated_at: new Date().toISOString(),
            },
            { onConflict: "server_id,dnf_character_id" }
        )
        .select("id, server_id, dnf_character_id, character_name, job_name, dnf_level, last_image_url, last_analysis, dnf_battle_tags, dnf_battle_stats, dnf_battle_stats_version, dnf_battle_stats_updated_at")
        .single();

    if (error) throw error;
    return data as CharacterProfileRow;
}
