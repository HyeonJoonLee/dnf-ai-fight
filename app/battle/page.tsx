// app/battle/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DungeonItemModal from "@/components/DungeonItemModal";
import { useRouter } from "next/navigation";

type DungeonType = "PVE" | "PVP";

type DungeonItem = {
    id: string;
    name: string;
    level?: string;
    image?: string;
    bgImage?: string;
    description?: string;
};

type Dungeon = {
    id: string;
    type: DungeonType;
    title: string;
    subtitle: string;
    recommendedLevel: string;
    monsters: DungeonItem[];
    rewards: DungeonItem[];
    difficulty: "쉬움" | "보통" | "어려움" | "지옥";

    image: string;
};

const DUNGEONS: Dungeon[] = [
    {
        id: "pve-1",
        type: "PVE",
        title: "망각의 숲",
        subtitle: "초급 던전",
        recommendedLevel: "Lv. 00~40",
        image: "/character-bg/bg-a.png",
        monsters: [
            {
                id: "m1",
                name: "길 잃은 고블린",
                level: "Lv.10",
                image: "/images/monsters/m1_goblin.png",
                bgImage: "/character-bg/bg-a.png",
                description: "자신의 몸보다 큰 헐렁하고 낡은 가죽 옷을 입고 있습니다."
            },
            {
                id: "m2",
                name: "심술궂은 묘목",
                level: "Lv.15",
                image: "/images/monsters/m2_sapling.png",
                bgImage: "/character-bg/bg-a.png",
                description: "갓 땅에서 뽑혀 나온듯한 걸어 다니는 나무 그루터기입니다."
            },
            {
                id: "m3",
                name: "안개 슬라임",
                level: "Lv.30",
                image: "/images/monsters/m3_slime.png",
                bgImage: "/character-bg/bg-a.png",
                description: "반투명한 회색빛 젤리 형태인데, 몸 안에서 희뿌연 안개가 소용돌이치고 있습니다."
            },
        ],
        rewards: [
            {
                id: "i1",
                name: "녹슨 나침반",
                level: "흔함",
                image: "/images/items/i1_compass.png",
                bgImage: "/character-bg/bg-a.png",
                description: "유리가 깨져 있고 바늘이 제멋대로 빙글빙글 돌아가는 낡은 나침반입니다. 고블린들이 왜 숲에서 길을 잃고 헤매는지 알 것 같습니다."
            },
            {
                id: "i2",
                name: "단단한 옹이",
                level: "흔함",
                image: "/images/items/i2_knothole.png",
                bgImage: "/character-bg/bg-a.png",
                description: "묘목의 몸통에서 떨어져 나온 단단한 나무 뭉치입니다. 돌처럼 딱딱해서 가공하면 꽤 쓸만할 것 같습니다."
            },
            {
                id: "i3",
                name: "차가운 안개 방울",
                level: "Lv.95",
                image: "/images/items/i3_mist.png",
                bgImage: "/character-bg/bg-a.png",
                description: "슬라임의 몸을 구성하던 안개가 응축되어 물방울처럼 맺혔습니다. 만지면 얼음처럼 차갑고 살짝 끈적거립니다."
            },
        ],
        difficulty: "쉬움",
    },
    {
        id: "pve-2",
        type: "PVE",
        title: "벚꽃 연무 회랑",
        subtitle: "중급 던전",
        recommendedLevel: "Lv. 40~70",
        image: "/character-bg/bg-b.png",
        monsters: [
            {
                id: "m1",
                name: "심연의 사제",
                level: "Lv.95",
                image: "/images/monsters/abyss-priest.png",
                description: "어둠의 제단을 수호하는 광신도"
            }
        ],
        rewards: [
            {
                id: "m1",
                name: "심연의 사제",
                level: "Lv.95",
                image: "/images/monsters/abyss-priest.png",
                description: "어둠의 제단을 수호하는 광신도"
            }
        ],
        difficulty: "보통",
    },
    {
        id: "pve-3",
        type: "PVE",
        title: "거미 무덤",
        subtitle: "고급 던전",
        recommendedLevel: "Lv. 70~110+",
        image: "/character-bg/bg-c.jpg",
        monsters: [
            {
                id: "m1",
                name: "심연의 사제",
                level: "Lv.95",
                image: "/images/monsters/abyss-priest.png",
                description: "어둠의 제단을 수호하는 광신도"
            }
        ],
        rewards: [
            {
                id: "m1",
                name: "심연의 사제",
                level: "Lv.95",
                image: "/images/monsters/abyss-priest.png",
                description: "어둠의 제단을 수호하는 광신도"
            }
        ],
        difficulty: "어려움",
    },
    {
        id: "pvp-1",
        type: "PVP",
        title: "무명의 결투장",
        subtitle: "비동기 PVP",
        recommendedLevel: "Lv. 1~ (전 구간)",
        image: "/character-bg/bg-d.jpg",
        monsters: [
            {
                id: "m1",
                name: "심연의 사제",
                level: "Lv.95",
                image: "/images/monsters/abyss-priest.png",
                description: "어둠의 제단을 수호하는 광신도"
            }
        ],
        rewards: [
            {
                id: "m1",
                name: "심연의 사제",
                level: "Lv.95",
                image: "/images/monsters/abyss-priest.png",
                description: "어둠의 제단을 수호하는 광신도"
            }
        ],
        difficulty: "지옥",
    },
];

