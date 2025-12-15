import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
    serverId: string;
    characterName: string;
    dnfCharacterId?: string | null;
    jobName?: string | null;
    level?: number | null;
    imageUrl?: string | null;
    analysis?: string | null;
};

// ✅ 내 캐릭터 목록 가져오기
export async function GET() {
    const session = await auth();
    const appUserId = (session as any)?.appUserId as string | undefined;

    if (!session || !appUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
        .from("characters")
        .select(
            "id, server_id, character_name, job_name, level, last_image_url, wins, created_at, updated_at, last_analysis"
        )
        .eq("user_id", appUserId)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json(
            { error: error.message ?? "DB select failed" },
            { status: 500 }
        );
    }

    // 프론트에서 쓰기 좋은 형태로 변환
    const characters = (data ?? []).map((c) => ({
        id: c.id,
        serverId: c.server_id,
        characterName: c.character_name,
        jobName: c.job_name ?? undefined,
        level: c.level ?? undefined,
        imageUrl: c.last_image_url ?? undefined,
        wins: c.wins ?? 0,
        analysis: c.last_analysis ?? undefined,
    }));

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
        return NextResponse.json(
            { error: "serverId, characterName is required" },
            { status: 400 }
        );
    }

    // ✅ DB insert (wins 기본 0)
    const { data, error } = await supabaseAdmin
        .from("characters")
        .insert({
            user_id: appUserId,
            server_id: serverId,
            character_name: characterName,
            dnf_character_id: body.dnfCharacterId ?? null,
            job_name: body.jobName ?? null,
            level: body.level ?? null,
            last_image_url: body.imageUrl ?? null,
            last_analysis: body.analysis ?? null,
            // 필요하면 analysis 컬럼을 characters에 추가하고 저장 (없으면 아래 줄 삭제)
            // last_analysis: body.analysis ?? null,
            // wins 컬럼을 추가해뒀다면
            wins: 0,
        })
        .select("*")
        .single();

    // 중복(유니크: user_id + server_id + character_name) 처리
    if (error) {
        // supabase-js는 Postgres 에러를 code로 주는 경우가 많음 (23505)
        if ((error as any).code === "23505") {
            return NextResponse.json(
                { error: "이미 등록된 캐릭터입니다." },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: error.message ?? "DB insert failed" },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, character: data });
}
