// src/lib/battle/winrate.ts
export type BattleStats = {
    power: number;     // 공격력
    toughness: number; // 방어/체력
    speed: number;     // 선공/턴
    control: number;   // 견제/상태이상
    burst: number;     // 순간딜
    sustain: number;   // 유지력/회복
};

export type TagKey =
    | "돌진" | "폭딜" | "연타" | "암살" | "마무리"
    | "탱킹" | "버티기" | "흡혈" | "회피" | "불굴"
    | "견제" | "속박" | "제압" | "카운터" | "역습"
    | "선공" | "가속" | "폭주" | "은신" | "기동"
    | "계산적" | "광기" | "집중" | "분산";

type TagBonus = Partial<BattleStats> & { score?: number };

// ✅ 태그 보정치 (MVP 초안)
// - 숫자는 언제든 튜닝하면 됨
export const TAG_BONUS: Record<TagKey, TagBonus> = {
    돌진: { power: +6, speed: +3, toughness: -2 },
    폭딜: { burst: +8, power: +3, sustain: -4 },
    연타: { power: +3, speed: +2, sustain: +1 },
    암살: { burst: +7, speed: +4, toughness: -3 },
    마무리: { burst: +3, power: +2, score: +2 },

    탱킹: { toughness: +8, sustain: +3, speed: -3 },
    버티기: { toughness: +5, sustain: +3, burst: -2 },
    흡혈: { sustain: +6, power: +2 },
    회피: { speed: +3, toughness: +2, control: +1 },
    불굴: { toughness: +3, power: +2, score: +2 },

    견제: { control: +7, speed: +2, burst: -2 },
    속박: { control: +8, speed: -1 },
    제압: { control: +4, toughness: +2, score: +1 },
    카운터: { burst: +4, control: +2 },
    역습: { burst: +5, control: +3 },

    선공: { speed: +7 },
    가속: { speed: +2, power: +2, score: +1 },
    폭주: { power: +4, burst: +3, score: +1 }, // 조건부는 나중에 확장
    은신: { speed: +4, burst: +3, control: +1 },
    기동: { speed: +3, control: +2 },

    계산적: { control: +2, score: +2 },
    광기: { score: +2 }, // 랜덤성은 전투 연출에서 반영 가능
    집중: { power: +2, burst: +2 },
    분산: { toughness: +2, sustain: +2, burst: -1 },
};

// ✅ 스탯 가중치(점수화). MVP로는 이 정도가 안정적
export const STAT_WEIGHTS: BattleStats = {
    power: 1.0,
    toughness: 0.95,
    speed: 1.05,
    control: 0.9,
    burst: 1.0,
    sustain: 0.9,
};

export type Fighter = {
    id: string;
    name: string;
    stats: BattleStats;   // base stats (0~100 권장)
    tags: TagKey[];       // 3개 고정 권장
};

export type WinrateResult = {
    pA: number; // A 승률 (0~1)
    pB: number; // B 승률 (0~1)
    scoreA: number;
    scoreB: number;
    delta: number; // scoreA - scoreB
    breakdown: {
        baseA: number;
        baseB: number;
        tagA: number;
        tagB: number;
    };
};

// 유틸
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function dot(stats: BattleStats, weights: BattleStats) {
    return (
        stats.power * weights.power +
        stats.toughness * weights.toughness +
        stats.speed * weights.speed +
        stats.control * weights.control +
        stats.burst * weights.burst +
        stats.sustain * weights.sustain
    );
}

function applyTagBonus(base: BattleStats, tags: TagKey[]): { stats: BattleStats; tagScore: number } {
    const out: BattleStats = { ...base };
    let tagScore = 0;

    for (const t of tags) {
        const b = TAG_BONUS[t];
        if (!b) continue;
        if (b.power) out.power += b.power;
        if (b.toughness) out.toughness += b.toughness;
        if (b.speed) out.speed += b.speed;
        if (b.control) out.control += b.control;
        if (b.burst) out.burst += b.burst;
        if (b.sustain) out.sustain += b.sustain;
        if (b.score) tagScore += b.score;
    }

    // 스탯 범위를 관리하고 싶으면 여기서 클램프(선택)
    out.power = clamp(out.power, 0, 120);
    out.toughness = clamp(out.toughness, 0, 120);
    out.speed = clamp(out.speed, 0, 120);
    out.control = clamp(out.control, 0, 120);
    out.burst = clamp(out.burst, 0, 120);
    out.sustain = clamp(out.sustain, 0, 120);

    return { stats: out, tagScore };
}

// ✅ 로지스틱 승률 변환
// k가 클수록 확률이 완만해져서 "너무 한쪽으로 쏠리는" 걸 방지함
function logistic(diff: number, k: number) {
    return 1 / (1 + Math.exp(-diff / k));
}

/**
 * 승률 계산 (MVP)
 * - stats는 0~100 기준 권장
 * - tags 3개를 적용해 보정
 * - 점수 차이를 로지스틱으로 승률화
 */
export function calcWinrate(a: Fighter, b: Fighter, opts?: { k?: number }): WinrateResult {
    const k = opts?.k ?? 18; // ✅ MVP 기본값 (너무 쏠리지 않게)

    const baseA = dot(a.stats, STAT_WEIGHTS);
    const baseB = dot(b.stats, STAT_WEIGHTS);

    const aAfter = applyTagBonus(a.stats, a.tags);
    const bAfter = applyTagBonus(b.stats, b.tags);

    const afterA = dot(aAfter.stats, STAT_WEIGHTS) + aAfter.tagScore;
    const afterB = dot(bAfter.stats, STAT_WEIGHTS) + bAfter.tagScore;

    const delta = afterA - afterB;
    const pA = logistic(delta, k);
    const pB = 1 - pA;

    return {
        pA,
        pB,
        scoreA: afterA,
        scoreB: afterB,
        delta,
        breakdown: {
            baseA,
            baseB,
            tagA: afterA - baseA,
            tagB: afterB - baseB,
        },
    };
}
