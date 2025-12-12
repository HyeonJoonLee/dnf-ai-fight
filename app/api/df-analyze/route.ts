// app/api/df-analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.FREETIER_GEMINI_KEY || "");  //베포 전 프리티어 API로 바꿔놓음

const model = genAI.getGenerativeModel({
  // 멀티모달 지원 모델 (필요에 따라 최신 플래시/프로로 바꿔도 됨)
  model: "gemini-2.5-pro",
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");
    const characterName = searchParams.get("characterName");

    if (!serverId || !characterName) {
      return NextResponse.json(
        { error: "serverId와 characterName 둘 다 필요합니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEOPLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEOPLE_API_KEY가 설정되어 있지 않습니다." },
        { status: 500 }
      );
    }

    // 1) 던파 캐릭터 검색
    const searchUrl =
      `https://api.neople.co.kr/df/servers/${serverId}/characters` +
      `?characterName=${encodeURIComponent(characterName)}` +
      `&wordType=full&limit=1&apikey=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const text = await searchRes.text();
      return NextResponse.json(
        { error: "캐릭터 검색 실패", detail: text },
        { status: 502 }
      );
    }

    const searchJson: any = await searchRes.json();
    const row = searchJson.rows?.[0];

    if (!row) {
      return NextResponse.json(
        { error: "해당 조건의 캐릭터를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const characterId = row.characterId as string;
    const charName = row.characterName as string;
    const level = row.level as number;
    const jobName = row.jobGrowName as string;

    // 2) 캐릭터 이미지 URL (네오플에서 공식 제공)
    const imageUrl = `https://img-api.neople.co.kr/df/servers/${serverId}/characters/${characterId}?zoom=2`;

    // 3) 이미지를 받아와서 base64로 인코딩
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "캐릭터 이미지 로드 실패" },
        { status: 502 }
      );
    }

    const contentType = imgRes.headers.get("content-type") || "image/png";
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // 4) Gemini에게 전투 스타일 분석 요청
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

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: contentType,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text();

    return NextResponse.json({
      character: {
        serverId,
        characterId,
        name: charName,
        level,
        jobName,
      },
      imageUrl,
      analysis: text,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "서버 에러", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
