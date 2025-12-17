import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureCharacterProfileForAnalyze } from "@/lib/df-analyze"; // 경로 맞춰줘

type Body = {
  serverId: string;
  characterName: string;

  // (구버전 호환용) 받아도 저장엔 안 씀
  dnfCharacterId?: string;
  jobName?: string | null;
  level?: number | null;
  imageUrl?: string | null;
  analysis?: string | null;
};

// ✅ 내 캐릭터 목록 가져오기 (user_characters + character_profiles)
export async function GET() {
  const session = await auth();
  const appUserId = (session as any)?.appUserId as string | undefined;

  if (!session || !appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_characters")
    .select(
      `
      id,
      profile_id,
      wins,
      is_main,
      slot_index,
      bg_key,
      created_at,
      updated_at,
      profile:character_profiles (
        id,
        server_id,
        dnf_character_id,
        character_name,
        job_name,
        level,
        last_image_url,
        last_analysis,

        battle_tags,
        battle_stats,
        battle_stats_version,
        battle_stats_updated_at
      )
    `
    )
    .eq("user_id", appUserId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message ?? "DB select failed" }, { status: 500 });
  }

  const characters = (data ?? []).map((row: any) => {
    const p = row.profile;
    return {
      id: row.id,                 // ucId
      profileId: row.profile_id,

      serverId: p?.server_id,
      dnfCharacterId: p?.dnf_character_id,
      characterName: p?.character_name,
      jobName: p?.job_name ?? undefined,
      level: p?.level ?? undefined,
      imageUrl: p?.last_image_url ?? undefined,
      analysis: p?.last_analysis ?? undefined,

      battleTags: p?.battle_tags ?? undefined,
      battleStats: p?.battle_stats ?? undefined,

      wins: row.wins ?? 0,
      isMain: row.is_main ?? false,
      slotIndex: row.slot_index ?? undefined,
      bgKey: row.bg_key ?? undefined,
    };
  });

  return NextResponse.json({ ok: true, characters });
}

export async function POST(req: Request) {
  const session = await auth();
  const appUserId = (session as any)?.appUserId as string | undefined;

  if (!session || !appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const serverId = body.serverId?.trim();
  const characterName = body.characterName?.trim();

  if (!serverId || !characterName) {
    return NextResponse.json({ error: "serverId, characterName is required" }, { status: 400 });
  }

  // ✅ 1) “단일 진입점” 파이프라인으로 profile 확정 (DB hit면 AI 절대 호출 X)
  const { profile } = await ensureCharacterProfileForAnalyze(serverId, characterName);

  // ✅ 2) user_characters upsert (유저-캐릭터 관계만 책임)
  const { data: uc, error: ucErr } = await supabaseAdmin
    .from("user_characters")
    .upsert(
      {
        user_id: appUserId,
        profile_id: profile.id,
        wins: 0,
      },
      { onConflict: "user_id,profile_id" }
    )
    .select("id, profile_id, wins, is_main, slot_index, bg_key, created_at, updated_at")
    .single();

  if (ucErr || !uc) {
    return NextResponse.json({ error: ucErr?.message ?? "User character upsert failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    character: {
      id: uc.id, // ucId
      profileId: uc.profile_id,

      serverId: profile.server_id,
      dnfCharacterId: profile.dnf_character_id,
      characterName: profile.character_name,
      jobName: profile.job_name ?? undefined,
      level: profile.level ?? undefined,
      imageUrl: profile.last_image_url ?? undefined,
      analysis: profile.last_analysis ?? undefined,

      wins: uc.wins ?? 0,
      isMain: uc.is_main ?? false,
      slotIndex: uc.slot_index ?? undefined,
      bgKey: uc.bg_key ?? undefined,
    },
  });
}
