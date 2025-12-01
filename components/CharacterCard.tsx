"use client";

import Image from "next/image";
import { useState } from "react";

interface CharacterCardProps {
  name: string;
  serverName: string;
  spriteUrl: string;
  aiImageUrl?: string;
}

export function CharacterCard({
  name,
  serverName,
  spriteUrl,
  aiImageUrl,
}: CharacterCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (!aiImageUrl) return;
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative w-[320px] h-[420px] [perspective:1200px]"
        onClick={handleClick}
      >
        <div
          className={[
            "relative h-full w-full rounded-3xl bg-slate-900/60 border border-slate-700/70 shadow-xl",
            "transition-transform duration-700 [transform-style:preserve-3d]",
            isFlipped ? "[transform:rotateY(180deg)]" : "",
          ].join(" ")}
        >
          <div
            className={[
              "absolute inset-0 flex flex-col items-center justify-center p-4",
              "[backface-visibility:hidden]",
            ].join(" ")}
          >
            <div className="text-sm text-sky-300 mb-2">{serverName} 서버</div>
            <div className="text-lg font-semibold text-slate-50 mb-4">{name}</div>

            <div className="relative w-full h-full max-h-[320px] rounded-2xl bg-slate-800/80 flex items-center justify-center overflow-hidden">
              <Image
                src={spriteUrl}
                alt={name}
                width={260}
                height={320}
                className="object-contain drop-shadow-[0_0_18px_rgba(0,0,0,0.7)]"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              클릭하면 AI 일러스트 카드로 뒤집어집니다.
            </p>
          </div>

          <div
            className={[
              "absolute inset-0 flex flex-col items-center justify-center p-4",
              "[backface-visibility:hidden]",
              "[transform:rotateY(180deg)]",
            ].join(" ")}
          >
            <div className="text-sm text-pink-300 mb-2">AI 일러스트 뷰</div>
            <div className="text-lg font-semibold text-slate-50 mb-4">{name}</div>

            <div className="relative w-full h-full max-h-[320px] rounded-2xl bg-slate-800/80 flex items-center justify-center overflow-hidden">
              {aiImageUrl ? (
                <Image
                  src={aiImageUrl}
                  alt={`${name} AI illustration`}
                  width={260}
                  height={320}
                  className="object-contain"
                />
              ) : (
                <span className="text-slate-400 text-sm">
                  아직 AI 일러스트가 없습니다.
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              다시 클릭하면 원본 캐릭터 카드로 돌아갑니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
