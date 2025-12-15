// app/me/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import RegisterCharacterModal from "@/components/RegisterCharacterModal";
import CharacterDetailModal from "@/components/CharacterDetailModal";

const LS_PREFIX = "dnfai:myCharacters:v1";

type MyCharacter = {
    id: string;
    serverId: string;
    characterName: string;
    jobName?: string;
    level?: number;
    imageUrl?: string;
    analysis?: string;   // 전투 성향 텍스트 (없으면 "아직 분석 안 됨")
    wins?: number;       // 승리 수 (기본 0)
};

export default function MyPage() {
    // 나중에 API로 내 캐릭터 목록 가져오면 이 state를 채우면 됨
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


    useEffect(() => {
        // 로그인 전/세션 로딩 중엔 건드리지 않기
        if (status === "loading") return;

        setHydrated(false); // 유저 바뀌면 다시 로드 플래그 리셋
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

        try {
            localStorage.setItem(LS_KEY, JSON.stringify(characters));
        } catch (e) {
            console.warn("Failed to save characters", e);
        }
    }, [characters, hydrated, LS_KEY, status]);

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
                const data = await res.json();
                if (!res.ok) {
                    console.error("GET /api/my/characters failed:", data);
                    return;
                }
                setCharacters(data.characters ?? []);
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
                                <div
                                    key={slot.slotIndex}
                                    onClick={() => setSelected(slot.char)}
                                    className="group relative rounded-2xl cursor-pointer
                                            bg-gradient-to-b from-indigo-600/90 to-indigo-700/90
                                            border border-white/10
                                            shadow-[0_8px_24px_rgba(0,0,0,0.35)]
                                            transition-all duration-200
                                            hover:-translate-y-1
                                            hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                                >
                                    <div className="flex h-40 items-center justify-center">
                                        {slot.char.imageUrl ? (
                                            <img
                                                src={slot.char.imageUrl}
                                                alt={slot.char.characterName}
                                                className="max-h-full
                                                        scale-125
                                                        object-contain
                                                        drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]
                                                        transition-transform
                                                        duration-200
                                                        group-hover:scale-135"
                                            />
                                        ) : (
                                            <div className="h-24 w-24 rounded-xl bg-slate-900/40" />
                                        )}
                                    </div>
                                    <div className="px-3 py-3 border-t border-white/10">
                                        <div className="text-sm font-semibold truncate">
                                            {slot.char.characterName}
                                        </div>
                                        <div className="text-xs text-slate-200/80 truncate">
                                            {slot.char.serverId} · Lv.{slot.char.level ?? "?"}{" "}
                                            {slot.char.jobName ?? ""}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        if (slot.type === "empty") {
                            return (
                                <button
                                    key={slot.slotIndex}
                                    type="button"
                                    onClick={handleClickEmptySlot}
                                    className="aspect-[3/4] rounded-3xl bg-indigo-500/50 border border-indigo-300/20 flex items-center justify-center text-4xl text-white/90 hover:bg-indigo-500/60 transition"
                                //title="캐릭터 등록"
                                >
                                    +
                                </button>
                            );
                        }

                        // locked
                        return (
                            <div
                                key={slot.slotIndex}
                                className="aspect-[3/4] rounded-3xl bg-indigo-500/30 border border-indigo-300/10 flex items-center justify-center text-4xl opacity-70"
                            //title="유료 플랜에서 확장 가능"
                            >
                                🔒
                            </div>
                        );
                    })}
                </section>
            </div>

            {/* 등록 모달 */}
            {open && (
                <RegisterCharacterModal
                    onClose={() => setOpen(false)}
                    onRegistered={handleRegistered}
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
