import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDfAnalysis } from "@/lib/df-analyze";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId")?.trim();
    const characterName = searchParams.get("characterName")?.trim();

    if (!serverId || !characterName) {
      return NextResponse.json({ error: "serverId와 characterName 둘 다 필요합니다." }, { status: 400 });
    }

    const result = await getOrCreateDfAnalysis(serverId, characterName);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("[df-analyze] error:", err);
    return NextResponse.json({ error: "서버 에러", detail: String(err?.message || err) }, { status: 500 });
  }
}
