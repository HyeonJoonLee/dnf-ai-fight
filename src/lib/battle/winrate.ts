// src/lib/battle/winrate.ts
export type BattleStats = {
    hp: number;       // ✅ 160~200 (10단위)
    power: number;    // 공격력
    defense: number;  // 방어력
    speed: number;    // 속도
    range: number;    // 사거리/원거리
    physical: number; // 물리
    magic: number;    // 마법
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
    돌진: { power: +6, speed: +3, defense: -2 },
    폭딜: { power: +8, defense: -3, score: +1 },
    연타: { power: +3, speed: +2 },
    암살: { power: +7, speed: +4, defense: -3 },
    마무리: { power: +3, score: +2 },

    탱킹: { defense: +8, speed: -3, score: +1 },
    버티기: { defense: +6, score: +1 },
    흡혈: { defense: +3, power: +2, score: +1 },
    회피: { speed: +3, defense: +2 },
    불굴: { defense: +3, power: +2, score: +2 },

    견제: { range: +6, speed: +2, score: +1 },
    속박: { range: +4, speed: -1, score: +1 },
    제압: { power: +2, defense: +2, score: +1 },
    카운터: { power: +4, score: +1 },
    역습: { power: +5, speed: +2, score: +1 },

    선공: { speed: +7, score: +1 },
    가속: { speed: +2, power: +2, score: +1 },
    폭주: { power: +4, speed: +2, score: +1 },
    은신: { speed: +4, power: +3, score: +1 },
    기동: { speed: +3, range: +2 },

    계산적: { range: +2, score: +2 },
    광기: { score: +2 },
    집중: { power: +2, physical: +2, magic: +2 },
    분산: { defense: +2, range: +2, score: -1 },
};
// ✅ 스탯 가중치(점수화). MVP로는 이 정도가 안정적
export const STAT_WEIGHTS: BattleStats = {
    hp:1.0,
    power: 1.0,
    defense: 0.95,
    speed: 1.05,
    physical: 0.9,
    magic: 0.9,
    range: 0.9,
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
    const hpTo01 = (hp: number) => ((hp - 160) / 40) * 100; // 0~100화
    return (
        hpTo01(stats.hp) * weights.hp +
        stats.power * weights.power +
        stats.defense * weights.defense +
        stats.speed * weights.speed +
        stats.physical * weights.physical +
        stats.magic * weights.magic +
        stats.range * weights.range
    );
}

function applyTagBonus(base: BattleStats, tags: TagKey[]) {
    const out: BattleStats = { ...base };
    let tagScore = 0;

    for (const t of tags) {
        const b = TAG_BONUS[t];
        if (!b) continue;
        if (b.power) out.power += b.power;
        if (b.defense) out.defense += b.defense;
        if (b.speed) out.speed += b.speed;
        if (b.physical) out.physical += b.physical;
        if (b.magic) out.magic += b.magic;
        if (b.range) out.range += b.range;
        if (b.score) tagScore += b.score;
    }

    // clamp(선택)
    out.power = clamp(out.power, 0, 120);
    out.defense = clamp(out.defense, 0, 120);
    out.speed = clamp(out.speed, 0, 120);
    out.physical = clamp(out.physical, 0, 120);
    out.magic = clamp(out.magic, 0, 120);
    out.range = clamp(out.range, 0, 120);

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
