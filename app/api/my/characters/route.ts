// app/api/my/characters/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  serverId: string;
  characterName: string;

  // ✅ 이제 필수로 받자 (항상 들어가야 한다고 했으니)
  dnfCharacterId: string;

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
        last_analysis
      )
    `
    )
    .eq("user_id", appUserId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message ?? "DB select failed" }, { status: 500 });
  }

  // ✅ 프론트가 기존처럼 쓰기 쉬운 형태로 매핑 (id = ucId로 내려줌)
  const characters = (data ?? []).map((row: any) => {
    const p = row.profile;
    return {
      id: row.id,                 // ✅ 이제 이 id는 user_characters.id (ucId)
      profileId: row.profile_id,  // 필요하면 프론트에서 사용
      serverId: p?.server_id,
      dnfCharacterId: p?.dnf_character_id,
      characterName: p?.character_name,
      jobName: p?.job_name ?? undefined,
      level: p?.level ?? undefined,
      imageUrl: p?.last_image_url ?? undefined,
      analysis: p?.last_analysis ?? undefined,

      wins: row.wins ?? 0,
      isMain: row.is_main ?? false,
      slotIndex: row.slot_index ?? undefined,
      bgKey: row.bg_key ?? undefined,
    };
  });

  return NextResponse.json({ ok: true, characters });
}

// ✅ 등록 (profile upsert -> user_characters upsert)
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
  const dnfCharacterId = body.dnfCharacterId?.trim();

  if (!serverId || !characterName || !dnfCharacterId) {
    return NextResponse.json(
      { error: "serverId, characterName, dnfCharacterId is required" },
      { status: 400 }
    );
  }

  // 1) character_profiles upsert (unique: server_id + dnf_character_id)
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("character_profiles")
    .upsert(
      {
        server_id: serverId,
        dnf_character_id: dnfCharacterId,
        character_name: characterName,
        job_name: body.jobName ?? null,
        level: body.level ?? null,
        last_image_url: body.imageUrl ?? null,
        last_analysis: body.analysis ?? null,
      },
      { onConflict: "server_id,dnf_character_id" }
    )
    .select("id, server_id, dnf_character_id, character_name, job_name, level, last_image_url, last_analysis")
    .single();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: profileErr?.message ?? "Profile upsert failed" },
      { status: 500 }
    );
  }

  // 2) user_characters upsert (unique: user_id + profile_id)
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
    // 중복 등록이면 upsert가 그냥 기존 row를 돌려줄 텐데,
    // 혹시 정책상 “이미 등록”을 띄우고 싶으면 여기서 별도 체크 필요.
    return NextResponse.json(
      { error: ucErr?.message ?? "User character upsert failed" },
      { status: 500 }
    );
  }

  // ✅ 프론트에서 바로 쓰는 DTO로 반환
  return NextResponse.json({
    ok: true,
    character: {
      id: uc.id, // ✅ ucId
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
