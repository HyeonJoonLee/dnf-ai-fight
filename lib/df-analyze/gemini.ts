import { GoogleGenerativeAI } from "@google/generative-ai";

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
      const retryable = msg.includes("503") || msg.includes("overloaded") || msg.includes("429");
      if (!retryable) break;
      await sleep(500 * (i + 1));
    }
  }
  throw last;
}

export async function generateAnalysisWithAI(imageUrl: string): Promise<string> {
  // 이미지 base64
  const imgRes = await fetch(imageUrl, { cache: "no-store" });
  if (!imgRes.ok) throw new Error("캐릭터 이미지 로드 실패");

  const contentType = imgRes.headers.get("content-type") || "image/png";
  const arrayBuffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

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

  try {
    const result = await geminiWithRetry(() =>
      model.generateContent([
        { inlineData: { data: base64, mimeType: contentType } },
        { text: prompt },
      ])
    );
    return result.response.text();
  } catch {
    // (선택) AI 죽어도 저장/흐름 유지
    return "현재 AI가 혼잡해 기본 상태로 등록한다. 추후 재분석이 가능하다.";
  }
}
