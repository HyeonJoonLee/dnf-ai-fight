"use client";

import Image from "next/image";

type Props = {
    open: boolean;
    onClose: () => void;
    item: {
        name: string;
        level?: string;
        image?: string;
        bgImage?: string;
        description?: string;
    } | null;
};

export default function DungeonItemModal({ open, onClose, item }: Props) {
    if (!open || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl">
                {/* 헤더 */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">{item.name}</h2>
                        {item.level && (
                            <div className="mt-1 text-sm text-slate-400">{item.level}</div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-slate-400 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                {/* 이미지 */}
                {item.image && (
                    <div className="relative mt-4 h-48 w-full overflow-hidden rounded-xl">
                        {/* 배경 이미지 */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${item.bgImage})` }}
                        />

                        {/* 어두운 오버레이(가독성용) */}
                        <div className="absolute inset-0 bg-black/45" />

                        {/* (선택) 비네팅/그라데이션 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                        {/* 실제 몬스터/아이템 이미지 */}
                        {item.image && (
                            <img
                                src={item.image}
                                alt={item.name}
                                className="relative z-10 mx-auto h-full object-contain p-4 drop-shadow-[0_16px_30px_rgba(0,0,0,0.6)]"
                            />
                        )}
                    </div>
                )}

                {/* 설명 */}
                {item.description && (
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">
                        {item.description}
                    </p>
                )}
            </div>
        </div>
    );
}
