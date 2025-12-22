// app/api/my/characters/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureCharacterProfileForAnalyze } from "@/lib/df-analyze";

type Body = {
  serverId: string;
  characterName: string;
};

const MAX_SLOTS = 10;

// 네 스키마 enum과 동일
const STAT_KEYS = ["HP", "POWER", "DEFENSE", "SPEED", "PHYSICAL", "MAGIC", "RANGE"] as const;

function normalizeName(s: string) {
  return s.trim();
}

function pickFirstEmptySlot(used: number[], maxSlots = MAX_SLOTS) {
  const set = new Set(used.filter((n) => Number.isFinite(n)));
  for (let i = 1; i <= maxSlots; i++) {
    if (!set.has(i)) return i;
  }
  return null;
}

// ✅ 내 캐릭터 목록 (uc + profile + (optional) allocations/equipment)
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
      user_id,
      profile_id,

      wins,
      is_main,
      slot_index,
      bg_key,

      level,
      level_xp,
      stat_points,

      fatigue,
      fatigue_cap_base,
      fatigue_updated_at,
      locked_until,

      arena_bucket,
      arena_rating,
      arena_wins,
      arena_losses,
      arena_streak_current,
      arena_streak_best,

      created_at,
      updated_at,

      profile:character_profiles (
        id,
        server_id,
        dnf_character_id,
        character_name,
        job_name,
        dnf_level,
        last_image_url,
        last_ai_image_url,
        last_analysis,

        dnf_battle_tags,
        dnf_battle_stats,
        dnf_battle_stats_version,
        dnf_battle_stats_updated_at
      ),

      allocations:user_stat_allocations (
        stat,
        points,
        updated_at
      ),

      equipment:user_equipment (
        slot,
        user_inventory_id,
        updated_at,
        inv:user_inventory (
          id,
          qty,
          item_id,
          item:items (
            id,
            key,
            name,
            type,
            stackable,
            meta_json
          )
        )
      )
    `
    )
    .eq("user_id", appUserId)
    .order("slot_index", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "DB select failed" },
      { status: 500 }
    );
  }

  const characters = (data ?? []).map((row: any) => {
    const p = row.profile;

    // allocations를 {HP:0,...} 형태로 정리
    const allocMap: Record<string, number> = {};
    for (const k of STAT_KEYS) allocMap[k] = 0;
    for (const a of row.allocations ?? []) {
      if (a?.stat) allocMap[a.stat] = a.points ?? 0;
    }

    // equipment를 슬롯별로 정리
    const equip = (row.equipment ?? []).map((e: any) => ({
      slot: e.slot,
      userInventoryId: e.user_inventory_id,
      updatedAt: e.updated_at,
      inv: e.inv
        ? {
          id: e.inv.id,
          qty: e.inv.qty,
          itemId: e.inv.item_id,
          item: e.inv.item
            ? {
              id: e.inv.item.id,
              key: e.inv.item.key,
              name: e.inv.item.name,
              type: e.inv.item.type,
              stackable: e.inv.item.stackable,
              meta: e.inv.item.meta_json,
            }
            : null,
        }
        : null,
    }));

    return {
      id: row.id, // ucId
      profileId: row.profile_id,

      serverId: p?.server_id,
      dnfCharacterId: p?.dnf_character_id,
      characterName: p?.character_name,
      jobName: p?.job_name ?? undefined,

      // ✅ 던파 원본 레벨
      dnfLevel: p?.dnf_level ?? undefined,

      // ✅ 유저 성장 레벨
      level: row.level ?? 1,
      levelXp: row.level_xp ?? 0,
      statPoints: row.stat_points ?? 0,

      imageUrl: p?.last_image_url ?? undefined,
      aiImageUrl: p?.last_ai_image_url ?? undefined,
      analysis: p?.last_analysis ?? undefined,

      // ✅ 프론트가 보는 키로 내려주기
      battleTags: row.user_battle_tags ?? p?.dnf_battle_tags ?? [],
      battleStats: row.user_battle_stats ?? p?.dnf_battle_stats ?? null,

      // (원하면 원본/유저용도 같이 내려도 됨)
      userBattleTags: row.user_battle_tags ?? [],
      userBattleStats: row.user_battle_stats ?? null,
      dnfBattleTags: p?.dnf_battle_tags ?? [],
      dnfBattleStats: p?.dnf_battle_stats ?? null,

      wins: row.wins ?? 0,
      isMain: row.is_main ?? false,
      slotIndex: row.slot_index,
      bgKey: row.bg_key ?? undefined,

      fatigue: row.fatigue,
      fatigueCapBase: row.fatigue_cap_base,
      fatigueUpdatedAt: row.fatigue_updated_at ?? null,
      lockedUntil: row.locked_until,

      arenaBucket: row.arena_bucket ?? 1,
      arenaRating: row.arena_rating ?? 1200,
      arenaWins: row.arena_wins ?? 0,
      arenaLosses: row.arena_losses ?? 0,
      arenaStreakCurrent: row.arena_streak_current ?? 0,
      arenaStreakBest: row.arena_streak_best ?? 0,

      allocations: allocMap,
      equipment: equip,
    };
  });

  return NextResponse.json({ ok: true, characters });
}

// ✅ 등록: profile 확보 -> slot 배정 -> uc 생성 -> allocations 7개 생성
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
  const characterName = normalizeName(body.characterName ?? "");

  if (!serverId || !characterName) {
    return NextResponse.json(
      { error: "serverId, characterName is required" },
      { status: 400 }
    );
  }

  // 1) profile 확정
  const { profile } = await ensureCharacterProfileForAnalyze(serverId, characterName);

  // 2) 이미 등록된 캐릭터인지 먼저 체크 (user_id + profile_id unique)
  {
    const { data: existing, error: existErr } = await supabaseAdmin
      .from("user_characters")
      .select("id, slot_index")
      .eq("user_id", appUserId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (existErr) {
      return NextResponse.json({ error: existErr.message }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 캐릭터입니다.", characterId: existing.id },
        { status: 409 }
      );
    }
  }

  // 3) slot_index 배정 (1..10 중 빈칸)
  const { data: usedRows, error: usedErr } = await supabaseAdmin
    .from("user_characters")
    .select("slot_index")
    .eq("user_id", appUserId);

  if (usedErr) {
    return NextResponse.json({ error: usedErr.message }, { status: 500 });
  }

  const used = (usedRows ?? [])
    .map((r: any) => r.slot_index)
    .filter((n: any) => typeof n === "number");

  const slotIndex = pickFirstEmptySlot(used, MAX_SLOTS);
  if (!slotIndex) {
    return NextResponse.json(
      { error: `슬롯이 가득 찼습니다. (최대 ${MAX_SLOTS}개)` },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  // 4) user_characters 생성 (default들이 자동 세팅됨)
  const { data: uc, error: ucErr } = await supabaseAdmin
    .from("user_characters")
    .insert({
      user_id: appUserId,
      profile_id: profile.id,
      slot_index: slotIndex,
      // wins/is_main/bg_key 등은 필요하면 여기서 세팅 가능
      // wins: 0,
      // is_main: false,
      // ✅ 등록 시점에 원본을 복사
      user_battle_tags: profile.dnf_battle_tags ?? [],
      user_battle_stats: profile.dnf_battle_stats ?? null,
      user_battle_stats_version: 1,
      user_battle_stats_updated_at: now,
    })
    .select(
      "id, profile_id, wins, is_main, slot_index, bg_key, level, level_xp, stat_points, fatigue, fatigue_cap_base, arena_bucket, arena_rating, created_at, updated_at"
    )
    .single();

  // ⚠️ 동시 등록 레이스로 slot_index unique 충돌 가능 -> 여기서 에러 나면 프론트는 재시도하면 됨
  if (ucErr || !uc) {
    return NextResponse.json(
      { error: ucErr?.message ?? "User character insert failed" },
      { status: 500 }
    );
  }

  // 5) allocations 7개 생성 (이미 존재하면 무시)
  // supabase upsert는 onConflict 지정 가능
  const allocRows = STAT_KEYS.map((stat) => ({
    user_character_id: uc.id,
    stat,
    points: 0,
  }));

  const { error: allocErr } = await supabaseAdmin
    .from("user_stat_allocations")
    .upsert(allocRows, { onConflict: "user_character_id,stat" });

  if (allocErr) {
    // 등록은 성공했지만 allocations 생성 실패 -> 재시도 가능하니 500보단 알림만 주고 진행 가능
    // 여기서는 일단 성공으로 주되 warning 포함
    return NextResponse.json({
      ok: true,
      warning: "allocations 생성에 실패했습니다. 다시 시도하면 자동으로 채워집니다.",
      character: {
        id: uc.id,
        profileId: uc.profile_id,

        serverId: profile.server_id,
        dnfCharacterId: profile.dnf_character_id,
        characterName: profile.character_name,
        jobName: profile.job_name ?? undefined,
        dnfLevel: profile.dnf_level ?? undefined,

        level: uc.level ?? 1,
        levelXp: uc.level_xp ?? 0,
        statPoints: uc.stat_points ?? 0,

        imageUrl: profile.last_image_url ?? undefined,
        analysis: profile.last_analysis ?? undefined,

        wins: uc.wins ?? 0,
        isMain: uc.is_main ?? false,
        slotIndex: uc.slot_index,
        bgKey: uc.bg_key ?? undefined,

        fatigue: uc.fatigue ?? 30,
        fatigueCapBase: uc.fatigue_cap_base ?? 30,

        arenaBucket: uc.arena_bucket ?? 1,
        arenaRating: uc.arena_rating ?? 1200,
      },
    });
  }

  // 6) 응답
  return NextResponse.json({
    ok: true,
    character: {
      id: uc.id,
      profileId: uc.profile_id,

      serverId: profile.server_id,
      dnfCharacterId: profile.dnf_character_id,
      characterName: profile.character_name,
      jobName: profile.job_name ?? undefined,
      dnfLevel: profile.dnf_level ?? undefined,

      level: uc.level ?? 1,
      levelXp: uc.level_xp ?? 0,
      statPoints: uc.stat_points ?? 0,

      imageUrl: profile.last_image_url ?? undefined,
      analysis: profile.last_analysis ?? undefined,

      wins: uc.wins ?? 0,
      isMain: uc.is_main ?? false,
      slotIndex: uc.slot_index,
      bgKey: uc.bg_key ?? undefined,

      fatigue: uc.fatigue ?? 30,
      fatigueCapBase: uc.fatigue_cap_base ?? 30,

      arenaBucket: uc.arena_bucket ?? 1,
      arenaRating: uc.arena_rating ?? 1200,
    },
  });
}
