// app/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { CharacterCard } from "@/components/CharacterCard";

type Result = {
  character: {
    serverId: string;
    characterId: string;
    name: string;
    level: number;
    jobName: string;
  };
  imageUrl: string;
  analysis: string;
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
      const res = await fetch(
        `/api/df-analyze?serverId=${serverId}&characterName=${encodeURIComponent(
          name.trim()
        )}`
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "요청 실패");
        return;
      }

      // 텍스트 분석 + 기본 이미지 먼저 화면에 표시
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
          illData = null;
        }

        console.log("df-illustration 응답:", illRes.status, illData);
        // const illData = await illRes.json();

        if (illRes.ok && illData.imageUrl) {
          setAiImageUrl(illData.imageUrl);
          if (illData.fallback) {
            console.warn("AI 일러스트 대신 원본 이미지로 fallback되었습니다.");
            // 필요하면 화면에도 조그맣게 안내 문구 추가 가능
          }
        } else {
          console.error("일러스트 생성 실패:", illData);
          // 여기서 에러 메시지를 따로 띄우고 싶으면 setError 추가로 써도 됨
        }
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
          던파 캐릭터 AI 전투 스타일 분석 데모
        </h1>
        <p className="text-sm text-slate-300">
          서버와 캐릭터명을 입력하면, 던파 오픈 API에서 이미지와 정보를 가져오고
          Gemini가 이미지 기반으로 전투 스타일을 분석해준다.
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
                placeholder="예: 던파짱센캐"
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
