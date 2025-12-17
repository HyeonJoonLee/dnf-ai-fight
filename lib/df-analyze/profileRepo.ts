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
};

export async function findCharacterProfile(serverId: string, dnfCharacterId: string) {
  const { data, error } = await supabaseAdmin
    .from("character_profiles")
    .select("id, server_id, dnf_character_id, character_name, job_name, level, last_image_url, last_analysis")
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
      },
      { onConflict: "server_id,dnf_character_id" }
    )
    .select("id, server_id, dnf_character_id, character_name, job_name, level, last_image_url, last_analysis")
    .single();

  if (error) throw error;
  return data as CharacterProfileRow;
}
