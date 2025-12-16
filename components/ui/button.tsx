"use client";

import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function Button({
    variant = "primary",
    size = "md",
    className = "",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
}) {
    const base =
        "inline-flex items-center justify-center rounded-md font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";

    const sizes: Record<ButtonSize, string> = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
    };

    const variants: Record<ButtonVariant, string> = {
        primary: "bg-amber-500 text-slate-950 hover:bg-amber-400",
        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
        ghost: "border border-slate-700 text-slate-200 hover:bg-slate-800",
        danger: "bg-red-500 text-slate-50 hover:bg-red-400",
    };

    return (
        <button
            {...props}
            className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        />
    );
}
