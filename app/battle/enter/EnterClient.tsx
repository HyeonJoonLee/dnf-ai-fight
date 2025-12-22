//app/battle/enter/EnterClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** ======================
 * Types
 ======================= */
type BattleTag =
    | "암살"
    | "선공"
    | "폭딜"
    | "탱커"
    | "견제"
    | "연타"
    | "카운터"
    | "유지력"
    | "광역";

type BattleStats = {
    hp: number;
    power: number;
    defense: number;
    speed: number;
    control: number;
    burst: number;
    sustain: number;
};

type MyChar = {
    id: string;
    serverId: string;
    name: string;
    job: string;
    level: number;
    portrait?: string;
    tags: BattleTag[];
    stats: BattleStats;
};

type Monster = {
    id: string;
    name: string;
    level: number;
    portrait?: string;
    tags: BattleTag[];
    stats: BattleStats;
};

type LootItem = { id: string; name: string; qty: number };

type DungeonRun = {
    dungeonId: string;
    dungeonTitle: string;
    floorIndex: number;
    floorTotal: number;
    monster: Monster;
    lootSoFar: LootItem[];
};

type Step = "pick" | "battle";

const PULSE_MS = 550;

/** ======================
 * Mock data (나중에 DB로 교체)
 ======================= */
const MOCK_MY_CHARS: MyChar[] = [
    {
        id: "c1",
        serverId: "cain",
        name: "사황카이드",
        job: "룬 크루세이더",
        level: 115,
        portrait: "/images/monsters/abyss-priest.png",
        tags: ["탱커", "유지력", "카운터"],
        stats: { hp: 8800, power: 72, defense: 84, speed: 46, control: 58, burst: 40, sustain: 78 },
    },
    {
        id: "c2",
        serverId: "cain",
        name: "블레이드K",
        job: "블레이드",
        level: 110,
        portrait: "/images/monsters/abyss-priest.png",
        tags: ["암살", "선공", "폭딜"],
        stats: { hp: 6100, power: 86, defense: 52, speed: 78, control: 62, burst: 88, sustain: 44 },
    },
    {
        id: "c3",
        serverId: "cain",
        name: "소드마스터",
        job: "소드마스터",
        level: 105,
        portrait: "/images/monsters/abyss-priest.png",
        tags: ["연타", "견제", "광역"],
        stats: { hp: 7000, power: 74, defense: 60, speed: 62, control: 64, burst: 55, sustain: 58 },
    },
];

// dungeonId → 던전런(현재는 더미). 나중에 실제 던전 데이터 기반 생성으로 교체하면 됨.
function buildDungeonRun(dungeonId: string): DungeonRun {
    const titleMap: Record<string, string> = {
        "pve-1": "망각의 숲",
        "pve-2": "벚꽃 연무 회랑",
        "pve-3": "거미 무덤",
        "pvp-1": "무명의 결투장",
    };

    return {
        dungeonId,
        dungeonTitle: titleMap[dungeonId] ?? "알 수 없는 던전",
        floorIndex: 1,
        floorTotal: 6,
        monster: {
            id: "m1",
            name: "심술궂은 묘목",
            level: 15,
            portrait: "/images/monsters/m2_sapling.png",
            tags: ["견제", "연타", "광역"],
            stats: { hp: 2200, power: 28, defense: 18, speed: 22, control: 26, burst: 20, sustain: 14 },
        },
        lootSoFar: [
            { id: "l1", name: "숲의 정수", qty: 2 },
            { id: "l2", name: "하급 장비 상자", qty: 1 },
        ],
    };
}

/** ======================
 * UI atoms (파일 안에 둬도 됨 / 나중에 components로 빼기 쉬움)
 ======================= */
function MiniStat({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
    const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
    return (
        <div className="grid grid-cols-[28px_1fr_34px] items-center gap-2">
            <div className="text-[11px] text-slate-400">{label}</div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-white/30" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[11px] text-slate-200 tabular-nums text-right">{value}</div>
        </div>
    );
}

function TagPill({ t }: { t: string }) {
    return (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-200">
            #{t}
        </span>
    );
}

function Portrait({ src, alt }: { src?: string; alt: string }) {
    return (
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={alt} className="h-full w-full object-contain p-2" />
            ) : (
                <div className="h-full w-full" />
            )}
        </div>
    );
}

/** ======================
 * Page
 ======================= */
