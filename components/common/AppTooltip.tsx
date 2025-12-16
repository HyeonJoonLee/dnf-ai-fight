"use client";

import * as React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type AppTooltipProps = {
    content: React.ReactNode;
    children: React.ReactNode;

    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;

    delayDuration?: number;
    disabled?: boolean;
    className?: string;
};

export default function AppTooltip({
    content,
    children,
    side = "top",
    align = "center",
    sideOffset = 8,
    delayDuration = 150,
    disabled = false,
    className,
}: AppTooltipProps) {
    if (disabled) return <>{children}</>;

    return (
        <TooltipProvider delayDuration={delayDuration}>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent
                    side={side}
                    align={align}
                    sideOffset={sideOffset}
                    className={
                        [
                            // ✅ 여기서 프로젝트 전체 툴팁 디자인 통일
                            "rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg",
                            "border border-white/10",
                            "select-none",
                            className,
                        ]
                            .filter(Boolean)
                            .join(" ")
                    }
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
