import { describe, expect, it } from 'vitest';
import { deriveTopic } from '../src/lib/classify.ts';

describe('deriveTopic', () => {
    it('sends every blogger post to travel', () => {
        expect(deriveTopic('blogger', '札幌住宿 | 某飯店', ['日本'])).toBe(
            'travel'
        );
    });

    it('uses medium tags before the title', () => {
        expect(
            deriveTopic('medium', '演算法筆記系列 — QuadTree 與 GeoHash', [
                'algorithms',
                'geohash',
            ])
        ).toBe('algo');
        expect(deriveTopic('medium', '不帶線索的標題', ['leetcode'])).toBe(
            'algo'
        );
        expect(deriveTopic('medium', '不帶線索的標題', ['演算法'])).toBe(
            'algo'
        );
    });

    it('falls back to the title for seed posts that have no tags', () => {
        expect(
            deriveTopic('medium', '[LeetCode 解題紀錄] 139. Word Break', [])
        ).toBe('algo');
        expect(deriveTopic('medium', '基礎演算法系列 — Sort', [])).toBe('algo');
    });

    it('treats everything else on medium as tech', () => {
        expect(
            deriveTopic('medium', 'AI 學習筆記 — LLM 底層原理淺談', [
                'llm',
                'ai',
            ])
        ).toBe('tech');
        expect(deriveTopic('medium', '什麼是 SLI、SLO與 SLA 呢？', [])).toBe(
            'tech'
        );
    });
});
