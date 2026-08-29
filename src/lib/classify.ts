import type { Source, Topic } from '../types/post.ts';

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
