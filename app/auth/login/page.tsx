// app/auth/login/page.tsx
//http://localhost:3000/api/auth/session <- auth 확인 방법 링크
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleKakaoLogin = () => {
    signIn("kakao", { callbackUrl: "/" });
  };

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
        {/* 상단 타이틀 */}
        <div className="mb-5 text-center">
          <h1 className="text-xl font-semibold text-slate-50">
            DNF AI Arena 로그인
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Google 또는 Kakao 계정으로 로그인하면
            <br />
            캐릭터를 등록하고 전투 기록 & 일러스트 기능을 사용할 수 있어요.
          </p>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-200"
          >
            {/* 아이콘은 나중에 넣어도 됨 */}
            <span>Google 계정으로 계속하기</span>
          </button>

          <button
            type="button"
            onClick={handleKakaoLogin}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[#f5dd00]"
          >
            <span>Kakao 계정으로 계속하기</span>
          </button>
        </div>

        {/* 설명문 & 앞으로 추가될 기능 안내 */}
        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          최초 로그인 시 자동으로 계정이 생성되며,{" "}
          <span className="text-slate-300">최대 4개의 캐릭터 슬롯</span>이
          제공됩니다.
          <br />
          이후에는 도전형 PVP 전투, 승리 수 기준 일러스트 생성 등 기능이
          순차적으로 추가될 예정입니다.
        </p>

        {/* 아래 링크 */}
        <div className="mt-6 flex items-center justify-between text-[11px] text-slate-500">
          <Link href="/" className="hover:text-amber-300">
            ← 메인 화면으로 돌아가기
          </Link>
          <span className="text-slate-600">
            아직은 데모 버전이에요.
          </span>
        </div>
      </div>
    </main>
  );
}
