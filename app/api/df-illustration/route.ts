// // app/api/df-illustration/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// if (!process.env.GEMINI_API_KEY) {
//   console.warn("⚠ GEMINI_API_KEY is not set. /api/df-illustration will fail.");
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { name, serverName, spriteUrl } = body as {
//       name?: string;
//       serverName?: string;
//       spriteUrl?: string;
//     };

//     if (!name || !serverName || !spriteUrl) {
//       return NextResponse.json(
//         { error: "name, serverName, spriteUrl이 모두 필요합니다." },
//         { status: 400 }
//       );
//     }

//     if (!process.env.GEMINI_API_KEY) {
//       return NextResponse.json(
//         { error: "GEMINI_API_KEY가 서버 환경에 설정되어 있지 않습니다." },
//         { status: 500 }
//       );
//     }

//     // 1) 던파 스프라이트 이미지 가져오기
//     const spriteRes = await fetch(spriteUrl);

//     if (!spriteRes.ok) {
//       console.error("Failed to fetch sprite image:", spriteRes.status, spriteRes.statusText);
//       return NextResponse.json(
//         { error: "캐릭터 이미지를 가져오지 못했습니다." },
//         { status: 500 }
//       );
//     }

//     const contentType =
//       spriteRes.headers.get("content-type") ?? "image/png";

//     const spriteArrayBuffer = await spriteRes.arrayBuffer();
//     const spriteBase64 = Buffer.from(spriteArrayBuffer).toString("base64");

//     // 2) Gemini 이미지 생성 모델 세팅
//     // responseModalities에 "Image"를 넣어서 이미지가 나오도록 설정 :contentReference[oaicite:0]{index=0}
//     const model = genAI.getGenerativeModel({
//       // 여기서 원하는 최신 이미지 지원 모델로 교체 가능
//       model: "gemini-2.5-flash-image"
//     });

//     // 3) 프롬프트 구성
//     const prompt = `
// 이 이미지는 던전앤파이터 캐릭터 "${name}"(서버: ${serverName})의 게임 내 스프라이트입니다.
// 이 캐릭터의 외형과 장비, 분위기를 참고해서,
// 고퀄리티 2D 일러스트 스타일로 전신 이미지를 그려 주세요.

// 요청 조건:
// - 원본 캐릭터의 옷 색, 무기, 실루엣은 유지
// - 배경은 단색 또는 아주 심플한 분위기 (게임 카드 일러스트 느낌)
// - 과하게 포즈를 바꾸지 말고, 자연스럽게 서 있는 포즈
// - 애니메이션 일러스트/게임 일러스트 느낌으로, 너무 과한 실사 스타일은 피함
// `;

//     // 4) 텍스트 + 레퍼런스 이미지 같이 보내기 :contentReference[oaicite:1]{index=1}
//     const contents = [
//       {
//         role: "user",
//         parts: [
//           { text: prompt },
//           {
//             inlineData: {
//               data: spriteBase64,
//               mimeType: contentType,
//             },
//           },
//         ],
//       },
//     ];

//     const response = await model.generateContent({
//       contents,
//     });

//     const candidates = response.response.candidates;
//     if (!candidates || candidates.length === 0) {
//       console.error("No candidates in Gemini response");
//       return NextResponse.json(
//         { error: "AI가 이미지를 생성하지 못했습니다." },
//         { status: 500 }
//       );
//     }

//     const parts = candidates[0].content?.parts ?? [];
//     const imagePart = parts.find((p: any) => p.inlineData);

//     if (!imagePart?.inlineData?.data) {
//       console.error("No inlineData image part in response");
//       return NextResponse.json(
//         { error: "AI 응답에 이미지 데이터가 없습니다." },
//         { status: 500 }
//       );
//     }

//     const mimeType = imagePart.inlineData.mimeType ?? "image/png";
//     const base64Data = imagePart.inlineData.data as string;

//     // 프론트에서 바로 쓸 수 있도록 data URL 형태로 반환
//     const dataUrl = `data:${mimeType};base64,${base64Data}`;

//     return NextResponse.json({
//       imageUrl: dataUrl,
//     });
//   } catch (err) {
//     console.error("df-illustration error:", err);
//     return NextResponse.json(
//       { error: "AI 일러스트 생성 중 오류가 발생했습니다." },
//       { status: 500 }
//     );
//   }
// }


//app/api/df-illustration/route.ts 에코버전
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, serverName, spriteUrl } = body as {
      name?: string;
      serverName?: string;
      spriteUrl?: string;
    };

    if (!name || !serverName || !spriteUrl) {
      return NextResponse.json(
        { error: "name, serverName, spriteUrl이 모두 필요합니다." },
        { status: 400 }
      );
    }

    // ✅ 우선은 Gemini 안 쓰고, 들어온 spriteUrl을 그대로 돌려주자.
    //    일단 카드 뒤집기 UX가 잘 도는지 확인용.
    return NextResponse.json({
      imageUrl: spriteUrl,
    });
  } catch (err) {
    console.error("df-illustration error:", err);
    return NextResponse.json(
      { error: "AI 일러스트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


// // app/api/df-illustration/route.ts  나노바나나 사용버전
// import { NextRequest, NextResponse } from "next/server";
// import { Buffer } from "buffer";

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// // Gemini 2.5 Flash Image (Nano Banana) REST 엔드포인트 :contentReference[oaicite:1]{index=1}
// const GEMINI_IMAGE_MODEL =
//     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

// export async function POST(req: NextRequest) {
//     try {
//         const body = await req.json();
//         const { name, serverName, spriteUrl } = body as {
//             name?: string;
//             serverName?: string;
//             spriteUrl?: string;
//         };

//         if (!name || !serverName || !spriteUrl) {
//             return NextResponse.json(
//                 { error: "name, serverName, spriteUrl이 모두 필요합니다." },
//                 { status: 400 }
//             );
//         }

//         if (!GEMINI_API_KEY) {
//             console.error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
//             return NextResponse.json(
//                 { error: "서버 환경에 GEMINI_API_KEY가 없습니다." },
//                 { status: 500 }
//             );
//         }

//         // 1) 던파 스프라이트 이미지를 가져와서 base64로 변환
//         const spriteRes = await fetch(spriteUrl);

//         if (!spriteRes.ok) {
//             console.error(
//                 "Failed to fetch sprite image:",
//                 spriteRes.status,
//                 spriteRes.statusText
//             );
//             return NextResponse.json(
//                 { error: "캐릭터 이미지를 가져오지 못했습니다." },
//                 { status: 500 }
//             );
//         }

//         const contentType =
//             spriteRes.headers.get("content-type") ?? "image/png";

//         const spriteArrayBuffer = await spriteRes.arrayBuffer();
//         const spriteBase64 = Buffer.from(spriteArrayBuffer).toString("base64");

//         // 2) Gemini 이미지 생성용 프롬프트
//         const prompt = `
// 이 이미지는 던전앤파이터 캐릭터 "${name}" (서버: ${serverName}) 의 인게임 스프라이트입니다.
// 이 캐릭터의 외형, 색감, 무기, 분위기를 참고해서,
// 고퀄리티 2D 일러스트 카드 일러스트 형태로 전신 이미지를 생성해 주세요.

// 요청 조건:
// - 원본 캐릭터의 옷 색, 무기, 실루엣은 최대한 유지
// - 배경은 단색 또는 아주 심플한 분위기 (게임 캐릭터 카드 일러스트 느낌)
// - 과하게 포즈를 바꾸지 말고, 자연스럽게 서 있는 자세
// - 과도한 실사 느낌보다는, 게임 일러스트 / 애니메이션 일러스트 스타일
// `;

//         // 3) Gemini 2.5 Flash Image API 호출 :contentReference[oaicite:2]{index=2}
//         const geminiRes = await fetch(`${GEMINI_IMAGE_MODEL}?key=${GEMINI_API_KEY}`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 contents: [
//                     {
//                         role: "user",
//                         parts: [
//                             { text: prompt },
//                             {
//                                 inlineData: {
//                                     data: spriteBase64,
//                                     mimeType: contentType,
//                                 },
//                             },
//                         ],
//                     },
//                 ],
//             }),
//         });

//         const geminiJson = await geminiRes.json().catch(() => null);

//         // 디버깅용 (문제 생기면 콘솔에서 전체 응답 확인 가능)
//         console.log("Gemini image response status:", geminiRes.status);

//         // 3) 🔥 쿼터 초과 → fallback
//         if (geminiRes.status === 429) {
//             console.warn("Gemini quota exceeded, fallback to spriteUrl.");
//             return NextResponse.json(
//                 {
//                     imageUrl: spriteUrl,
//                     fallback: true,
//                     reason: geminiJson?.error?.message,
//                 },
//                 { status: 200 }
//             );
//         }

//         // 4) 기타 오류 → 반환
//         if (!geminiRes.ok) {
//             console.error("Gemini image error body:", geminiJson);
//             return NextResponse.json(
//                 {
//                     error:
//                         geminiJson?.error?.message ||
//                         "Gemini 이미지 생성 요청이 실패했습니다.",
//                 },
//                 { status: 500 }
//             );
//         }

//         // 5) 응답 데이터에서 이미지 추출
//         const base64Image =
//             geminiJson?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

//         if (!base64Image) {
//             return NextResponse.json(
//                 { error: "Gemini 응답에서 이미지 데이터를 찾을 수 없습니다." },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             imageUrl: `data:image/png;base64,${base64Image}`,
//             fallback: false,
//         });

//     } catch (err) {
//         console.error("df-illustration error:", err);
//         return NextResponse.json(
//             { error: "AI 일러스트 생성 중 서버 오류가 발생했습니다." },
//             { status: 500 }
//         );
//     }
// }
