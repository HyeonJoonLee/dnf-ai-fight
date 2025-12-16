import { Fighter, BattleStats, STAT_WEIGHTS, TAG_BONUS, TagKey } from "./winrate";

type Point = {
    key: string;
    score: number;      // +면 A에게 유리, -면 B에게 유리
    text: string;
};

const STAT_LABEL: Record<keyof BattleStats, string> = {
    power: "공격력",
    toughness: "내구도",
    speed: "속도",
    control: "제어",
    burst: "폭발력",
    sustain: "유지력",
};

function statContribution(a: BattleStats, b: BattleStats) {
    const points: Point[] = [];

    (Object.keys(STAT_LABEL) as (keyof BattleStats)[]).forEach((k) => {
        const diff = (a[k] - b[k]) * STAT_WEIGHTS[k];
        if (diff === 0) return;

        points.push({
            key: `stat:${k}`,
            score: diff,
            text:
                diff > 0
                    ? `${STAT_LABEL[k]} 우위로 주도권을 잡았습니다. (+${Math.abs(diff).toFixed(1)})`
                    : `${STAT_LABEL[k]} 열세를 다른 강점으로 메웠습니다. (-${Math.abs(diff).toFixed(1)})`,
        });
    });

    return points;
}

function tagContribution(aTags: TagKey[], bTags: TagKey[]) {
    const points: Point[] = [];

    // 태그로 인한 "점수(score)" 기여
    const sumTagScore = (tags: TagKey[]) =>
        tags.reduce((acc, t) => acc + (TAG_BONUS[t]?.score ?? 0), 0);

    const aScore = sumTagScore(aTags);
    const bScore = sumTagScore(bTags);
    const diffScore = aScore - bScore;

    if (diffScore !== 0) {
        points.push({
            key: "tag:score",
            score: diffScore,
            text:
                diffScore > 0
                    ? `전투 성향(태그) 시너지에서 우위를 가져갔습니다. (+${diffScore.toFixed(1)})`
                    : `전투 성향(태그) 상성에서 불리했지만 운영으로 극복했습니다. (-${Math.abs(diffScore).toFixed(1)})`,
        });
    }

    // 태그 자체도 “승부 포인트”로 노출 (가벼운 템플릿)
    // A가 가진 태그 중에서 "가장 영향 큰" 태그(보정 합이 큰 것) 1~2개를 뽑아줌
    const tagImpact = (t: TagKey) => {
        const b = TAG_BONUS[t] ?? {};
        return (
            Math.abs(b.power ?? 0) +
            Math.abs(b.toughness ?? 0) +
            Math.abs(b.speed ?? 0) +
            Math.abs(b.control ?? 0) +
            Math.abs(b.burst ?? 0) +
            Math.abs(b.sustain ?? 0) +
            Math.abs(b.score ?? 0)
        );
    };

    const topATag = [...aTags].sort((x, y) => tagImpact(y) - tagImpact(x))[0];
    if (topATag) {
        points.push({
            key: `tag:${topATag}`,
            score: 2, // 그냥 랭킹용(설명용) 점수
            text: `핵심 태그 '${topATag}'를 중심으로 전투 플랜이 잘 맞았습니다.`,
        });
    }

    return points;
}

export function buildBattleHighlights(a: Fighter, b: Fighter, max = 3) {
    // base stats 기준으로 비교(태그 보정까지 포함하고 싶으면 applyTagBonus 결과를 넣으면 됨)
    const points = [
        ...statContribution(a.stats, b.stats),
        ...tagContribution(a.tags, b.tags),
    ];

    // A에게 유리한 요인 위주 TOP N
    const top = points
        .sort((p1, p2) => Math.abs(p2.score) - Math.abs(p1.score))
        .slice(0, max)
        .map((p) => p.text);

    // 혹시 데이터가 너무 비슷해서 포인트가 없으면 기본 문구
    if (top.length === 0) {
        return [
            "스탯과 성향이 비슷한 접전이었습니다.",
            "작은 차이가 누적되어 승부가 갈렸습니다.",
            "상대의 강점을 크게 허용하지 않은 운영이 결정적이었습니다.",
        ].slice(0, max);
    }

    return top;
}
