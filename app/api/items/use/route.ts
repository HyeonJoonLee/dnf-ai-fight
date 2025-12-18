import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 너 프로젝트 경로에 맞게
import { auth } from "@/auth"; // NextAuth v5 기준. v4면 getServerSession로

type ItemKey = "revive_coin" | "fatigue_potion_10" | "fatigue_potion_30";

function getFatigueAmount(itemKey: ItemKey): number | null {
    if (itemKey === "fatigue_potion_10") return 10;
    if (itemKey === "fatigue_potion_30") return 30;
    return null;
}

// (선택) 자연회복 정산. “사용/전투” 시점에만 호출하면 됨.
function recalcFatigueLocal(params: {
    fatigue: number;
    capBase: number;
    updatedAt: Date;
    now: Date;
    // 예: 5분당 1 회복
    minutesPerPoint?: number;
}) {
    const { fatigue, capBase, updatedAt, now } = params;
    const minutesPerPoint = params.minutesPerPoint ?? 5;

    const diffMs = now.getTime() - updatedAt.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const gained = Math.floor(diffMin / minutesPerPoint);

    if (gained <= 0) return { fatigue, newUpdatedAt: updatedAt };

    // 자연회복은 capBase까지만
    const recovered = Math.min(capBase, fatigue + gained);
    return { fatigue: recovered, newUpdatedAt: now };
}

export async function POST(req: Request) {
    const session = await auth();

    const userId = session?.user?.id;
    if (!userId) {
        return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const userCharacterId = body?.userCharacterId as string | undefined;
    const itemKey = body?.itemKey as ItemKey | undefined;
    const qty = Number(body?.qty ?? 1);

    if (!userCharacterId || !itemKey || !Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 422 });
    }
    
    // ✅ 여기부터 추가
    const SKIP_DB = process.env.SKIP_DB === "1";
    if (SKIP_DB) {
        const add = getFatigueAmount(itemKey);
        const nowIso = new Date().toISOString();

        // revive는 잠금 해제, potion은 피로도 증가(오버캡 허용) 느낌만 내줌
        return NextResponse.json({
            ok: true,
            itemKey,
            consumedQty: qty,
            userCharacter: {
                id: userCharacterId,
                fatigue: add ? 30 + add * qty : 30,
                fatigue_updated_at: nowIso,
                locked_until: itemKey === "revive_coin" ? null : null,
            },
            inventory: { itemKey, qty: 999 },
            debug: "SKIP_DB",
        });
    }
    // ✅ 추가 끝

    const now = new Date();

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1) 아이템 존재 확인
            const item = await tx.items.findUnique({
                where: { key: itemKey },
                select: { id: true, key: true },
            });
            if (!item) {
                return { status: 404 as const, payload: { ok: false, error: "ITEM_NOT_FOUND" } };
            }

            // 2) 내 캐릭터인지 확인 + 현재 상태 읽기
            const uc = await tx.user_characters.findFirst({
                where: { id: userCharacterId, user_id: userId },
                select: {
                    id: true,
                    user_id: true,
                    fatigue: true,
                    fatigue_cap_base: true,
                    fatigue_updated_at: true,
                    locked_until: true,
                },
            });
            if (!uc) {
                return { status: 403 as const, payload: { ok: false, error: "NOT_YOUR_CHARACTER" } };
            }

            // 3) 상태 검증 (revive는 잠금 상태일 때만)
            if (itemKey === "revive_coin") {
                if (!uc.locked_until || uc.locked_until.getTime() <= now.getTime()) {
                    return { status: 409 as const, payload: { ok: false, error: "CHARACTER_NOT_LOCKED" } };
                }
            }

            // 4) 인벤토리 원자적 차감 (qty 부족하면 0 rows)
            const dec = await tx.user_inventory.updateMany({
                where: {
                    user_id: userId,
                    item_id: item.id,
                    qty: { gte: qty },
                },
                data: { qty: { decrement: qty } },
            });

            if (dec.count !== 1) {
                return { status: 409 as const, payload: { ok: false, error: "INSUFFICIENT_ITEM" } };
            }

            // 5) 효과 적용
            if (itemKey === "revive_coin") {
                const updated = await tx.user_characters.update({
                    where: { id: uc.id },
                    data: { locked_until: null },
                    select: {
                        id: true,
                        fatigue: true,
                        fatigue_updated_at: true,
                        locked_until: true,
                    },
                });

                const inv = await tx.user_inventory.findFirst({
                    where: { user_id: userId, item_id: item.id },
                    select: { qty: true },
                });

                return {
                    status: 200 as const,
                    payload: {
                        ok: true,
                        itemKey,
                        consumedQty: qty,
                        userCharacter: updated,
                        inventory: { itemKey, qty: inv?.qty ?? 0 },
                    },
                };
            }

            // fatigue potion
            const add = getFatigueAmount(itemKey);
            if (add == null) {
                return { status: 422 as const, payload: { ok: false, error: "UNKNOWN_ITEM_EFFECT" } };
            }

            // (선택) 자연회복 정산 후 물약 적용
            const { fatigue: recFatigue, newUpdatedAt } = recalcFatigueLocal({
                fatigue: uc.fatigue,
                capBase: uc.fatigue_cap_base,
                updatedAt: uc.fatigue_updated_at,
                now,
                minutesPerPoint: 5, // 여기 정책만 바꾸면 됨
            });

            const updated = await tx.user_characters.update({
                where: { id: uc.id },
                data: {
                    fatigue: recFatigue + add * qty, // 오버캡 허용
                    fatigue_updated_at: newUpdatedAt,
                },
                select: {
                    id: true,
                    fatigue: true,
                    fatigue_updated_at: true,
                    locked_until: true,
                },
            });

            const inv = await tx.user_inventory.findFirst({
                where: { user_id: userId, item_id: item.id },
                select: { qty: true },
            });

            return {
                status: 200 as const,
                payload: {
                    ok: true,
                    itemKey,
                    consumedQty: qty,
                    userCharacter: updated,
                    inventory: { itemKey, qty: inv?.qty ?? 0 },
                },
            };
        });

        return NextResponse.json(result.payload, { status: result.status });
    } catch (e) {
        return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }
}
