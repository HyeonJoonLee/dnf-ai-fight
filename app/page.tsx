// app/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { CharacterCard } from "@/components/CharacterCard";

type Result = {
  character: {
    serverId: string;
    dnfCharacterId: string; // ✅ 변경
    name: string;
    level: number;
    jobName: string;
  };
  imageUrl: string;
  analysis: string;
  source: "db" | "ai"; // ✅ 추가(디버그용)
};

const SERVERS = [
  { id: "cain", label: "카인" },
  { id: "siroco", label: "시로코" },
  { id: "diregie", label: "디레지에" },
  { id: "hilder", label: "힐더" },
  { id: "prey", label: "프레이" },
  { id: "anton", label: "안톤" },
  { id: "bakal", label: "바칼" },
  { id: "casillas", label: "카시야스" },
];

export default function HomePage() {
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [serverId, setServerId] = useState("cain");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setAiImageUrl(null); // 새 검색마다 기존 일러스트 리셋

    if (!name.trim()) {
      setError("캐릭터명을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const url =
        `/api/df-analyze?serverId=${encodeURIComponent(serverId)}` +
        `&characterName=${encodeURIComponent(name.trim())}`;

      const res = await fetch(url, { method: "GET" });

      // ✅ 안전 파싱 (빈 바디 방어)
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        setError(data?.error || "요청 실패");
        return;
      }

      console.log("df-analyze result:", data);
      setResult(data);

      try {
        const illRes = await fetch("/api/df-illustration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.character.name,
            serverName: data.character.serverId,
            spriteUrl: data.imageUrl,
          }),
        });

        let illData: any = null;
        try {
          illData = await illRes.json();
        } catch {
          return;
        }

        // console.log("df-illustration 응답:", illRes.status, illData);
        // const illData = await illRes.json();

        if (illRes.ok && illData.imageUrl) {
          setAiImageUrl(illData.imageUrl);
          if (illData.fallback) {
            console.warn("AI 일러스트 대신 원본 이미지로 fallback되었습니다.");
            // 필요하면 화면에도 조그맣게 안내 문구 추가 가능
          }
        } //else {
        //   // ✅ 지금 단계에선 '정상적으로 없음' 취급 → 콘솔 에러 금지
        //   // (원하면 개발 중에만 debug 로그)
        //   if (process.env.NODE_ENV === "development") {
        //     console.log("df-illustration skipped:", illRes.status, illData);
        //   }
        // }
      } catch (err) {
        console.error("일러스트 생성 중 오류:", err);
        // 일러스트만 실패해도 텍스트 분석은 이미 표시되어 있으므로 치명적이진 않음
      }

    } catch (err: any) {
      console.error(err);
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">
          던파 아레나 캐릭터 전투 분석
        </h1>
        <p className="text-sm text-slate-300">
          서버와 캐릭터명을 입력하면, 캐릭터 룩에 기반하여 AI가 캐릭터의 전투 성향을 분석해줍니다.<br />
          내 캐릭터를 등록하고 다른 캐릭터와 전투하여 승리를 쟁취하세요!
          {/* 서버와 캐릭터명을 입력하면, 던파 오픈 API에서 이미지와 정보를 가져오고
          Gemini가 이미지 기반으로 전투 스타일을 분석해준다. */}
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-700"
        >
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs mb-1">서버</label>
              <select
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                className="w-full rounded-md bg-slate-800 border border-slate-600 px-2 py-1 text-sm"
              >
                {SERVERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-[2] min-w-[180px]">
              <label className="block text-xs mb-1">캐릭터명</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 던파의 황제"
                className="w-full rounded-md bg-slate-800 border border-slate-600 px-2 py-1 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-4 py-2 text-sm font-semibold transition"
          >
            {loading ? "분석 중..." : "AI로 전투 스타일 분석하기"}
          </button>

          {error && (
            <p className="text-sm text-red-400 mt-2 whitespace-pre-line">
              {error}
            </p>
          )}
        </form>

        {result && (
          <section className="mt-4 grid grid-cols-1 md:grid-cols-[220px,1fr] gap-4 bg-slate-900/70 p-4 rounded-xl border border-slate-700">
            {/* 왼쪽: 캐릭터 카드 (앞면=원본, 나중에 뒷면=AI 일러스트) */}
            <CharacterCard
              name={result.character.name}
              serverName={result.character.serverId}
              spriteUrl={result.imageUrl}
              aiImageUrl={aiImageUrl ?? undefined}
            />

            {/* 오른쪽: 전투 스타일 분석 텍스트 */}
            <div className="text-sm leading-relaxed whitespace-pre-line flex flex-col">
              <h2 className="font-semibold mb-2 text-emerald-300">
                AI 전투 스타일 분석
              </h2>
              <div className="text-slate-100 flex-1">{result.analysis}</div>

              <div className="mt-4 text-xs text-slate-400">
                Lv.{result.character.level} {result.character.jobName} · 서버:{" "}
                {result.character.serverId}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
