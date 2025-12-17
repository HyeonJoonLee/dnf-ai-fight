export type DnfCharacter = {
  serverId: string;
  dnfCharacterId: string;
  name: string;
  level: number;
  jobName: string;
  imageUrl: string; // 캐릭터 이미지 URL(Neople)
};

export async function fetchDnfCharacter(serverId: string, characterName: string): Promise<DnfCharacter> {
  const apiKey = process.env.NEOPLE_API_KEY;
  if (!apiKey) throw new Error("NEOPLE_API_KEY가 설정되어 있지 않습니다.");

  const searchUrl =
    `https://api.neople.co.kr/df/servers/${serverId}/characters` +
    `?characterName=${encodeURIComponent(characterName)}` +
    `&wordType=full&limit=1&apikey=${apiKey}`;

  const searchRes = await fetch(searchUrl, { cache: "no-store" });
  if (!searchRes.ok) throw new Error(`캐릭터 검색 실패: ${await searchRes.text()}`);

  const searchJson: any = await searchRes.json();
  const row = searchJson.rows?.[0];
  if (!row) throw new Error("해당 조건의 캐릭터를 찾을 수 없습니다.");

  const dnfCharacterId = row.characterId as string;
  const name = row.characterName as string;
  const level = row.level as number;
  const jobName = row.jobGrowName as string;

  const imageUrl = `https://img-api.neople.co.kr/df/servers/${serverId}/characters/${dnfCharacterId}?zoom=2`;

  return { serverId, dnfCharacterId, name, level, jobName, imageUrl };
}
