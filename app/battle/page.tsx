// app/battle/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function BattlePage() {
    return (
        <main className="relative min-h-[calc(100vh-64px)]">
            {/* Background image */}
            <Image
                src="/images/coming-soon.png"
                alt="전투 시스템 준비 중"
                fill
                priority
                className="object-cover"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/55" />

            {/* Content */}
            <section className="relative z-10 flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
                <div className="w-full max-w-xl text-center">
                    <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                        전투 시스템 개발 중
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                        전투하기는 아직 준비 중이에요
                    </h1>

                    <p className="mt-4 text-base leading-relaxed text-white/80">
                        캐릭터 등록/분석 기능을 먼저 안정화한 뒤,
                        비동기 도전형 PVP 전투를 순차적으로 공개할 예정입니다.
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/"
                            className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-white/90"
                        >
                            홈으로 돌아가기
                        </Link>

                        <Link
                            href="/me"
                            className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur hover:bg-white/15"
                        >
                            내 캐릭터로 이동
                        </Link>
                    </div>                
                </div>
            </section>
        </main>
    );
}
