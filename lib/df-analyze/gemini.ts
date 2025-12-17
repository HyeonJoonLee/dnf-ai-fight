import { GoogleGenerativeAI } from "@google/generative-ai";
import { TAG_KEYS } from "@/src/lib/battle/tags";
import { AiOverloadedError } from "./AiOverloadedError";

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
You are analyzing a Dungeon Fighter character's combat style.

Return ONLY valid JSON.
No markdown. No explanation.

Rules:
- battleTags MUST contain EXACTLY 3 items.
- Each tag MUST be chosen ONLY from this list:
${TAG_KEYS.join(", ")}

{
  "analysis": "Korean, 3-4 sentences, '~다' style",
  "battleTags": ["TagKey", "TagKey", "TagKey"],
  "battleStats": {
    "hp": 160-200 (step 10),
    "power": 0-100,
    "defense": 0-100,
    "range": 0-100,
    "speed": 0-100,
    "physical": 0-100,
    "magic": 0-100,
  }
}
`;

    try {
        const result = await geminiWithRetry(() =>
            model.generateContent([
                { inlineData: { data: base64, mimeType: contentType } },
                { text: prompt },
            ])
        );

        return result.response.text();
    } catch (e: any) {
        const msg = String(e?.message ?? "");
        const overloaded = msg.includes("503") || msg.includes("overloaded") || msg.includes("429");
        if (overloaded) throw new AiOverloadedError();
        throw e;
    }
}
