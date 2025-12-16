import * as React from "react";

export function Card({
    className = "",
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={[
                "rounded-2xl border border-slate-800 bg-slate-900/40",
                "shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
                className,
            ].join(" ")}
        />
    );
}

export function CardHeader({
    className = "",
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={["border-b border-slate-800 px-5 py-4", className].join(" ")}
        />
    );
}

export function CardBody({
    className = "",
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={["p-5", className].join(" ")} />;
}
