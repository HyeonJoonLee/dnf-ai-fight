import { fetchDnfCharacter } from "@/lib/df-analyze/neople";
import { findCharacterProfile, saveCharacterProfile, type CharacterProfileRow } from "@/lib/df-analyze/profileRepo";
import { generateAnalysisWithAI } from "@/lib/df-analyze/gemini";
import { TAG_KEYS, type TagKey } from "@/src/lib/battle/tags";

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

const BATTLE_STATS_VERSION = 1;

type MixedStats = {
  hp: number;
  power: number; defense: number; speed: number;
  physical: number; magic: number; range: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const round10 = (n: number) => Math.round(n / 10) * 10;

function normalizeStats(input: unknown): MixedStats | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;

  const get01 = (k: keyof Omit<MixedStats,"hp">) => clamp(Number(o[k] ?? 0) || 0, 0, 100);

  // hp는 160~200, 10단위 고정
  const rawHp = Number(o.hp ?? 180) || 180;
  const hp = clamp(round10(rawHp), 160, 200);

  return {
    hp,
    power: get01("power"),
    defense: get01("defense"),
    range: get01("range"),
    speed: get01("speed"),
    physical: get01("physical"),
    magic: get01("magic"),
  };
}

function normalizeBattleTags(input: unknown): TagKey[] {
    if (!Array.isArray(input)) return [];

    const filtered = input.filter((t): t is TagKey =>
        typeof t === "string" && TAG_KEYS.includes(t as TagKey)
    );

    // 중복 제거
    const unique = Array.from(new Set(filtered));

    // 3개 초과 → 앞에서 3개만
    if (unique.length >= 3) return unique.slice(0, 3);

    // 부족하면 랜덤 보충 (안정성)
    const rest = TAG_KEYS.filter(t => !unique.includes(t));
    while (unique.length < 3 && rest.length) {
        unique.push(rest.shift()!);
    }

    return unique;
}

// ✅ 내부 전용: profile row(id 포함)까지 보장
export async function ensureCharacterProfileForAnalyze(serverId: string, characterName: string): Promise<{
    profile: CharacterProfileRow;
    source: "db" | "ai";
}> {
    const dnf = await fetchDnfCharacter(serverId, characterName);

    const existing = await findCharacterProfile(dnf.serverId, dnf.dnfCharacterId);

    const hasAnalysis = !!existing?.last_analysis;
    const hasStats = existing?.battle_stats != null;
    const hasTags = Array.isArray(existing?.battle_tags);

    if (hasAnalysis && hasStats && hasTags) return { profile: existing, source: "db" };

    const raw = await generateAnalysisWithAI(dnf.imageUrl);

    let analysis = "";
    let battleTags: TagKey[] = [];
    let battleStats: MixedStats | null = null;

    try {
        const parsed = JSON.parse(raw);
        analysis = parsed.analysis;
        battleTags = normalizeBattleTags(parsed.battleTags);
        const stats = normalizeStats(parsed.battleStats);
        battleStats = stats;
    } catch {
        analysis = raw; // 최후 fallback
    }

    const saved = await saveCharacterProfile({
        serverId: dnf.serverId,
        dnfCharacterId: dnf.dnfCharacterId,
        name: dnf.name,
        level: dnf.level,
        jobName: dnf.jobName,
        imageUrl: dnf.imageUrl,

        analysis,
        battleTags,
        battleStats,
        battleStatsVersion: BATTLE_STATS_VERSION,
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
