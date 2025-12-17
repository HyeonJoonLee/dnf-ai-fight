export const TAG_KEYS = [
  "돌진","폭딜","연타","암살","마무리",
  "탱킹","버티기","흡혈","회피","불굴",
  "견제","속박","제압","카운터","역습",
  "선공","가속","폭주","은신","기동",
  "계산적","광기","집중","분산",
] as const;

export type TagKey = typeof TAG_KEYS[number];

export const TAG_SET = new Set<string>(TAG_KEYS);
