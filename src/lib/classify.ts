import type { Source, Topic } from '../types/post.ts';

export const COUNTRIES = ['台灣', '日本', '泰國', '澳洲', '馬來西亞'];

export const LANG_LABEL = '英文版本';

const TRAVEL_TYPE_RULES: [string, RegExp][] = [
    ['住宿', /住宿|飯店|旅館|民宿|hotel|accommodation|hostel|ryokan|resort/i],
    ['酒吧', /酒吧|bar\b|居酒屋|cocktail|speakeasy/i],
    ['景點', /景點|attraction|park\b/i],
    ['美食', /美食|餐廳|咖啡|cafe|甜點|早餐|restaurant/i],
    ['交通', /航空|airlines|機場|鐵路|新幹線|租車|jr\b/i],
    ['行程', /自由行|自助旅行|旅遊|行程|懶人包|攻略|itinerary/i],
];

export const TRAVEL_TYPES = TRAVEL_TYPE_RULES.map(([type]) => type);

export function classifyTravelType(
    title: string,
    labels: string[]
): string | undefined {
    const fromLabel = labels.find((label) => TRAVEL_TYPES.includes(label));
    if (fromLabel !== undefined) return fromLabel;
    const head = title.split('|').slice(0, 2).join(' | ');
    return TRAVEL_TYPE_RULES.find(([, pattern]) => pattern.test(head))?.[0];
}

const ALGO_TAGS = ['algorithms', 'leetcode', '演算法'];
const ALGO_TITLE = /\[LeetCode 解題紀錄\]|演算法筆記|基礎演算法/;

export function deriveTopic(
    source: Source,
    title: string,
    tags: string[]
): Topic {
    if (source === 'blogger') return 'travel';
    if (tags.some((tag) => ALGO_TAGS.includes(tag))) return 'algo';
    if (ALGO_TITLE.test(title)) return 'algo';
    return 'tech';
}

export function splitPlaces(tags: string[]): {
    countries: string[];
    places: string[];
} {
    return {
        countries: tags.filter((tag) => COUNTRIES.includes(tag)),
        places: tags.filter(
            (tag) =>
                !COUNTRIES.includes(tag) &&
                !TRAVEL_TYPES.includes(tag) &&
                tag !== LANG_LABEL
        ),
    };
}
