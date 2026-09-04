import type { Source, Topic } from '../types/post.ts';

// Only the Chinese posts carry place labels. The English half is published
// with the `en` label and nothing else, so it contributes no countries — its
// one tag is the type derived from the title below.
export const COUNTRIES = ['台灣', '日本', '泰國', '澳洲', '馬來西亞'];

export const LANG_LABEL = 'en';

const TRAVEL_TYPE_RULES: [string, RegExp][] = [
    ['住宿', /住宿|飯店|旅館|民宿|hotel|accommodation|hostel|ryokan|resort/i],
    ['酒吧', /酒吧|bar\b|居酒屋|cocktail|speakeasy/i],
    ['景點', /景點|attraction|park\b/i],
    ['美食', /美食|餐廳|咖啡|cafe|甜點|早餐|restaurant/i],
    ['交通', /航空|airlines|機場|鐵路|新幹線|租車|jr\b/i],
    ['行程', /自由行|自助旅行|旅遊|行程|懶人包|攻略|itinerary/i],
];

// Same six buckets, named in English, for the `en` posts. Kept as a parallel
// table rather than a translation of the result so a Chinese post can never
// pick up an English type tag, or the reverse.
const EN_TRAVEL_TYPE_RULES: [string, RegExp][] = [
    ['Accommodation', /hotel|accommodation|hostel|ryokan|resort|stay\b/i],
    ['Bar', /\bbars?\b|izakaya|cocktail|speakeasy|nightlife/i],
    ['Attractions', /attraction|sightseeing|park\b/i],
    ['Food', /\bfood\b|restaurant|cafe|coffee|dessert|breakfast|dining/i],
    ['Transport', /airlines|airport|railway|shinkansen|car rental|\bjr\b|flight/i],
    ['Itinerary', /itinerary|independent travel|travel guide|trip\b/i],
];

export const ZH_TRAVEL_TYPES = TRAVEL_TYPE_RULES.map(([type]) => type);
export const EN_TRAVEL_TYPES = EN_TRAVEL_TYPE_RULES.map(([type]) => type);
export const TRAVEL_TYPES = [...ZH_TRAVEL_TYPES, ...EN_TRAVEL_TYPES];

export function classifyTravelType(
    title: string,
    labels: string[]
): string | undefined {
    // An `en` post is classified against the English table only, so the type
    // tag it gains is in the same language as the rest of its facets.
    const english = labels.includes(LANG_LABEL);
    const types = english ? EN_TRAVEL_TYPES : ZH_TRAVEL_TYPES;
    const rules = english ? EN_TRAVEL_TYPE_RULES : TRAVEL_TYPE_RULES;
    const fromLabel = labels.find((label) => types.includes(label));
    if (fromLabel !== undefined) return fromLabel;
    const head = title.split('|').slice(0, 2).join(' | ');
    return rules.find(([, pattern]) => pattern.test(head))?.[0];
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
