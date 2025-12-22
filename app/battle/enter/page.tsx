// app/battle/enter/page.tsx
import { Suspense } from "react";
import EnterClient from "./EnterClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-[calc(100vh-56px)] bg-slate-950 text-slate-100 p-6">로딩중...</div>}>
            <EnterClient />
        </Suspense>
    );
}
