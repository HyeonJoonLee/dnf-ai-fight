export const CHARACTER_BACKGROUNDS = [
    {
        key: "A",
        label: "숲",
        image: "/character-bg/bg-a.png",
        position: "center 5%",
        color: "bg-emerald-400",
    },
    {
        key: "B",
        label: "벚꽃",
        image: "/character-bg/bg-b.png",
        position: "center 5%",
        color: "bg-[#ff69b4]",
    },
    {
        key: "C",
        label: "거미",
        image: "/character-bg/bg-c.jpg",
        position: "center 50%",
        color: "bg-indigo-400",
    },
    {
        key: "D",
        label: "비취",
        image: "/character-bg/bg-d.jpg",
        position: "center 100%",
        color: "bg-slate-400",
    },
] as const;

export type CharacterBgKey =
    typeof CHARACTER_BACKGROUNDS[number]["key"];