// -2,-1,0,1,2 상대 위치 스타일(가운데 0이 포커스)
// 4개라 항상 3개만 보이게 하려면 |offset| <= 1만 보여도 되지만,
// “큐 느낌”을 위해 ±2는 거의 안 보이게(투명/뒤) 처리
const SLOT_STYLE = {
    "-2": {
        translateX: "-180%",
        scale: "0.62",
        rotateY: "35deg",
        opacity: "0",
        blur: "blur(6px)",
        z: 0,
    },
    "-1": {
        translateX: "-88%",
        scale: "0.84",
        rotateY: "22deg",
        opacity: "0.55",
        blur: "blur(1.5px)",
        z: 10,
    },
    "0": {
        translateX: "0%",
        scale: "1",
        rotateY: "0deg",
        opacity: "1",
        blur: "blur(0px)",
        z: 30,
    },
    "1": {
        translateX: "88%",
        scale: "0.84",
        rotateY: "-22deg",
        opacity: "0.55",
        blur: "blur(1.5px)",
        z: 10,
    },
    "2": {
        translateX: "180%",
        scale: "0.62",
        rotateY: "-35deg",
        opacity: "0",
        blur: "blur(6px)",
        z: 0,
    },
} as const;

function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

function offsetFromCenter(index: number, center: number, len: number) {
    // 원형에서 center 기준으로 -2..2 중 가장 가까운 offset 선택
    const raw = index - center;
    const a = raw;
    const b = raw + len;
    const c = raw - len;

    const best = [a, b, c].sort((x, y) => Math.abs(x) - Math.abs(y))[0];
    // 4개면 best는 -2..2 안으로 자연스럽게 들어옴
    return Math.max(-2, Math.min(2, best));
}

