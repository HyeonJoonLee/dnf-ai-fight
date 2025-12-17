import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDfAnalysis } from "@/lib/df-analyze";
import { AiOverloadedError } from "@/lib/df-analyze/AiOverloadedError";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId")?.trim();
    const characterName = searchParams.get("characterName")?.trim();

    if (!serverId || !characterName) {
      return NextResponse.json(
        { error: "serverId와 characterName 둘 다 필요합니다." },
        { status: 400 }
      );
    }

    // ✅ 여기서 AI 분석 + DB 조회/저장 로직 실행
    const result = await getOrCreateDfAnalysis(serverId, characterName);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("[df-analyze] error:", err);

    // ✅ AI 혼잡은 명확히 분리
    if (err?.name === "AiOverloadedError") {
      return NextResponse.json(
        {
          error: "AI 혼잡",
          detail: "현재 AI가 혼잡하여 분석할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          code: "AI_OVERLOADED",
        },
        { status: 503 }
      );
    }

    // ✅ 나머지는 진짜 서버 에러
    return NextResponse.json(
      {
        error: "서버 에러",
        detail: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
