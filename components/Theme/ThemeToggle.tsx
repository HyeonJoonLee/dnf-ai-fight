"use client";

import { useTheme } from "@/components/Theme/ThemeProvider";

export default function ThemeToggle() {
    const { theme, toggle } = useTheme();

    return (
        <button
            type="button"
            onClick={toggle}
            className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                "transition",
                // ✅ 다크/라이트 공통
                "border-black/10 bg-black/5 text-black/80 hover:bg-black/10",
                // ✅ 다크일 때는 반대로 보이게
                "dark:border-white/10 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10",
                // ✅ 은은한 포커스
                "focus:outline-none focus:ring-2 focus:ring-amber-400/40 dark:focus:ring-amber-300/30",
            ].join(" ")}
            aria-label="테마 전환"
            title={theme === "dark" ? "라이트모드로" : "다크모드로"}
        >
            <span className="text-base leading-none">{theme === "dark" ? "🌙" : "☀️"}</span>
        </button>
    );
}
