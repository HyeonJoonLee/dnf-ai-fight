// app/api/df-analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const genAI = new GoogleGenerativeAI(process.env.FREETIER_GEMINI_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geminiWithRetry<T>(fn: () => Promise<T>, tries = 3) {
  let last: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      last = e;
      const msg = String(e?.message ?? "");
      // 구글 SDK가 status를 항상 주진 않아서 message 기반도 같이 본다
      const retryable = msg.includes("503") || msg.includes("overloaded") || msg.includes("429");
      if (!retryable) break;
      await sleep(500 * (i + 1));
    }
  }
  throw last;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const serverId = body?.serverId?.trim();
    const characterName = body?.characterName?.trim();
    const save = !!body?.save;

    if (!serverId || !characterName) {
      return NextResponse.json({ error: "serverId와 characterName 둘 다 필요합니다." }, { status: 400 });
    }

    const apiKey = process.env.NEOPLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "NEOPLE_API_KEY가 설정되어 있지 않습니다." }, { status: 500 });
    }

    // 1) 던파 캐릭터 검색
    const searchUrl =
      `https://api.neople.co.kr/df/servers/${serverId}/characters` +
      `?characterName=${encodeURIComponent(characterName)}` +
      `&wordType=full&limit=1&apikey=${apiKey}`;

    const searchRes = await fetch(searchUrl, { cache: "no-store" });
    if (!searchRes.ok) {
      const text = await searchRes.text();
      return NextResponse.json({ error: "캐릭터 검색 실패", detail: text }, { status: 502 });
    }

    const searchJson: any = await searchRes.json();
    const row = searchJson.rows?.[0];
    if (!row) {
      return NextResponse.json({ error: "해당 조건의 캐릭터를 찾을 수 없습니다." }, { status: 404 });
    }

    const dnfCharacterId = row.characterId as string;  // ✅ 앞으로 이게 항상 필요
    const charName = row.characterName as string;
    const level = row.level as number;
    const jobName = row.jobGrowName as string;

    const imageUrl = `https://img-api.neople.co.kr/df/servers/${serverId}/characters/${dnfCharacterId}?zoom=2`;

    // 2) 이미지 base64
    const imgRes = await fetch(imageUrl, { cache: "no-store" });
    if (!imgRes.ok) {
      return NextResponse.json({ error: "캐릭터 이미지 로드 실패" }, { status: 502 });
    }
    const contentType = imgRes.headers.get("content-type") || "image/png";
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // 3) Gemini 분석 (과부하 대비 retry + fallback)
    const prompt = `
Describe the combat style of this character based on the image.

Output:
- Korean
- 3–4 sentences, single paragraph
- "~다" style, no honorifics

Focus on combat traits:
melee/ranged, physical/magical, offense/defense, mobility.
Skill names may be fictional.
`;

    let analysis: string | null = null;

    try {
      const result = await geminiWithRetry(() =>
        model.generateContent([
          { inlineData: { data: base64, mimeType: contentType } },
          { text: prompt },
        ])
      );

      analysis = result.response.text();
    } catch (e) {
      // ✅ AI 죽어도 흐름 유지 (비용/안정성 목적)
      analysis = "현재 AI가 혼잡해 기본 상태로 등록한다. 추후 재분석이 가능하다.";
    }

    // 4) (선택) DB 저장: character_profiles upsert + user_characters upsert
    let profileId: string | null = null;
    let userCharacterId: string | null = null;

    if (save) {
      const session = await auth();
      const appUserId = (session as any)?.appUserId as string | undefined;

      if (!session || !appUserId) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
      }

      // 4-1) profiles upsert
      const { data: profile, error: pErr } = await supabaseAdmin
        .from("character_profiles")
        .upsert(
          {
            server_id: serverId,
            dnf_character_id: dnfCharacterId,
            character_name: charName,
            job_name: jobName,
            level,
            last_image_url: imageUrl,
            last_analysis: analysis,
          },
          { onConflict: "server_id,dnf_character_id" }
        )
        .select("id")
        .single();

      if (pErr || !profile) {
        return NextResponse.json({ error: pErr?.message ?? "profile upsert failed" }, { status: 500 });
      }
      profileId = profile.id;

      // 4-2) user_characters upsert
      const { data: uc, error: ucErr } = await supabaseAdmin
        .from("user_characters")
        .upsert(
          {
            user_id: appUserId,
            profile_id: profileId,
            wins: 0,
          },
          { onConflict: "user_id,profile_id" }
        )
        .select("id")
        .single();

      if (ucErr || !uc) {
        return NextResponse.json({ error: ucErr?.message ?? "user_characters upsert failed" }, { status: 500 });
      }
      userCharacterId = uc.id;
    }

    // ✅ 응답: (save=true면) ucId/profileId까지 같이 내려줘서 프론트가 바로 슬롯 업데이트 가능
    return NextResponse.json({
      ok: true,
      character: {
        serverId,
        dnfCharacterId,
        characterName: charName,
        jobName,
        level,
      },
      imageUrl,
      analysis,
      profileId,
      userCharacterId,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "서버 에러", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
