// components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import AppTooltip from "@/components/common/AppTooltip";
import ThemeToggle from "@/components/Theme/ThemeToggle";

type NavItem = {
    href: string;
    label: string;
    authRequired: boolean;
};

const navItems: NavItem[] = [
    { href: "/", label: "메인", authRequired: false },
    { href: "/me", label: "내 캐릭터", authRequired: true },
    { href: "/battle", label: "전투하기", authRequired: true },
];

export default function Header() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const user = session?.user;
    const isAuthed = status === "authenticated";

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
                            던파 캐릭터 기반 RPG 아레나
                        </div>
                    </div>
                </Link>

                {/* 네비게이션 */}
                <nav className="hidden items-center gap-3 text-xs md:flex">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const isDisabled = item.authRequired && !isAuthed;

                        const base =
                            "px-3 py-1.5 rounded-md border border-transparent transition-colors";

                        if (isDisabled) {
                            return (
                                <AppTooltip key={item.href} content="로그인 후 이용 가능합니다">
                                    <span                                        
                                        className={`${base} cursor-not-allowed text-slate-500`}
                                    >
                                        {item.label}
                                    </span>
                                </AppTooltip>
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

                {/* 오른쪽: 테마 토글 + 로그인/유저 */}
                <div className="flex items-center gap-2">
                    {/* ✅ 다크/라이트 토글 버튼 */}
                    <ThemeToggle />

                    {status === "loading" ? (
                        <div className="h-8 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                    ) : isAuthed ? (
                        <div className="flex items-center gap-2">
                            {/* 프로필 */}
                            <div className="flex items-center gap-2 rounded-md border px-2 py-1.5
                              border-slate-200 bg-slate-50
                              dark:border-slate-800 dark:bg-slate-900/60">
                                <div className="relative h-6 w-6 overflow-hidden rounded-full border
                                border-slate-200 bg-slate-100
                                dark:border-slate-700 dark:bg-slate-800">
                                    {user?.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={user.image}
                                            alt="profile"
                                            className="h-6 w-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-6 w-6" />
                                    )}
                                </div>

                                <div className="max-w-[120px] truncate text-xs text-slate-800 dark:text-slate-200">
                                    {user?.name ?? "유저"}
                                </div>
                            </div>

                            {/* 로그아웃 */}
                            <button
                                type="button"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="rounded-md border px-3 py-1.5 text-xs font-semibold
                           border-slate-200 bg-white text-slate-800 hover:bg-slate-100
                           dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/auth/login"
                            className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-400"
                        >
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}