import { fetchDnfCharacter } from "@/lib/df-analyze/neople";
import { findCharacterProfile, saveCharacterProfile, type CharacterProfileRow } from "@/lib/df-analyze/profileRepo";
import { generateAnalysisWithAI } from "@/lib/df-analyze/gemini";

export type DfAnalyzeResponse = {
  character: {
    serverId: string;
    dnfCharacterId: string;
    name: string;
    level: number;
    jobName: string;
  };
  imageUrl: string;
  analysis: string;
  source: "db" | "ai";
};

// ✅ 내부 전용: profile row(id 포함)까지 보장
export async function ensureCharacterProfileForAnalyze(serverId: string, characterName: string): Promise<{
  profile: CharacterProfileRow;
  source: "db" | "ai";
}> {
  const dnf = await fetchDnfCharacter(serverId, characterName);

  const existing = await findCharacterProfile(dnf.serverId, dnf.dnfCharacterId);
  if (existing?.last_analysis) {
    return { profile: existing, source: "db" };
  }

  const analysis = await generateAnalysisWithAI(dnf.imageUrl);

  const saved = await saveCharacterProfile({
    serverId: dnf.serverId,
    dnfCharacterId: dnf.dnfCharacterId,
    name: dnf.name,
    level: dnf.level,
    jobName: dnf.jobName,
    imageUrl: dnf.imageUrl,
    analysis,
  });

  return { profile: saved, source: "ai" };
}

// ✅ 기존 public response 함수는 내부함수 결과를 매핑만 함
export async function getOrCreateDfAnalysis(serverId: string, characterName: string): Promise<DfAnalyzeResponse> {
  const { profile, source } = await ensureCharacterProfileForAnalyze(serverId, characterName);

  return {
    character: {
      serverId: profile.server_id,
      dnfCharacterId: profile.dnf_character_id,
      name: profile.character_name,
      level: profile.level ?? 0,
      jobName: profile.job_name ?? "",
    },
    imageUrl: profile.last_image_url ?? "",
    analysis: profile.last_analysis ?? "",
    source,
  };
}