export default function BattlePage() {
    const router = useRouter();
    const items = DUNGEONS;
    const len = items.length;

    const [center, setCenter] = useState(0);

    const active = useMemo(() => items[center], [center, items]);

    const dragRef = useRef<HTMLDivElement | null>(null);
    const startX = useRef<number | null>(null);
    const dragging = useRef(false);

    const goLeft = () => setCenter((c) => mod(c - 1, len));
    const goRight = () => setCenter((c) => mod(c + 1, len));

    const [selectedItem, setSelectedItem] = useState<{
        name: string;
        level?: string;
        image?: string;
        description?: string;
    } | null>(null);

    // 마우스 드래그(휠피커 느낌): 임계값 넘으면 한 칸 이동
    useEffect(() => {
        const el = dragRef.current;
        if (!el) return;

        const TH = 50; // 드래그 임계값(px)

        const onDown = (e: PointerEvent) => {
            dragging.current = true;
            startX.current = e.clientX;
            (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
        };

        const onMove = (e: PointerEvent) => {
            if (!dragging.current || startX.current == null) return;
            const dx = e.clientX - startX.current;

            if (dx > TH) {
                startX.current = e.clientX;
                goLeft();
            } else if (dx < -TH) {
                startX.current = e.clientX;
                goRight();
            }
        };

        const onUp = () => {
            dragging.current = false;
            startX.current = null;
        };

        el.addEventListener("pointerdown", onDown);
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
        el.addEventListener("pointerleave", onUp);

        return () => {
            el.removeEventListener("pointerdown", onDown);
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerup", onUp);
            el.removeEventListener("pointercancel", onUp);
            el.removeEventListener("pointerleave", onUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [len]);

    useEffect(() => {
        if (selectedItem) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [selectedItem]);

    return (
        <main className="min-h-[calc(100vh-56px)] bg-slate-950 text-slate-100 px-6 py-10">
            <div className="mx-auto max-w-5xl">
                <header className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold">전투하기</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            던전을 선택하고, 가운데 카드가 포커스됩니다. (화살표/드래그 이동)
                        </p>
                    </div>
                </header>

                {/* 큐/휠피커 영역 */}
                <section className="mt-8">
                    <div className="relative">
                        {/* 좌우 화살표 */}
                        <button
                            type="button"
                            onClick={goLeft}
                            className="absolute left-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10"
                            aria-label="왼쪽"
                        >
                            ◀
                        </button>
                        <button
                            type="button"
                            onClick={goRight}
                            className="absolute right-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10"
                            aria-label="오른쪽"
                        >
                            ▶
                        </button>

                        {/* 카드 트랙 */}
                        <div
                            ref={dragRef}
                            className="relative mx-auto h-[280px] select-none"
                            style={{ perspective: "1000px" }}
                        >
                            {items.map((d, i) => {
                                const off = offsetFromCenter(i, center, len); // -2..2
                                const s = SLOT_STYLE[String(off) as keyof typeof SLOT_STYLE];

                                const isCenter = off === 0;

                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => setCenter(i)}
                                        className="absolute left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2"
                                        style={{
                                            zIndex: s.z,
                                            transformStyle: "preserve-3d",
                                            transform: `translateX(${s.translateX}) translateZ(0px) scale(${s.scale}) rotateY(${s.rotateY})`,
                                            opacity: s.opacity as any,
                                            filter: s.blur,
                                            transition:
                                                "transform 380ms cubic-bezier(.2,.8,.2,1), opacity 260ms ease, filter 260ms ease",
                                        }}
                                    >
                                        <div
                                            className={[
                                                "relative overflow-hidden rounded-2xl border border-white/10",
                                                "bg-slate-900/35 shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
                                                isCenter ? "ring-1 ring-amber-400/40" : "",
                                            ].join(" ")}
                                        >
                                            {/* 상단 비주얼 */}
                                            <div className="relative h-36 w-full overflow-hidden">
                                                {/* 던전 이미지 */}
                                                <div
                                                    className={[
                                                        "absolute inset-0 bg-cover bg-center transition-transform duration-300",
                                                        isCenter ? "scale-105" : "scale-100",
                                                    ].join(" ")}
                                                    style={{ backgroundImage: `url(${d.image})` }}
                                                />

                                                {/* 어두운 오버레이 */}
                                                <div className="absolute inset-0 bg-black/45" />

                                                {/* 포커스 강조용 그라데이션 */}
                                                {isCenter && (
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                                )}
                                            </div>

                                            <div className="relative px-4 pb-4 pt-3 text-left">
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={[
                                                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                                            d.type === "PVP"
                                                                ? "bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/20"
                                                                : "bg-emerald-500/15 text-emerald-200 border border-emerald-500/20",
                                                        ].join(" ")}
                                                    >
                                                        {d.type}
                                                    </span>
                                                    <span className="text-[11px] text-slate-300/80">
                                                        난이도: <span className="text-white/90">{d.difficulty}</span>
                                                    </span>
                                                </div>

                                                <div className="mt-2">
                                                    <div className="text-base font-semibold tracking-tight">{d.title}</div>
                                                    <div className="mt-0.5 text-xs text-slate-300/80">{d.subtitle}</div>
                                                </div>

                                                <div className="mt-3 text-xs text-slate-300/90">
                                                    권장 레벨:{" "}
                                                    <span className="text-white/95 font-semibold">{d.recommendedLevel}</span>
                                                </div>

                                                {isCenter && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="text-[11px] text-slate-400">
                                                            선택됨
                                                        </span>
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                                        <span className="text-[11px] text-amber-200">
                                                            아래 정보창에서 상세 확인
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 아래 점 인디케이터(옵션) */}
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCenter(i)}
                                    className={[
                                        "h-2 w-2 rounded-sm transition",
                                        i === center ? "bg-amber-400" : "bg-white/15 hover:bg-white/25",
                                    ].join(" ")}
                                    aria-label={`던전 ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* 아래 정보 패널 */}
                <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/25 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm text-slate-300/90">선택된 던전</div>
                            <div className="mt-1 text-lg font-semibold">{active.title}</div>
                            <div className="mt-1 text-sm text-slate-400">{active.subtitle}</div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs text-slate-400">권장 레벨</div>
                            <div className="mt-1 text-sm font-semibold text-white/95">
                                {active.recommendedLevel}
                            </div>
                            <div className="mt-2 text-xs text-slate-400">타입</div>
                            <div className="mt-1 text-sm font-semibold">
                                <span
                                    className={[
                                        "rounded-md px-2 py-1 text-xs font-semibold",
                                        active.type === "PVP"
                                            ? "bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/20"
                                            : "bg-emerald-500/15 text-emerald-200 border border-emerald-500/20",
                                    ].join(" ")}
                                >
                                    {active.type}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="text-sm font-semibold">출현 몬스터</div>
                            <ul className="mt-2 space-y-1 text-sm text-slate-200/90">
                                {active.monsters.map((m) => (
                                    <li key={m.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedItem(m)}
                                            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-white/10"
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                                            <span className="underline-offset-2 hover:underline">{m.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="text-sm font-semibold">보상/특징</div>
                            <ul className="mt-2 space-y-1 text-sm text-slate-200/90">
                                {active.rewards.map((r) => (
                                    <li key={r.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedItem(r)}
                                            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-white/10"
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                                            <span className="underline-offset-2 hover:underline">{r.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.push(`/battle/enter?dungeonId=${active.id}`)}
                            className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
                        >
                            입장하기
                        </button>
                    </div>
                </section>
            </div>
            {/* ✅ 몬스터 / 보상 상세 모달 */}
            <DungeonItemModal
                open={!!selectedItem}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </main>
    );
}
