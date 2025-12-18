"use client";

import { useEffect, useState } from "react";
import { CHARACTER_BACKGROUNDS, type CharacterBgKey } from "../src/constants/characterBackgrounds";
import { STAT_LABEL_KO } from "@/src/lib/battle/labels";

type MyCharacter = {
    id: string;
    serverId: string;
    characterName: string;
    jobName?: string;
    level?: number;
    imageUrl?: string;
    analysis?: string;
    wins?: number;

    battleTags?: string[];
    battleStats?: {
        hp: number;
        power: number;
        defense: number;
        speed: number;
        physical: number;
        magic: number;
        range: number;
    };
    fatigue?: number;          // 현재 피로도
    fatigueCapBase?: number;   // 자연회복 상한(기본 30)
    lockedUntil?: string;      // 잠금이면 ISO string(선택)
};

function fatigueColorClass(fatigue: number) {
    if (fatigue <= 9) return "text-red-400";
    if (fatigue <= 19) return "text-orange-300";
    return "text-emerald-300";
}

export default function CharacterDetailModal({
    character,
    onClose,
    onDelete,
}: {
    character: MyCharacter;
    onClose: () => void;
    onDelete: (id: string) => void;
}) {

    const LS_BG_KEY = `dnfai:character-bg:${character.id}`;

    const [bgKey, setBgKey] = useState<CharacterBgKey>("A");
    const [loaded, setLoaded] = useState(false);

    const f = character.fatigue ?? 30;
    const cap = character.fatigueCapBase ?? 30;

    useEffect(() => {
        const saved = localStorage.getItem(LS_BG_KEY) as CharacterBgKey | null;
        if (saved && CHARACTER_BACKGROUNDS.some((b) => b.key === saved)) {
            setBgKey(saved);
        }
        setLoaded(true);
    }, [LS_BG_KEY]);

    useEffect(() => {
        if (!loaded) return;            // ✅ 여기 중요 (초기 A 덮어쓰기 방지)
        localStorage.setItem(LS_BG_KEY, bgKey);
    }, [loaded, LS_BG_KEY, bgKey]);

    const bg = CHARACTER_BACKGROUNDS.find(b => b.key === bgKey)!;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* dim */}
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />

            {/* panel */}
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-xl">
                <div className="flex max-h-[85vh] flex-col">
                    {/* header */}
                    <div className="shrink-0 flex items-center justify-between border-b border-slate-800 px-5 py-4">
                        <div>
                            <div className="text-sm font-semibold">캐릭터 상세</div>
                            <div className="text-xs text-slate-400">
                                등록된 캐릭터의 정보와 전투 성향을 확인한다
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

                    {/* body scroll */}
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        <section className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4">
                            {/* left card */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                                <div
                                    className="relative flex h-56 items-center justify-center"
                                    style={{
                                        backgroundImage: `url(${bg.image})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: bg.position,
                                    }}
                                >
                                    <div className="absolute right-3 top-3 z-10 flex gap-2">
                                        {CHARACTER_BACKGROUNDS.map((b) => {
                                            const active = bgKey === b.key;

                                            return (
                                                <button
                                                    key={b.key}
                                                    type="button"
                                                    onClick={() => setBgKey(b.key)}
                                                    className={`
                                                              h-4 w-4 rounded-sm transition
                                                              ${b.color}
                                                              ${active
                                                            ? "ring-2 ring-white shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-110"
                                                            : "opacity-70 hover:opacity-100"}
                                                            `}
                                                    title={b.label}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* ✅ 피로도 표시: 네모 버튼 아래 */}
                                    <div className="absolute right-3 top-8 z-10 mt-2 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-[11px]">
                                        <span className="text-slate-300">피로도</span>{" "}
                                        <span className={`font-semibold ${fatigueColorClass(f)}`}>
                                            {f}
                                        </span>
                                        <span className="text-slate-500">/{cap}</span>
                                    </div>

                                    {character.imageUrl ? (
                                        <img
                                            src={character.imageUrl}
                                            alt={character.characterName}
                                            className="max-h-full scale-125 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                                        />
                                    ) : (
                                        <div className="h-64 w-64 rounded-xl bg-slate-800" />
                                    )}
                                </div>

                                <div className="border-t border-white/10 p-4">
                                    <div className="text-base font-semibold truncate">
                                        {character.characterName}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-300">
                                        서버: <span className="text-slate-100">{character.serverId}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-300">
                                        레벨:{" "}
                                        <span className="text-slate-100">
                                            {character.level ?? "?"}
                                        </span>
                                    </div>
                                    {character.jobName && (
                                        <div className="mt-1 text-xs text-slate-300">
                                            직업: <span className="text-slate-100">{character.jobName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* right info */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col">
                                {/* wins */}
                                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                                    <div className="text-xs text-slate-400">승리 수</div>
                                    <div className="text-lg font-bold text-amber-300">
                                        {character.wins ?? 0}
                                    </div>
                                </div>

                                {/* analysis */}
                                <div className="mt-4">
                                    <div className="text-sm font-semibold text-emerald-300">
                                        전투 성향
                                    </div>

                                    <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm leading-relaxed whitespace-pre-line">
                                        {character.analysis?.trim()
                                            ? character.analysis
                                            : "아직 전투 성향 분석이 없다. '분석하기' 를 누르면 전투 성향 분석이 가능하다."}
                                    </div>
                                </div>

                                {/* 전투 태그 */}
                                <div className="mt-4">
                                    <div className="text-sm font-semibold text-emerald-300">전투 태그</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(character.battleTags?.length
                                            ? character.battleTags
                                            : ["태그 없음"]
                                        ).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs rounded-full border border-slate-700 bg-slate-950/40 px-2 py-1"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* 전투 스탯 */}
                                <div className="mt-4">
                                    <div className="text-sm font-semibold text-emerald-300">전투 스탯</div>

                                    {(() => {
                                        const STAT_KEYS = ["hp", "power", "defense", "range", "speed", "physical", "magic"] as const;

                                        const statWidth = (k: typeof STAT_KEYS[number], v: number) => {
                                            if (k === "hp") {
                                                const w = (v / 200) * 100;
                                                return Math.max(0, Math.min(100, w));
                                            }
                                            // 0~100
                                            return Math.max(0, Math.min(100, v));
                                        };

                                        return (
                                            <div className="mt-2 space-y-2">
                                                {STAT_KEYS.map((k) => {
                                                    const v = character.battleStats?.[k];

                                                    return (
                                                        <div key={k} className="text-xs">
                                                            <div className="flex justify-between text-slate-300">
                                                                <span>{STAT_LABEL_KO[k] ?? k}</span>
                                                                <span className="text-slate-100">{typeof v === "number" ? v : "-"}</span>
                                                            </div>

                                                            <div className="h-2 rounded bg-slate-800 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500"
                                                                    style={{ width: `${typeof v === "number" ? statWidth(k, v) : 0}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* actions placeholder (확장 포인트) */}
                                <div className="mt-4 flex flex-wrap gap-2 justify-end">
                                    <button
                                        type="button"
                                        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                                        onClick={() => alert("추후: 전투하기 연결")}
                                    >
                                        전투하기
                                    </button>

                                    <button
                                        type="button"
                                        className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                                        onClick={() => alert("추후: 분석하기/재분석 연결")}
                                    >
                                        분석하기
                                    </button>

                                    <button
                                        type="button"
                                        className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20"
                                        onClick={() => {
                                            console.log("delete id:", character.id);
                                            onDelete(character.id);
                                        }}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* 확장 섹션 자리(나중에 전적/장비/스킬/AI일러스트 등) */}
                        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-xs text-slate-400">
                            확장 예정: AI 일러스트, 최근 전투 로그, 전적 그래프, 장비/스킬 요약 등
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
