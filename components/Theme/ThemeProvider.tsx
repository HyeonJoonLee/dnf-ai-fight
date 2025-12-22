"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToHtml(theme: Theme) {
    const root = document.documentElement; // <html>
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // ✅ 기본은 다크
    const [theme, setThemeState] = useState<Theme>("dark");

    useEffect(() => {
        // localStorage 있으면 그걸 우선
        const saved = (localStorage.getItem("theme") as Theme | null) ?? null;
        const next: Theme = saved === "light" ? "light" : "dark";
        setThemeState(next);
        applyThemeToHtml(next);
    }, []);

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem("theme", t);
        applyThemeToHtml(t);
    };

    const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

    const value = useMemo(() => ({ theme, setTheme, toggle }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}