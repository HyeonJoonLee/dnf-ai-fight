// components/RegisterCharacterModal.tsx
"use client";

import { FormEvent, useState } from "react";
import { CharacterCard } from "@/components/CharacterCard";

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

type AnalyzeResult = {
    character: {
        serverId: string;
        dnfCharacterId: string; // ✅ 변경
        name: string;
        level: number;
        jobName: string;
    };
    imageUrl: string;
    analysis: string;
    source: "db" | "ai"; // ✅ 있으면 좋음(없으면 빼도 됨)
};

export default function RegisterCharacterModal({
    onClose,
    onRegistered,
}: {
    onClose: () => void;
    onRegistered: (char: {
        id: string;
        serverId: string;
        characterName: string;
        jobName: string;
        level: number;
        imageUrl: string;
        analysis?: string;
        wins?: number;
    }) => void;
}) {
    const [serverId, setServerId] = useState("cain");
    const [name, setName] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalyzeResult | null>(null);

    async function handleAnalyze(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setResult(null);

        if (!name.trim()) {
            setError("캐릭터명을 입력해 주세요.");
            return;
        }

        setLoading(true);

        try {
            const url =
                `/api/df-analyze?serverId=${encodeURIComponent(serverId)}` +
                `&characterName=${encodeURIComponent(name.trim())}`;

            const res = await fetch(url, { method: "GET", cache: "no-store" });

            const raw = await res.text();
            const data = raw ? JSON.parse(raw) : null;

            if (!res.ok) {
                setError(data?.error || data?.detail || `분석 실패 (${res.status})`);
                return;
            }

            setResult(data);

            // ✅ save=true라면 이미 DB에 들어간 상태
            // 바로 MyPage state에 추가 가능
            if (data.userCharacterId) {
                onRegistered({
                    id: data.userCharacterId, // user_characters.id
                    serverId: data.character.serverId,
                    characterName: data.character.characterName,
                    jobName: data.character.jobName,
                    level: data.character.level,
                    imageUrl: data.imageUrl,
                    analysis: data.analysis,
                    wins: 0,
                });
            }

        } catch {
            setError("요청 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister() {
        if (!result) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/my/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serverId: result.character.serverId,
                    characterName: result.character.name,
                }),
            });

            const raw = await res.text();
            const data = raw ? JSON.parse(raw) : null;

            if (!res.ok) {
                setError(data?.error || `등록 실패 (${res.status})`);
                return;
            }

            onRegistered({
                id: data.character.id, // ucId
                serverId: data.character.serverId,
                characterName: data.character.characterName,
                jobName: data.character.jobName,
                level: data.character.level,
                imageUrl: data.character.imageUrl,
                wins: data.character.wins ?? 0,
                analysis: data.character.analysis,
            });

        } catch (e) {
            setError("등록 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* dim */}
            <div
                className="absolute inset-0 bg-black/70"
                onClick={onClose}
            />

            {/* panel */}
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-xl">
                {/* ✅ 헤더+본문을 한 flex-column 안에 */}
                <div className="flex max-h-[85vh] flex-col">
                    {/* ✅ 헤더: 고정 */}
                    <div className="shrink-0 flex items-center justify-between border-b border-slate-800 px-5 py-4">
                        <div>
                            <div className="text-sm font-semibold">캐릭터 등록</div>
                            <div className="text-xs text-slate-400">
                                서버/캐릭터명을 입력하고 분석 후 등록할 수 있어요.
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs hover:bg-slate-800"
                        >
                            닫기
                        </button>
                    </div>

                    {/* ✅ 본문: 여기만 스크롤 */}
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        {/* 입력 폼 */}
                        <form
                            onSubmit={handleAnalyze}
                            className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                        >
                            <div className="flex gap-3 flex-wrap">
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs mb-1 text-slate-300">서버</label>
                                    <select
                                        value={serverId}
                                        onChange={(e) => setServerId(e.target.value)}
                                        className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-2 text-sm"
                                    >
                                        {SERVERS.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.label} ({s.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-[2] min-w-[180px]">
                                    <label className="block text-xs mb-1 text-slate-300">캐릭터명</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="예: 던파의 황제는 조강현이요"
                                        className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-4 py-2 text-sm font-semibold transition"
                            >
                                {loading ? "분석 중..." : "분석하기"}
                            </button>

                            {error && (
                                <p className="text-sm text-red-400 whitespace-pre-line">{error}</p>
                            )}
                        </form>

                        {/* 결과 */}
                        {result && (
                            <section className="mt-5 grid grid-cols-1 md:grid-cols-[220px,1fr] gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                                <CharacterCard
                                    name={result.character.name}
                                    serverName={result.character.serverId}
                                    spriteUrl={result.imageUrl}
                                />

                                <div className="flex flex-col">
                                    <h2 className="font-semibold mb-2 text-emerald-300 text-sm">
                                        전투 스타일 분석 결과
                                    </h2>

                                    <div className="text-slate-100 whitespace-pre-line text-sm leading-relaxed max-h-48 overflow-y-auto pr-2">
                                        {result.analysis}
                                    </div>

                                    <div className="mt-4 text-xs text-slate-400">
                                        Lv.{result.character.level} {result.character.jobName} · 서버:{" "}
                                        {result.character.serverId}
                                    </div>

                                    <div className="mt-4 flex items-center justify-end gap-2">
                                        <span className="text-xs text-slate-400">등록하시겠습니까?</span>
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={handleRegister}
                                            className="rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-60 px-4 py-2 text-xs font-semibold text-slate-950"
                                        >
                                            예, 등록
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
