// app/me/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import RegisterCharacterModal from "@/components/RegisterCharacterModal";
import CharacterDetailModal from "@/components/CharacterDetailModal";
import { CHARACTER_BACKGROUNDS, type CharacterBgKey } from "@/src/constants/characterBackgrounds";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LS_PREFIX = "dnfai:myCharacters:v2";

type MyCharacter = {
    id: string;
    serverId: string;
    characterName: string;
    jobName?: string;
    level?: number;
    imageUrl?: string;
    analysis?: string;   // 전투 성향 텍스트 (없으면 "아직 분석 안 됨")
    wins?: number;       // 승리 수 (기본 0)

    battleTags?: string[]; // ✅ 추가
    battleStats?: {
        hp: number;
        power: number;
        defense: number;
        speed: number;
        physical: number;
        magic: number;
        range: number;
    }
};

export default function MyPage() {
    const [characters, setCharacters] = useState<MyCharacter[]>([]);

    const [open, setOpen] = useState(false);

    const [selected, setSelected] = useState<MyCharacter | null>(null);

    const maxSlots = 10;
    const activeSlots = 4;

    const [hydrated, setHydrated] = useState(false);

    const { data: session, status } = useSession();
    const isAuthed = status === "authenticated";

    const userKey = session?.user?.email ?? session?.user?.name ?? "guest";
    const LS_KEY = `${LS_PREFIX}:${userKey}`;

    const [serverLoaded, setServerLoaded] = useState(false);

    useEffect(() => {
        // 로그인 전/세션 로딩 중엔 건드리지 않기
        if (status === "loading") return;

        setHydrated(false); // 유저 바뀌면 다시 로드 플래그 리셋
        setServerLoaded(false);
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setCharacters(parsed);
                else setCharacters([]);
            } else {
                setCharacters([]);
            }
        } catch (e) {
            console.warn("Failed to load characters", e);
            setCharacters([]);
        } finally {
            setHydrated(true);
        }
    }, [LS_KEY, status]);

    useEffect(() => {
        if (!hydrated) return;
        if (status === "loading") return;
        if (status !== "authenticated") return;

        // ✅ 서버에서 한 번이라도 받아온 다음에만 저장 (덮어쓰기 방지)
        if (!serverLoaded) return;

        try {
            localStorage.setItem(LS_KEY, JSON.stringify(characters));
        } catch (e) {
            console.warn("Failed to save characters", e);
        }
    }, [characters, hydrated, LS_KEY, status, serverLoaded]);

    // 슬롯 데이터 구성
    const slots = useMemo(() => {
        const arr: Array<
            | { type: "char"; char: MyCharacter; slotIndex: number }
            | { type: "empty"; slotIndex: number }
            | { type: "locked"; slotIndex: number }
        > = [];

        for (let i = 0; i < maxSlots; i++) {
            if (i < activeSlots) {
                const char = characters[i];
                if (char) arr.push({ type: "char", char, slotIndex: i });
                else arr.push({ type: "empty", slotIndex: i });
            } else {
                arr.push({ type: "locked", slotIndex: i });
            }
        }

        return arr;
    }, [characters]);

    function handleClickEmptySlot() {
        if (!isAuthed) return; // 헤더에서 이미 막겠지만 안전장치
        setOpen(true);
    }

    function handleRegistered(newChar: MyCharacter) {
        // 빈 슬롯 중 첫 번째에 추가
        setCharacters((prev) => {
            const next = [...prev];
            // 최대 4개까지만
            if (next.length >= activeSlots) return prev;
            next.push(newChar);
            return next;
        });
        setOpen(false);
    }

    useEffect(() => {
        if (status !== "authenticated") return;

        (async () => {
            try {
                const res = await fetch("/api/my/characters", { cache: "no-store" });
                const raw = await res.text();
                const data = raw ? JSON.parse(raw) : null;

                if (!res.ok) {
                    console.error("GET /api/my/characters failed:", res.status, data);
                    return;
                }

                setCharacters(data?.characters ?? []);
                setServerLoaded(true);
            } catch (e) {
                console.error("Failed to load characters:", e);
            }
        })();
    }, [status]);

    async function handleDeleteCharacter(id: string) {
        const ok = confirm("정말 삭제할까? (복구 불가)");
        if (!ok) return;

        try {
            const res = await fetch(`/api/my/characters/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "삭제 실패");
                return;
            }

            // ✅ 상태에서 제거 → 슬롯이 빈칸(+)으로 바뀜
            setCharacters((prev) => prev.filter((c) => c.id !== id));
            setSelected(null);
        } catch {
            alert("삭제 중 오류 발생");
        }
    }

    function CharacterSlotCard({ char, onClick }: { char: MyCharacter; onClick: () => void }) {
        const LS_BG_KEY = `dnfai:character-bg:${char.id}`;

        const [bgKey, setBgKey] = useState<CharacterBgKey>("A");

        useEffect(() => {
            const saved = localStorage.getItem(LS_BG_KEY) as CharacterBgKey | null;
            if (saved && CHARACTER_BACKGROUNDS.some((b) => b.key === saved)) setBgKey(saved);
        }, [LS_BG_KEY]);

        const bg = CHARACTER_BACKGROUNDS.find((b) => b.key === bgKey) ?? CHARACTER_BACKGROUNDS[0];
        return (
            <button
                type="button"
                onClick={onClick}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/30
                 shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition hover:-translate-y-1"
            >
                {/* ✅ 상단 배경만 채우기 */}
                <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${bg.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: bg.position,
                        }}
                    />
                    <div className="absolute inset-0 bg-slate-950/35" />

                    {/* 캐릭터 */}
                    <div className="relative z-10 flex h-full items-end justify-center pb-2">
                        {char.imageUrl ? (
                            <img
                                src={char.imageUrl}
                                alt={char.characterName}
                                className="
                                          h-[180px]
                                          object-contain
                                          drop-shadow-[0_14px_32px_rgba(0,0,0,0.75)]
                                          transition-transform ease-in-out hover:scale-120
                                        "
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-xl bg-slate-800" />
                        )}
                    </div>
                </div>

                {/* 이름/정보 */}
                <div className="px-3 pb-3 pt-2">
                    <div className="text-sm font-semibold truncate">{char.characterName}</div>
                    <div className="mt-1 text-xs text-slate-300/90 truncate">
                        {char.serverId} · Lv.{char.level ?? "?"} {char.jobName ?? ""}
                    </div>
                    <div className="mt-2 text-xs text-amber-300 font-semibold">Wins {char.wins ?? 0}</div>
                </div>
            </button>
        );
    }

    return (
        <main className="min-h-[calc(100vh-56px)] bg-slate-950 text-slate-100 px-6 py-10">
            <div className="mx-auto max-w-5xl">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold">내 캐릭터</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            최대 4개의 캐릭터를 등록할 수 있어요.
                        </p>
                    </div>

                    <div className="text-xs text-slate-400">
                        {characters.length}/{activeSlots} 사용 중
                    </div>
                </div>

                {/* 슬롯 그리드 */}
                <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                    {slots.map((slot) => {
                        if (slot.type === "char") {
                            return (
                                <CharacterSlotCard
                                    key={slot.slotIndex}
                                    char={slot.char}
                                    onClick={() => setSelected(slot.char)}
                                />
                            );
                        }

                        if (slot.type === "empty") {
                            return (
                                <Card key={slot.slotIndex} className="flex aspect-[3/4] items-center justify-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-24 w-24 rounded-2xl text-4xl"
                                        onClick={handleClickEmptySlot}
                                    >
                                        +
                                    </Button>
                                </Card>
                            );
                        }

                        return (
                            <Card
                                key={slot.slotIndex}
                                className="flex aspect-[3/4] items-center justify-center opacity-60"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-3xl">🔒</div>
                                    <div className="text-[11px] text-slate-400">슬롯 확장 예정</div>
                                </div>
                            </Card>
                        );
                    })}
                </section>
            </div>

            {/* 등록 모달 */}
            {open && (
                <RegisterCharacterModal
                    onClose={() => setOpen(false)}
                    onRegistered={handleRegistered}
                    existingCharacters={characters.map(c => ({
                        id: c.id,
                        serverId: c.serverId,
                        characterName: c.characterName,
                    }))}
                />
            )}

            {/* 상세 모달 */}
            {selected && (
                <CharacterDetailModal
                    character={selected}
                    onClose={() => setSelected(null)}
                    onDelete={handleDeleteCharacter}
                />
            )}
        </main>

    );
}
