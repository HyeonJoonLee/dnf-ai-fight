// components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/", label: "메인", disabled: false },
    // 나중에 구현 예정인 페이지들 (지금은 비활성 표시만)
    { href: "/me", label: "내 캐릭터", disabled: true },
    { href: "/battle", label: "전투하기", disabled: true },
];

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                {/* 로고 / 타이틀 */}
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="DNF AI Arena Logo"
                        width={36}
                        height={36}
                        className="object-contain"
                        priority
                    />
                    <div className="leading-tight">
                        <div className="text-sm font-semibold tracking-wide text-slate-50">
                            DNF AI Arena
                        </div>
                        <div className="text-[11px] text-slate-400">
                            던파 캐릭터 기반 AI 전투 & 일러스트
                        </div>
                    </div>
                </Link>

                {/* 네비게이션 */}
                <nav className="hidden items-center gap-3 text-xs md:flex">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const base =
                            "px-3 py-1.5 rounded-md border border-transparent transition-colors";

                        if (item.disabled) {
                            return (
                                <span
                                    key={item.href}
                                    className={`${base} cursor-not-allowed text-slate-500`}
                                    title="추후 업데이트 예정"
                                >
                                    {item.label}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={
                                    base +
                                    " " +
                                    (isActive
                                        ? "border-amber-500 bg-amber-500/10 text-amber-300"
                                        : "text-slate-300 hover:border-slate-700 hover:bg-slate-900")
                                }
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* 오른쪽: 로그인 버튼 (나중에 세션 연결) */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/auth/login"
                        className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-400"
                    >
                        로그인
                    </Link>
                </div>
            </div>
        </header>
    );
}
