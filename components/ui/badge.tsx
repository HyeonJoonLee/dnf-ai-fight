import * as React from "react";

type BadgeVariant = "primary" | "muted";

export function Badge({
    variant = "muted",
    className = "",
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold";

    const variants: Record<BadgeVariant, string> = {
        primary: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
        muted: "bg-slate-800/60 text-slate-300 border border-slate-700",
    };

    return <span {...props} className={`${base} ${variants[variant]} ${className}`} />;
}