export default function BattleEnterPage() {
    const [glowPulse, setGlowPulse] = useState(false);
    const prevLogLen = useRef(0);

    // 이미 쓰고 있는 것들(예: logRef, isAtBottom, showJumpToLatest)은 그대로 사용한다고 가정
    // 만약 isAtBottom state가 없다면: onLogScroll에서 계산해두는 방식이면 OK

    const router = useRouter();
    const searchParams = useSearchParams();

    // ✅ /battle에서 넘어온 dungeonId 받기
    const dungeonId = searchParams.get("dungeonId") ?? "pve-1";

    // ✅ dungeonId가 바뀌면 자동으로 run 재생성
    const dungeonRun = useMemo(() => buildDungeonRun(dungeonId), [dungeonId]);

    const [step, setStep] = useState<Step>("pick");

    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
    const selectedChar = useMemo(() => MOCK_MY_CHARS.find((c) => c.id === selectedCharId) ?? null, [selectedCharId]);

    const logRef = useRef<HTMLDivElement | null>(null);
    const stickToBottomRef = useRef(true); // 사용자가 바닥 근처인지
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);

    const [battleLog, setBattleLog] = useState<string[]>([
        "던전에 입장했습니다.",
        "몬스터가 전투 태세를 갖춥니다.",
        "— 전투 시작 대기 —",
    ]);
    const [lootOpen, setLootOpen] = useState(false);

    const isBossCleared = false; // TODO: 나중에 로직으로

    const onEnter = () => {
        if (!selectedChar) return;
        setStep("battle");
        setBattleLog((prev) => [
            ...prev,
            `선택: ${selectedChar.name} (Lv.${selectedChar.level} ${selectedChar.job})`,
            "전투 준비 완료.",
        ]);
    };

    const onFight = () => {
        setBattleLog((prev) => [...prev, "전투 로직 실행(서버) 요청 예정…", "현재는 UI 데모 상태입니다."]);
    };

    const onEscapeOrReturn = () => {
        setBattleLog((prev) => [
            ...prev,
            isBossCleared ? "귀환했습니다. (보스 처치 완료)" : "도망쳤습니다. (중도 이탈)",
        ]);
    };

    const onLogScroll = () => {
        const el = logRef.current;
        if (!el) return;

        const threshold = 24; // 바닥 판정(픽셀)
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const atBottom = distanceFromBottom < threshold;

        stickToBottomRef.current = atBottom;
        setShowJumpToLatest(!atBottom);
    };

    const jumpToLatest = () => {
        const el = logRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        stickToBottomRef.current = true;
        setShowJumpToLatest(false);
    };

    useEffect(() => {
        const el = logRef.current;
        if (!el) return;

        if (stickToBottomRef.current) {
            el.scrollTop = el.scrollHeight;
            setShowJumpToLatest(false);
        } else {
            setShowJumpToLatest(true);
        }
    }, [battleLog]);

    useEffect(() => {
        const prev = prevLogLen.current;
        const cur = battleLog.length;
        prevLogLen.current = cur;

        // 초기 렌더/리셋은 제외
        if (prev === 0) return;

        // 새 로그가 "추가"되었을 때만
        if (cur > prev) {
            // ✅ 아래 근처일 때만 펄스
            if (!showJumpToLatest) {
                setGlowPulse(true);
                const t = setTimeout(() => setGlowPulse(false), PULSE_MS);
                return () => clearTimeout(t);
            }
        }
    }, [battleLog, showJumpToLatest]);

    // ===== STEP 1: 캐릭터 선택 =====
    if (step === "pick") {
        return (
            <main className="min-h-[calc(100vh-56px)] bg-slate-950 text-slate-100 px-6 py-10">
                <div className="mx-auto max-w-5xl">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold">입장 준비</h1>
                            <p className="mt-1 text-sm text-slate-400">
                                던전: <span className="text-white/90 font-semibold">{dungeonRun.dungeonTitle}</span>
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                        >
                            ← 돌아가기
                        </button>
                    </div>

                    <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                        {MOCK_MY_CHARS.map((c) => {
                            const picked = c.id === selectedCharId;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedCharId(c.id)}
                                    className={[
                                        "group relative overflow-hidden rounded-2xl border bg-slate-900/30",
                                        "border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition hover:-translate-y-1",
                                        picked ? "ring-1 ring-amber-400/50 border-amber-400/30" : "",
                                    ].join(" ")}
                                >
                                    <div className="relative h-36 w-full overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.22),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.18),transparent_50%)]" />
                                        <div className="absolute inset-0 bg-black/35" />
                                        <div className="relative z-10 flex h-full items-end justify-center pb-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={c.portrait}
                                                alt={c.name}
                                                className="h-[120px] object-contain drop-shadow-[0_14px_32px_rgba(0,0,0,0.75)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="px-3 pb-3 pt-2 text-left">
                                        <div className="text-sm font-semibold truncate">{c.name}</div>
                                        <div className="mt-1 text-xs text-slate-300/90 truncate">
                                            {c.serverId} · Lv.{c.level} {c.job}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {c.tags.slice(0, 3).map((t) => (
                                                <TagPill key={t} t={t} />
                                            ))}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </section>

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onEnter}
                            disabled={!selectedChar}
                            className={[
                                "rounded-md px-4 py-2 text-sm font-semibold",
                                selectedChar ? "bg-amber-400 text-black hover:bg-amber-300" : "bg-white/10 text-slate-400 cursor-not-allowed",
                            ].join(" ")}
                            title={!selectedChar ? "캐릭터를 선택하세요" : ""}
                        >
                            입장하기
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // ===== STEP 2: 전투 화면 =====
    return (
        <main className="h-[calc(100vh-56px)] bg-slate-950 text-slate-100 px-6 py-6 overflow-hidden">
            <div className="mx-auto max-w-6xl h-full flex flex-col gap-6">
                {/* 상단 */}
                <header className="rounded-2xl border border-white/10 bg-slate-900/20 px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center justify-between gap-4">
                        {/* left */}
                        <div className="min-w-0">
                            <div className="text-[12px] text-slate-400">던전</div>
                            <div className="mt-0.5 text-base font-semibold truncate">{dungeonRun.dungeonTitle}</div>
                        </div>

                        {/* center */}
                        <div className="flex items-center gap-3">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold tabular-nums">
                                {dungeonRun.floorIndex}/{dungeonRun.floorTotal}
                            </span>

                            <button
                                type="button"
                                onClick={onFight}
                                className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-black hover:bg-amber-300"
                            >
                                전투하기
                            </button>
                            <button
                                type="button"
                                onClick={onEscapeOrReturn}
                                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
                            >
                                {isBossCleared ? "귀환" : "도망"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setLootOpen(true)}
                                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
                            >
                                보물상자
                            </button>
                        </div>

                        {/* right */}
                        <div className="hidden md:block text-right">
                            <div className="text-[12px] text-slate-400">상태</div>
                            <div className="mt-0.5 text-sm text-slate-300/80">서버 로직 기반 (UI 데모)</div>
                        </div>
                    </div>
                </header>

                {/* ✅ 좌/우 + 중앙 VS (중요: flex-1 제거해서 상황판이 커질 공간 확보) */}
                <section className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] min-h-0 items-stretch">
                    {/* 내 캐릭터 */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/25 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                            {/* 왼쪽: 설명/정보 */}
                            <div className="min-w-0">
                                <div className="text-lg font-semibold truncate">{selectedChar?.name ?? "—"}</div>
                                <div className="mt-1 text-sm text-slate-400 truncate">
                                    {selectedChar?.serverId} · Lv.{selectedChar?.level ?? "?"} {selectedChar?.job ?? ""}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {selectedChar?.tags?.map((t) => <TagPill key={t} t={t} />) ?? null}
                                </div>
                            </div>

                            {/* 오른쪽(중앙 쪽): 사진 + HP + 미니 스탯 */}
                            <div className="flex items-start gap-4">
                                <div className="text-right">
                                    <div className="text-[11px] text-slate-400">HP</div>
                                    <div className="text-sm font-semibold tabular-nums text-white/90">{selectedChar?.stats.hp ?? 0}</div>

                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 w-[240px]">
                                        <MiniStat label="공" value={selectedChar?.stats.power ?? 0} />
                                        <MiniStat label="방" value={selectedChar?.stats.defense ?? 0} />
                                        <MiniStat label="속" value={selectedChar?.stats.speed ?? 0} />
                                        <MiniStat label="제" value={selectedChar?.stats.control ?? 0} />
                                        <MiniStat label="폭" value={selectedChar?.stats.burst ?? 0} />
                                        <MiniStat label="유" value={selectedChar?.stats.sustain ?? 0} />
                                    </div>
                                </div>

                                <Portrait src={selectedChar?.portrait} alt={selectedChar?.name ?? "내 캐릭터"} />
                            </div>
                        </div>
                    </div>

                    {/* ✅ 중앙: VS + 라인 + 미세 글로우 */}
                    <div className="hidden md:flex w-16 items-center justify-center relative">
                        <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-px bg-white/10" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
                        <div className="relative z-10 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-bold tracking-widest text-white/90 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                            VS
                        </div>
                    </div>

                    {/* 몬스터 */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/25 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                        <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                            {/* 왼쪽(중앙 쪽): 사진 */}
                            <Portrait src={dungeonRun.monster.portrait} alt={dungeonRun.monster.name} />

                            {/* 오른쪽: 설명/정보 + 스탯 */}
                            <div className="min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-lg font-semibold truncate">{dungeonRun.monster.name}</div>
                                        <div className="mt-1 text-sm text-slate-400 truncate">Lv.{dungeonRun.monster.level}</div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-[11px] text-slate-400">HP</div>
                                        <div className="text-sm font-semibold tabular-nums text-white/90">{dungeonRun.monster.stats.hp}</div>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1">
                                    {dungeonRun.monster.tags.map((t) => (
                                        <TagPill key={t} t={t} />
                                    ))}
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                                    <MiniStat label="공" value={dungeonRun.monster.stats.power} />
                                    <MiniStat label="방" value={dungeonRun.monster.stats.defense} />
                                    <MiniStat label="속" value={dungeonRun.monster.stats.speed} />
                                    <MiniStat label="제" value={dungeonRun.monster.stats.control} />
                                    <MiniStat label="폭" value={dungeonRun.monster.stats.burst} />
                                    <MiniStat label="유" value={dungeonRun.monster.stats.sustain} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ✅ 전투 상황판: 남는 공간 전부 먹기 */}
                <section className="rounded-2xl border border-white/10 bg-slate-900/25 px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex-1 min-h-0">
                    {/* 로그 컨테이너 (버튼을 띄우기 위한 relative) */}
                    <div className="relative h-full min-h-0 rounded-xl border border-white/10 bg-black/20">

                        {/* ✅ 하단 페이드/글로우 */}
                        <div
                            className={[
                                "pointer-events-none absolute inset-x-0 bottom-0 h-16",
                                "bg-gradient-to-t from-amber-400/12 via-amber-400/0 to-transparent",
                                "opacity-70 transition-opacity duration-300",
                                glowPulse ? "opacity-100" : "opacity-70",
                            ].join(" ")}
                        />

                        {/* ✅ 글로우 링(펄스 순간만 살짝) */}
                        <div
                            className={[
                                "pointer-events-none absolute inset-0 rounded-xl",
                                "transition duration-300",
                                glowPulse ? "ring-1 ring-amber-400/30" : "ring-0",
                            ].join(" ")}
                        />

                        {/* ↓ 최신 로그 버튼 */}
                        {showJumpToLatest && (
                            <button
                                type="button"
                                onClick={jumpToLatest}
                                className="
    absolute right-7 bottom-3 z-10
    rounded-full
    border border-white/10
    bg-slate-950/70
    px-3 py-1.5
    text-xs text-white/90
    backdrop-blur
    transition
    hover:bg-slate-950/85
    hover:border-amber-400/40
    hover:shadow-[0_0_12px_rgba(245,158,11,0.35)]
    hover:ring-1 hover:ring-amber-400/40
  "
                            >
                                ↓ 최신 로그
                            </button>
                        )}

                        {/* 스크롤 영역 */}
                        <div
                            ref={logRef}
                            onScroll={onLogScroll}
                            className="h-full min-h-0 overflow-auto px-4 pt-3 pb-6"
                        >
                            <div className="space-y-2 text-sm text-slate-200/90">
                                {battleLog.map((line, idx) => (
                                    <div key={idx} className="leading-relaxed">
                                        <span className="text-slate-500 tabular-nums mr-2">
                                            {String(idx + 1).padStart(2, "0")}
                                        </span>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            {/* 보물상자 */}
            {lootOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">보물상자</h2>
                                <div className="mt-1 text-sm text-slate-400">현재까지 획득한 보상</div>
                            </div>
                            <button onClick={() => setLootOpen(false)} className="rounded-md px-2 py-1 text-slate-400 hover:bg-white/10">
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                            <ul className="space-y-2 text-sm">
                                {dungeonRun.lootSoFar.map((l) => (
                                    <li key={l.id} className="flex items-center justify-between">
                                        <span className="text-slate-200">{l.name}</span>
                                        <span className="text-slate-400 tabular-nums">x{l.qty}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setLootOpen(false)}
                                className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
